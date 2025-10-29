-- Promover bs7freitas@gmail.com a admin
-- Primeiro, verificar se o usuário existe e buscar seu ID
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Buscar o user_id baseado no email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'bs7freitas@gmail.com';
  
  -- Se o usuário existe, adicionar role de admin
  IF target_user_id IS NOT NULL THEN
    -- Inserir role admin (ignora se já existe devido ao unique constraint)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuário % promovido a admin com sucesso', target_user_id;
  ELSE
    RAISE NOTICE 'Usuário com email bs7freitas@gmail.com não encontrado. Crie a conta primeiro.';
  END IF;
END $$;