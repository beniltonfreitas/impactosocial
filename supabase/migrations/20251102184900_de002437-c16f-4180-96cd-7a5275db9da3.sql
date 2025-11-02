-- Corrigir avisos de segurança: adicionar search_path nas funções (sem DROP)

CREATE OR REPLACE FUNCTION public.update_social_challenge_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_count INTEGER;
  v_challenge_points INTEGER;
  v_total INTEGER;
  v_new_status TEXT;
  v_pix INTEGER;
  v_referral INTEGER;
BEGIN
  -- Buscar stats atuais
  SELECT pix_points, referral_points INTO v_pix, v_referral
  FROM public.social_challenge_stats
  WHERE user_id = NEW.user_id;
  
  -- Calcular desafios completados E VALIDADOS
  SELECT COUNT(*) INTO v_completed_count
  FROM public.user_challenge_progress
  WHERE user_id = NEW.user_id 
    AND completed = TRUE 
    AND admin_validated = TRUE;
  
  -- Calcular pontos de desafios VALIDADOS apenas
  SELECT COALESCE(SUM(sc.points_reward), 0) INTO v_challenge_points
  FROM public.user_challenge_progress ucp
  JOIN public.social_challenges sc ON sc.id = ucp.challenge_id
  WHERE ucp.user_id = NEW.user_id 
    AND ucp.completed = TRUE 
    AND ucp.admin_validated = TRUE;
  
  -- Calcular total
  v_total := v_challenge_points + COALESCE(v_pix, 0) + COALESCE(v_referral, 0);
  
  -- Determinar status
  IF v_completed_count >= 6 THEN
    v_new_status := 'apoiador_oficial';
  ELSIF v_completed_count >= 3 THEN
    v_new_status := 'ativo';
  ELSE
    v_new_status := 'participando';
  END IF;
  
  -- Atualizar ou inserir stats
  INSERT INTO public.social_challenge_stats (
    user_id,
    total_points,
    completed_challenges,
    challenge_points,
    pix_points,
    referral_points,
    status,
    updated_at
  ) VALUES (
    NEW.user_id,
    v_total,
    v_completed_count,
    v_challenge_points,
    COALESCE(v_pix, 0),
    COALESCE(v_referral, 0),
    v_new_status,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = v_total,
    completed_challenges = v_completed_count,
    challenge_points = v_challenge_points,
    status = v_new_status,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.init_social_challenge_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.social_challenge_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;