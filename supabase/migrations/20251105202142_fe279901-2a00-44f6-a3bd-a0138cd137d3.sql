-- Corrigir search_path na função
CREATE OR REPLACE FUNCTION public.update_ia_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;