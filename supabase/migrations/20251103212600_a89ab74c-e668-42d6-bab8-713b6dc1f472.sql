-- Criar tabela para armazenar imagens geradas por IA
CREATE TABLE public.ai_generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  image_url text NOT NULL,
  quality text DEFAULT 'standard',
  size text DEFAULT '1024x1024',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ai_images_user ON public.ai_generated_images(user_id);
CREATE INDEX idx_ai_images_created ON public.ai_generated_images(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.ai_generated_images ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver próprias imagens e imagens públicas
CREATE POLICY "Users can view own images"
  ON public.ai_generated_images FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Usuários podem inserir próprias imagens
CREATE POLICY "Users can insert own images"
  ON public.ai_generated_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar próprias imagens
CREATE POLICY "Users can delete own images"
  ON public.ai_generated_images FOR DELETE
  USING (auth.uid() = user_id);

-- Criar storage bucket para imagens geradas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-generated-images',
  'ai-generated-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage bucket
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-generated-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-generated-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ai-generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );