-- Create site_ai_config table
CREATE TABLE public.site_ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_name text DEFAULT 'Site AI' NOT NULL,
  agent_description text,
  agent_instructions text,
  knowledge_files jsonb DEFAULT '[]'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.site_ai_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own site_ai_config"
  ON public.site_ai_config
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own site_ai_config"
  ON public.site_ai_config
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own site_ai_config"
  ON public.site_ai_config
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own site_ai_config"
  ON public.site_ai_config
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-ai-knowledge',
  'site-ai-knowledge',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies
CREATE POLICY "Users can upload own knowledge files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-ai-knowledge' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own knowledge files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'site-ai-knowledge' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own knowledge files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-ai-knowledge' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update trigger for updated_at
CREATE TRIGGER update_site_ai_config_updated_at
  BEFORE UPDATE ON public.site_ai_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();