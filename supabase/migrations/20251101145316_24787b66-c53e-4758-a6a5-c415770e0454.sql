-- Create enum for challenge types
CREATE TYPE public.challenge_type AS ENUM ('clicks_10', 'shares_5', 'conversions_3');

-- Table: community_referrals
CREATE TABLE public.community_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  generated_link TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.community_referrals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referrals"
  ON public.community_referrals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referrals"
  ON public.community_referrals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Table: community_stats
CREATE TABLE public.community_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_clicks INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank_position INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON public.community_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view ranking"
  ON public.community_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own stats"
  ON public.community_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.community_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Table: community_challenges
CREATE TABLE public.community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  current_value INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  points_reward INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON public.community_challenges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON public.community_challenges
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON public.community_challenges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to initialize user challenges
CREATE OR REPLACE FUNCTION public.init_user_challenges(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.community_challenges (user_id, challenge_type, target_value, points_reward)
  VALUES
    (_user_id, 'clicks_10', 10, 100),
    (_user_id, 'shares_5', 5, 200),
    (_user_id, 'conversions_3', 3, 500)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function to update community stats
CREATE OR REPLACE FUNCTION public.update_community_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure stats record exists
  INSERT INTO public.community_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update stats based on referral changes
  UPDATE public.community_stats
  SET
    total_clicks = (SELECT COALESCE(SUM(clicks), 0) FROM public.community_referrals WHERE user_id = NEW.user_id),
    total_shares = (SELECT COUNT(*) FROM public.community_referrals WHERE user_id = NEW.user_id),
    total_conversions = (SELECT COALESCE(SUM(conversions), 0) FROM public.community_referrals WHERE user_id = NEW.user_id),
    updated_at = now()
  WHERE user_id = NEW.user_id;

  -- Update challenges
  UPDATE public.community_challenges
  SET
    current_value = (
      CASE challenge_type
        WHEN 'clicks_10' THEN (SELECT total_clicks FROM public.community_stats WHERE user_id = NEW.user_id)
        WHEN 'shares_5' THEN (SELECT total_shares FROM public.community_stats WHERE user_id = NEW.user_id)
        WHEN 'conversions_3' THEN (SELECT total_conversions FROM public.community_stats WHERE user_id = NEW.user_id)
      END
    ),
    completed = (current_value >= target_value),
    completed_at = CASE WHEN (current_value >= target_value AND completed = false) THEN now() ELSE completed_at END
  WHERE user_id = NEW.user_id;

  -- Calculate points
  UPDATE public.community_stats
  SET points = (
    (total_clicks * 1) + 
    (total_shares * 5) + 
    (total_conversions * 50) +
    (SELECT COALESCE(SUM(points_reward), 0) FROM public.community_challenges WHERE user_id = NEW.user_id AND completed = true)
  )
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Trigger to update stats after referral changes
CREATE TRIGGER trigger_update_community_stats
AFTER INSERT OR UPDATE ON public.community_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_community_stats();

-- Trigger to initialize challenges for new users
CREATE OR REPLACE FUNCTION public.init_community_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create initial stats
  INSERT INTO public.community_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  -- Create initial challenges
  PERFORM public.init_user_challenges(NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_init_community
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.init_community_for_new_user();