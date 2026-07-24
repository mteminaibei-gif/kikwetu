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
