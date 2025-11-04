import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Download, Copy, RefreshCw, Sparkles, Wrench, BarChart3, Youtube, Settings2, FileCode2, Image as ImageIcon, QrCode, Tag, Globe2, ShieldCheck, Gauge, Hash, Heading3, Scissors, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.error(e);
  }
}

function ToolCard({ 
  title, 
  description, 
  icon, 
  children, 
  footerExtra 
}: { 
  title: string; 
  description: string; 
  icon?: React.ReactNode; 
  children: React.ReactNode; 
  footerExtra?: React.ReactNode; 
}) {
  return (
    <Card className="rounded-2xl shadow-sm border-muted/30">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <span className="p-2 rounded-xl bg-muted/50">{icon ?? <Wrench className="h-5 w-5" />}</span>
          {title}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footerExtra ? <CardFooter className="flex items-center justify-between">{footerExtra}</CardFooter> : null}
    </Card>
  );
}

function OutputBox({ value, filename = "resultado.txt" }: { value: string; filename?: string }) {
  const { toast } = useToast();
  
  const download = () => {
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await copyToClipboard(value);
    toast({ description: "Copiado para a área de transferência!" });
  };

  return (
    <div className="mt-3 border rounded-xl p-3 bg-muted/30">
      <pre className="whitespace-pre-wrap text-sm leading-relaxed">{value || "(sem saída ainda)"}</pre>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copiar
        </Button>
        <Button variant="secondary" size="sm" onClick={download}>
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </Button>
      </div>
    </div>
  );
}

// Placeholders de IA – conectar ao Lovable AI quando necessário
async function iaRewrite(texto: string) {
  // TODO: conectar ao site-ai-chat ou criar edge function específica
  return `Versão Inclusiva IA:\n${texto}\n\n— CTA: Compartilhe o Impacto! —`;
}

async function iaKeywords(seed: string, cidade = "Cotia, SP") {
  const base = ["impacto social", "inclusão", "acessibilidade", "investimento", "moradia", "qualidade de vida", "empregos", "startup", "economia local", "cidade inteligente"];
  const out = base.map((k, i) => `${seed} ${cidade} ${k}`).slice(0, 10).join("\n");
  return out;
}

async function iaMeta(title: string, descriptionSeed: string) {
  return {
    title: `${title} | Impacto Social`.slice(0, 60),
    description: `Saiba como ${descriptionSeed} gera benefícios reais para a comunidade e fortalece a inclusão em Cotia.`.slice(0, 155),
  };
}

async function iaSocial(title: string, summary: string) {
  return {
    ytTitle: `${title} | Cotia Inclusiva`.slice(0, 70),
    ytDesc: `${summary}\n\n#Cotia #ImpactoSocial #Inclusão #PcD #Cidadania`,
    hashtags: ["#Cotia", "#ImpactoSocial", "#Inclusão", "#PcD", "#Cidadania", "#RedeDeApoio"].join(" "),
  };
}

async function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function PointsBadge({ points }: { points: number }) {
  return (
    <Badge className="rounded-full px-3 py-1 text-xs">
      <Sparkles className="h-3 w-3 mr-1" />
      +{points} pts
    </Badge>
  );
}

