-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- RLS policies (admin-only read, anyone can insert their own)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all analytics" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Monetization: Premium features table
CREATE TABLE IF NOT EXISTS premium_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly_kes INTEGER NOT NULL,
  price_yearly_kes INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES premium_features(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON user_subscriptions(status);

-- Ad impressions tracking
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  ad_type TEXT NOT NULL,
  placement TEXT NOT NULL,
  clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_user ON ad_impressions(user_id);

-- Seed premium features
INSERT INTO premium_features (name, description, price_monthly_kes, price_yearly_kes, features) VALUES
('Pro Professional', 'Enhanced professional profile with priority visibility', 500, 5000, '["Priority listing", "Advanced analytics", "Custom branding", "Priority support"]'),
('Student Plus', 'Unlimited access to all quizzes and learning materials', 200, 2000, '["Unlimited quizzes", "Study guides", "Progress tracking", "Certificate generation"]'),
('Business Boost', 'Enhanced marketplace features for sellers', 300, 3000, '["Featured listings", "Bulk posting", "Sales analytics", "Verified badge"]')
ON CONFLICT (name) DO NOTHING;

-- RLS for premium tables
ALTER TABLE premium_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active premium features" ON premium_features
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert ad impressions" ON ad_impressions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read ad impressions" ON ad_impressions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );