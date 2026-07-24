-- Migration: Parent/Mzazi system, Tip split (70/30), Payouts, Tutorial tracking
-- Run this after the first migration in your Supabase SQL Editor

-- 1. Add parent and minor fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false;

-- 2. PARENT LINKS (parents register children and approve professionals)
CREATE TABLE IF NOT EXISTS parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  children JSONB DEFAULT '[]'::jsonb,
  approved_professional_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id)
);

ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can read own links"
  ON parent_links FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own links"
  ON parent_links FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own links"
  ON parent_links FOR UPDATE
  USING (parent_id = auth.uid());

CREATE POLICY "Admins can read all parent_links"
  ON parent_links FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Add tip split columns to tips table
ALTER TABLE tips ADD COLUMN IF NOT EXISTS platform_amount NUMERIC DEFAULT 0;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS professional_amount NUMERIC DEFAULT 0;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'cancelled'));

-- 4. PAYOUTS (admin tracks 70/30 split payouts to professionals)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tip_id UUID REFERENCES tips(id) ON DELETE CASCADE NOT NULL,
  amount_professional NUMERIC NOT NULL CHECK (amount_professional > 0),
  amount_platform NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can read own payouts"
  ON payouts FOR SELECT
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can read all payouts"
  ON payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage payouts"
  ON payouts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Enable realtime for payouts
ALTER publication supabase_realtime ADD TABLE payouts;

-- 6. Update existing tips with calculated split values (run once)
UPDATE tips SET
  professional_amount = ROUND(amount * 0.7),
  platform_amount = amount - ROUND(amount * 0.7)
WHERE professional_amount IS NULL OR professional_amount = 0;

-- 7. NYUMBA KUMI (neighborhood security community)
CREATE TABLE IF NOT EXISTS nyumba_kumi_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'alert', 'question', 'info')),
  county TEXT NOT NULL DEFAULT 'Nairobi',
  location TEXT,
  urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nyumba_kumi_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nyumba_kumi posts"
  ON nyumba_kumi_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert posts"
  ON nyumba_kumi_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update own posts"
  ON nyumba_kumi_posts FOR UPDATE USING (author_id = auth.uid());

CREATE TABLE IF NOT EXISTS nyumba_kumi_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES nyumba_kumi_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nyumba_kumi_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read replies"
  ON nyumba_kumi_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert replies"
  ON nyumba_kumi_replies FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER publication supabase_realtime ADD TABLE nyumba_kumi_posts;
ALTER publication supabase_realtime ADD TABLE nyumba_kumi_replies;

-- 8. AUTO-CREATE TRIGGER: Profile on user signup (runs when auth.users row created)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, heshima_score, role, interests, preferred_lang)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    100,
    'user',
    '{}',
    COALESCE(NEW.raw_user_meta_data->>'preferred_lang', 'en')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. AUTO-CREATE TRIGGER: Professional entry when request approved
CREATE OR REPLACE FUNCTION public.handle_professional_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.professionals (profile_id, title, bio, qualifications, qualifications_doc_url, expertise, verification_status, verified_by, verified_at)
    VALUES (NEW.profile_id, NEW.title, NEW.bio, NEW.qualifications, NEW.qualifications_doc_url, NEW.expertise, 'approved', NEW.reviewed_by, NEW.reviewed_at)
    ON CONFLICT (profile_id) DO UPDATE SET
      title = EXCLUDED.title, bio = EXCLUDED.bio, qualifications = EXCLUDED.qualifications,
      verification_status = 'approved', verified_by = EXCLUDED.verified_by, verified_at = EXCLUDED.verified_at;
    UPDATE public.profiles SET role = 'expert' WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_professional_request_approved ON public.professional_requests;
CREATE TRIGGER on_professional_request_approved
  AFTER UPDATE OF status ON public.professional_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.handle_professional_approved();
