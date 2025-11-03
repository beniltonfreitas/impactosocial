-- Criar tabela para vídeos gerados por IA
CREATE TABLE IF NOT EXISTS public.ai_generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration TEXT DEFAULT '5s',
  resolution TEXT DEFAULT '720p',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ai_generated_videos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own videos"
  ON public.ai_generated_videos
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own videos"
  ON public.ai_generated_videos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON public.ai_generated_videos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar bucket para vídeos gerados
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-generated-videos', 'ai-generated-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para vídeos
CREATE POLICY "Public videos are viewable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ai-generated-videos');

CREATE POLICY "Users can upload their own videos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-generated-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own videos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ai-generated-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );