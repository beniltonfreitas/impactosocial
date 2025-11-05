import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  context: string;
  updated_at: string;
}

const CONTEXTS = [
  { value: 'general', label: '🌍 Assistente Geral', description: 'Ajuda com qualquer tema' },
  { value: 'news', label: '📰 Assistente de Notícias', description: 'Análise e criação de conteúdo jornalístico' },
  { value: 'business', label: '💼 Consultor de Negócios', description: 'Estratégias e gestão empresarial' },
  { value: 'accessibility', label: '♿ Especialista em Acessibilidade PcD', description: 'Inclusão e direitos da pessoa com deficiência' },
];

export function ChatIAModule() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('general');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ia_chat_conversations')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ia_chat_messages')
        .select('*')
        .eq('conversation_id', currentConversation!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const contextInfo = CONTEXTS.find(c => c.value === context);
      const { data, error } = await supabase
        .from('ia_chat_conversations')
        .insert({
          user_id: user!.id,
          title: `${contextInfo?.label} - ${new Date().toLocaleDateString()}`,
          context
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentConversation(data.id);
      setConversations([data, ...conversations]);
      setMessages([]);
      toast.success('Nova conversa criada');
    } catch (error: any) {
      toast.error('Erro ao criar conversa: ' + error.message);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    if (!currentConversation) {
      await createNewConversation();
      // Aguardar um pouco para a conversa ser criada
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Salvar mensagem do usuário
      const { data: userMsg, error: userError } = await supabase
        .from('ia_chat_messages')
        .insert({
          conversation_id: currentConversation!,
          role: 'user',
          content: userMessage
        })
        .select()
        .single();

      if (userError) throw userError;
      setMessages([...messages, userMsg]);

      // Chamar IA
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-agent', {
        body: {
          type: 'chat',
          payload: userMessage,
          context,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (aiError) throw aiError;

      // Salvar resposta da IA
      const { data: assistantMsg, error: assistantError } = await supabase
        .from('ia_chat_messages')
        .insert({
          conversation_id: currentConversation!,
          role: 'assistant',
          content: aiResponse.response
        })
        .select()
        .single();

      if (assistantError) throw assistantError;
      setMessages(prev => [...prev, assistantMsg]);

      // Atualizar timestamp da conversa
      await supabase
        .from('ia_chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConversation!);

    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.message?.includes('rate limit')) {
        toast.error('Limite de IA excedido. Aguarde 1 minuto.');
      } else if (error.message?.includes('credits')) {
        toast.error('Créditos de IA esgotados. Contate o administrador.');
      } else {
        toast.error('Erro ao enviar mensagem: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      sendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Conversas */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Conversas</CardTitle>
          <Button onClick={createNewConversation} size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Nova Conversa
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setCurrentConversation(conv.id)}
                className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                  currentConversation === conv.id ? 'bg-accent' : ''
                }`}
              >
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Área de Chat */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat IA
              </CardTitle>
              <CardDescription>
                Converse com assistentes especializados
              </CardDescription>
            </div>
            <Select value={context} onValueChange={setContext}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEXTS.map((ctx) => (
                  <SelectItem key={ctx.value} value={ctx.value}>
                    <div>
                      <p className="font-medium">{ctx.label}</p>
                      <p className="text-xs text-muted-foreground">{ctx.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                <p>Inicie uma conversa enviando uma mensagem</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="p-4 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
              className="min-h-[80px]"
              disabled={loading}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Ctrl+Enter para enviar
              </p>
              <Button onClick={sendMessage} disabled={loading || !input.trim()} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}