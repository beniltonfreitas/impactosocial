import { useState, useRef, useEffect } from "react";
import { X, Search, FileText, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface AgentPanelProps {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AI_AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

async function callAIAgent(type: 'search' | 'summarize' | 'chat', payload: string, history?: Message[]) {
  const response = await fetch(AI_AGENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    },
    body: JSON.stringify({ type, payload, history })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro na requisição');
  }

  return await response.json();
}

export default function AgentPanel({ onClose }: AgentPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState('');
  const [summary, setSummary] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat para última mensagem
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setSearchResults('Buscando nas notícias...');
    
    try {
      const data = await callAIAgent('search', searchQuery);
      setSearchResults(data.response);
    } catch (error: any) {
      if (error.message.includes('rate_limit')) {
        toast.error('Muitas requisições. Aguarde alguns segundos.');
      } else if (error.message.includes('no_credits')) {
        toast.error('Créditos esgotados. Entre em contato com o suporte.');
      } else {
        toast.error('Erro ao buscar. Tente novamente.');
      }
      setSearchResults('Não foi possível realizar a busca. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    setSummary('Gerando resumo da página...');
    
    try {
      const pageText = document.body.innerText.slice(0, 3000);
      const data = await callAIAgent('summarize', pageText);
      setSummary(data.response);
    } catch (error: any) {
      toast.error('Erro ao resumir página.');
      setSummary('Não foi possível gerar o resumo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = { role: 'user', content: chatInput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatInput('');
    setIsLoading(true);

    try {
      const data = await callAIAgent('chat', chatInput, updatedMessages);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      if (error.message.includes('rate_limit')) {
        toast.error('Muitas requisições. Aguarde alguns segundos.');
      } else if (error.message.includes('no_credits')) {
        toast.error('Créditos esgotados.');
      } else {
        toast.error('Erro no chat. Tente novamente.');
      }
      // Remover mensagem do usuário em caso de erro
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="agent-panel"
      className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-background border rounded-2xl shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-300"
      role="dialog"
      aria-label="Painel do Agente IA"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Agente IA
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Fechar painel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="search" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </TabsTrigger>
          <TabsTrigger value="summarize" className="gap-2">
            <FileText className="h-4 w-4" />
            Resumir
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <div className="flex gap-2">
            <Input
              placeholder="O que você quer encontrar?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {searchResults || 'Digite sua busca acima'}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Summarize Tab */}
        <TabsContent value="summarize" className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <Button onClick={handleSummarize} disabled={isLoading} className="w-full">
            {isLoading ? 'Resumindo...' : 'Resumir Esta Página'}
          </Button>
          <ScrollArea className="flex-1">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {summary || 'Clique no botão acima para resumir a página atual'}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Inicie uma conversa com o agente IA
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <p className="text-sm text-muted-foreground">Digitando...</p>
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
              disabled={isLoading}
            />
            <Button onClick={handleChat} disabled={isLoading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
