-- Promover bs7freitas@gmail.com para admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('6ccfe4a5-ed59-4e4e-8f94-99f23c07c322', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;