export default function IAStudio() {
  const [rewriteIn, setRewriteIn] = useState("");
  const [rewriteOut, setRewriteOut] = useState("");

  const [kwSeed, setKwSeed] = useState("");
  const [kwOut, setKwOut] = useState("");

  const [metaTitleIn, setMetaTitleIn] = useState("");
  const [metaDescIn, setMetaDescIn] = useState("");
  const [metaOut, setMetaOut] = useState<{ title: string; description: string } | null>(null);

  const [rankUrl, setRankUrl] = useState("");
  const [rankKeyword, setRankKeyword] = useState("");
  const [rankOut, setRankOut] = useState("(simulação) Use a API/worker de SERP para checar posição e histórico.");

  const [ytTitleIn, setYtTitleIn] = useState("");
  const [ytSummaryIn, setYtSummaryIn] = useState("");
  const [ytOut, setYtOut] = useState<{ ytTitle: string; ytDesc: string; hashtags: string } | null>(null);

  const [textUtilsIn, setTextUtilsIn] = useState("");
  const [slugOut, setSlugOut] = useState("");
  const [countOut, setCountOut] = useState({ chars: 0, words: 0, readMin: 0 });

  const doRewrite = async () => setRewriteOut(await iaRewrite(rewriteIn));
  const doKeywords = async () => setKwOut(await iaKeywords(kwSeed));
  const doMeta = async () => setMetaOut(await iaMeta(metaTitleIn, metaDescIn));
  const doRank = async () => setRankOut(`URL: ${rankUrl}\nTermo: ${rankKeyword}\nPosição: (ex.: #12)\nObservação: Conecte ao seu serviço SERP/Console para dados reais.`);
  const doSocial = async () => setYtOut(await iaSocial(ytTitleIn, ytSummaryIn));
  const doSlug = async () => setSlugOut(await slugify(textUtilsIn));
  const doCount = () => {
    const chars = textUtilsIn.length;
    const words = (textUtilsIn.trim().match(/\S+/g) || []).length;
    const readMin = Math.max(1, Math.round(words / 200));
    setCountOut({ chars, words, readMin });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            Studio – Ferramentas IA
          </h2>
          <p className="text-muted-foreground mt-1">
            Estúdio completo de ferramentas inteligentes para criadores, empreendedores e comunicadores sociais.
          </p>
        </div>
        <PointsBadge points={5} />
      </div>

      <Separator />

      <Tabs defaultValue="seo-conteudo" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="seo-conteudo"><BarChart3 className="h-4 w-4 mr-2" /> SEO & Conteúdo</TabsTrigger>
          <TabsTrigger value="social"><Youtube className="h-4 w-4 mr-2" /> YouTube & Redes</TabsTrigger>
          <TabsTrigger value="utilitarios"><FileCode2 className="h-4 w-4 mr-2" /> Utilitários</TabsTrigger>
          <TabsTrigger value="extras"><Gauge className="h-4 w-4 mr-2" /> Calculadoras & Extras</TabsTrigger>
        </TabsList>

        <TabsContent value="seo-conteudo" className="space-y-6 pt-4">
          <ToolCard
            title="Reescrever Artigos (IA inclusiva)"
            description="Otimize seu texto mantendo o sentido, com linguagem inclusiva e foco em impacto social."
            icon={<Sparkles className="h-5 w-5" />}
            footerExtra={<div className="text-xs text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Cada uso rende pontos no Desafio Social.</div>}
          >
            <div className="space-y-3">
              <Textarea value={rewriteIn} onChange={(e) => setRewriteIn(e.target.value)} placeholder="Cole seu texto aqui..." className="min-h-[140px]" />
              <div className="flex gap-2">
                <Button onClick={doRewrite}><Sparkles className="h-4 w-4 mr-2" /> Reescrever com IA</Button>
                <Button variant="secondary" onClick={() => { setRewriteIn(""); setRewriteOut(""); }}><RefreshCw className="h-4 w-4 mr-2" /> Limpar</Button>
              </div>
              <OutputBox value={rewriteOut} filename="reescrita.txt" />
            </div>
          </ToolCard>

          <ToolCard
            title="Gerador de Palavras‑Chave Locais"
            description="Descubra ideias de termos relevantes com foco regional (Cotia, SP)."
            icon={<Tag className="h-5 w-5" />}
          >
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label>Palavra-base</Label>
                <Input value={kwSeed} onChange={(e) => setKwSeed(e.target.value)} placeholder="Ex.: investimento verde" />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={doKeywords}><Tag className="h-4 w-4 mr-2" /> Gerar</Button>
              </div>
            </div>
            <OutputBox value={kwOut} filename="palavras-chave.txt" />
          </ToolCard>

          <ToolCard
            title="Meta Tags (Gerar & Analisar)"
            description="Crie título e descrição prontos para SEO social."
            icon={<Globe2 className="h-5 w-5" />}
          >
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Título da página</Label>
                <Input value={metaTitleIn} onChange={(e) => setMetaTitleIn(e.target.value)} placeholder="Ex.: Viver bem em Cotia" />
              </div>
              <div>
                <Label>Resumo/Descrição</Label>
                <Input value={metaDescIn} onChange={(e) => setMetaDescIn(e.target.value)} placeholder="Ex.: Por que Cotia é ótima para famílias e negócios" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={doMeta}><Globe2 className="h-4 w-4 mr-2" /> Gerar Meta</Button>
              <Button variant="secondary" onClick={() => setMetaOut(null)}><RefreshCw className="h-4 w-4 mr-2" /> Limpar</Button>
            </div>
            <div className="mt-3">
              <OutputBox value={metaOut ? `meta_title: ${metaOut.title}\nmeta_description: ${metaOut.description}` : ""} filename="meta-tags.txt" />
            </div>
          </ToolCard>

          <ToolCard
            title="Ranking de Página (simulado)"
            description="Cheque a posição para uma palavra-chave. Conecte ao seu serviço SERP para dados reais."
            icon={<BarChart3 className="h-5 w-5" />}
          >
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>URL</Label>
                <Input value={rankUrl} onChange={(e) => setRankUrl(e.target.value)} placeholder="https://impactosocial..." />
              </div>
              <div>
                <Label>Palavra‑chave</Label>
                <Input value={rankKeyword} onChange={(e) => setRankKeyword(e.target.value)} placeholder="Ex.: impacto social cotia" />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={doRank}><BarChart3 className="h-4 w-4 mr-2" /> Verificar</Button>
              </div>
            </div>
            <OutputBox value={rankOut} filename="ranking.txt" />
          </ToolCard>
        </TabsContent>

        <TabsContent value="social" className="space-y-6 pt-4">
          <ToolCard
            title="YouTube & Redes – Título/Descrição/Hashtags (IA)"
            description="Otimize suas publicações para alcance orgânico e impacto local."
            icon={<Youtube className="h-5 w-5" />}
          >
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Título base</Label>
                <Input value={ytTitleIn} onChange={(e) => setYtTitleIn(e.target.value)} placeholder="Ex.: Projeto PcD Cotia" />
              </div>
              <div>
                <Label>Resumo</Label>
                <Input value={ytSummaryIn} onChange={(e) => setYtSummaryIn(e.target.value)} placeholder="Conteúdo rápido do vídeo/post" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={doSocial}><Sparkles className="h-4 w-4 mr-2" /> Gerar com IA</Button>
              <Button variant="secondary" onClick={() => setYtOut(null)}><RefreshCw className="h-4 w-4 mr-2" /> Limpar</Button>
            </div>
            <div className="mt-3">
              <OutputBox value={ytOut ? `Título YouTube: ${ytOut.ytTitle}\n\nDescrição:\n${ytOut.ytDesc}\n\nHashtags: ${ytOut.hashtags}` : ""} filename="social-youtube.txt" />
            </div>
          </ToolCard>

          <ToolCard
            title="Gerador de link de inscrição / compartilhamento"
            description="Crie links prontos para crescer seu canal e campanhas."
            icon={<Hash className="h-5 w-5" />}
          >
            <div className="text-sm text-muted-foreground">
              Dica: adicione <code>?sub_confirmation=1</code> ao seu URL do canal YouTube para forçar o modal de inscrição.
            </div>
          </ToolCard>
        </TabsContent>

        <TabsContent value="utilitarios" className="space-y-6 pt-4">
          <ToolCard
            title="Conversor de Texto (slug, contagem, limpeza)"
            description="Ferramentas rápidas para preparar conteúdo."
            icon={<Heading3 className="h-5 w-5" />}
          >
            <Textarea value={textUtilsIn} onChange={(e) => setTextUtilsIn(e.target.value)} placeholder="Cole seu texto..." className="min-h-[120px]" />
            <div className="flex flex-wrap gap-2 mt-2">
              <Button size="sm" onClick={doSlug}><Scissors className="h-4 w-4 mr-2" /> Gerar Slug</Button>
              <Button size="sm" variant="secondary" onClick={doCount}><BarChart3 className="h-4 w-4 mr-2" /> Contar</Button>
              <Button size="sm" variant="secondary" onClick={() => setTextUtilsIn(textUtilsIn.replace(/\n+/g, " "))}>Remover Quebras</Button>
              <Button size="sm" variant="secondary" onClick={() => setTextUtilsIn("")}>Limpar</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <OutputBox value={slugOut} filename="slug.txt" />
              <OutputBox value={`caracteres: ${countOut.chars}\npalavras: ${countOut.words}\nleitura ~${countOut.readMin} min`} filename="contagem.txt" />
            </div>
          </ToolCard>

          <ToolCard
            title="QR Code Inteligente"
            description="Gere QR codes para campanhas do Impacto Social."
            icon={<QrCode className="h-5 w-5" />}
          >
            <div className="text-sm text-muted-foreground">
              Placeholder: conecte aqui seu gerador/exportador de QR (PNG/SVG) e aplique paleta do projeto.
            </div>
          </ToolCard>

          <ToolCard
            title="Imagem – Redimensionar/Compactar (IA)"
            description="Otimize imagens e gere alt text inclusivo."
            icon={<ImageIcon className="h-5 w-5" />}
          >
            <div className="text-sm text-muted-foreground">
              Placeholder: plugue seu compressor/convertor (JPG ↔ PNG ↔ WebP) e autosugestão de alt text com IA.
            </div>
          </ToolCard>
        </TabsContent>

        <TabsContent value="extras" className="space-y-6 pt-4">
          <ToolCard
            title="Calculadora de Engajamento / CPM"
            description="Estime performance orgânica para campanhas locais."
            icon={<Gauge className="h-5 w-5" />}
          >
            <div className="text-sm text-muted-foreground">
              Placeholder: implemente fórmulas de taxa de visualização, CTR e CPM baseado em entradas do usuário.
            </div>
          </ToolCard>

          <ToolCard
            title="Políticas & Termos (IA Brasil)"
            description="Gere Política de Privacidade, Termos e Aviso Legal compatíveis com LGPD."
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            <div className="text-sm text-muted-foreground">
              Placeholder: chame seu template IA para documentos legais (não substitui assessoria jurídica).
            </div>
          </ToolCard>
        </TabsContent>
      </Tabs>

      <Separator />

      <Accordion type="single" collapsible>
        <AccordionItem value="ajuda">
          <AccordionTrigger>Como conectar à sua IA e métricas?</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Substitua as funções <code>iaRewrite</code>, <code>iaKeywords</code>, <code>iaMeta</code> e <code>iaSocial</code> pelo Lovable AI via edge functions.</li>
              <li>Para <strong>Ranking</strong>, conecte a um worker SERP (Search Console API, Bing, ou provedor próprio) e salve histórico no Supabase.</li>
              <li>Para <strong>Imagem</strong> e <strong>QR</strong>, plugue serviços WebAssembly/Canvas ou APIs internas para geração local.</li>
              <li>Envie eventos de uso para seu módulo de gamificação (Desafio Social) e analytics.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
