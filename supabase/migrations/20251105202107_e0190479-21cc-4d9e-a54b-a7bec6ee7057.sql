-- Tabela de conversas do Chat IA
CREATE TABLE IF NOT EXISTS public.ia_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  context TEXT DEFAULT 'general', -- 'news', 'business', 'accessibility', 'general'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mensagens do Chat IA
CREATE TABLE IF NOT EXISTS public.ia_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ia_chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pipelines de IA
CREATE TABLE IF NOT EXISTS public.ia_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- [{ type: 'chat', input: '...', config: {...} }]
  template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de execuções de pipelines
CREATE TABLE IF NOT EXISTS public.ia_pipeline_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES public.ia_pipelines(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_data JSONB,
  results JSONB,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Tabela de análises de planilhas
CREATE TABLE IF NOT EXISTS public.ia_spreadsheet_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  summary TEXT,
  insights JSONB, -- array de insights
  chart_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.ia_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_pipeline_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_spreadsheet_analyses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ia_chat_conversations
CREATE POLICY "Users can manage own conversations" ON public.ia_chat_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para ia_chat_messages
CREATE POLICY "Users can view messages from own conversations" ON public.ia_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ia_chat_conversations
      WHERE ia_chat_conversations.id = ia_chat_messages.conversation_id
        AND ia_chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own conversations" ON public.ia_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ia_chat_conversations
      WHERE ia_chat_conversations.id = ia_chat_messages.conversation_id
        AND ia_chat_conversations.user_id = auth.uid()
    )
  );

-- Políticas RLS para ia_pipelines
CREATE POLICY "Users can manage own pipelines" ON public.ia_pipelines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view template pipelines" ON public.ia_pipelines
  FOR SELECT USING (template = true OR auth.uid() = user_id);

-- Políticas RLS para ia_pipeline_executions
CREATE POLICY "Users can manage own executions" ON public.ia_pipeline_executions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para ia_spreadsheet_analyses
CREATE POLICY "Users can manage own analyses" ON public.ia_spreadsheet_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_ia_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ia_chat_conversations_updated_at
  BEFORE UPDATE ON public.ia_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ia_updated_at_column();

CREATE TRIGGER update_ia_pipelines_updated_at
  BEFORE UPDATE ON public.ia_pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ia_updated_at_column();