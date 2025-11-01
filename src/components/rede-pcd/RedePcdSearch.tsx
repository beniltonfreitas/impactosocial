import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const modules = [
  { nome: "PcD+", url: "/rede-pcd/feed", emoji: "📰", keywords: "notícias feed informação" },
  { nome: "PcD Direitos", url: "/rede-pcd/direitos", emoji: "⚖️", keywords: "direitos legislação jurídico" },
  { nome: "PcD Alerta", url: "/rede-pcd/alerta", emoji: "🚨", keywords: "denúncia fiscalização" },
  { nome: "PcD Play", url: "/rede-pcd/play", emoji: "▶️", keywords: "vídeos streaming lives" },
  { nome: "PcD Esportes", url: "/rede-pcd/esportes", emoji: "🏅", keywords: "esporte paralímpico adaptado" },
  { nome: "CDDPcD", url: "/rede-pcd/conselhos", emoji: "🏛️", keywords: "conselhos defesa" },
  { nome: "PcD Shop", url: "/rede-pcd/shop", emoji: "🛒", keywords: "loja marketplace compras" },
  { nome: "PcD Vitrine", url: "/rede-pcd/vitrine", emoji: "💼", keywords: "portfólio profissional negócios" },
  { nome: "PcD Blog", url: "/rede-pcd/blog", emoji: "✍️", keywords: "blog artigos autoria" },
  { nome: "PcD Academy", url: "/rede-pcd/academy", emoji: "🎓", keywords: "cursos educação formação" },
  { nome: "PcD Clube", url: "/rede-pcd/clube", emoji: "🤝", keywords: "benefícios descontos parceiros" },
  { nome: "PcD Rede do Bem", url: "/rede-pcd/rede-do-bem", emoji: "❤️", keywords: "campanhas solidariedade doação" }
];

interface RedePcdSearchProps {
  onResultClick?: () => void;
}

export function RedePcdSearch({ onResultClick }: RedePcdSearchProps) {
  const [busca, setBusca] = useState("");

  const resultados = modules.filter((modulo) =>
    modulo.nome.toLowerCase().includes(busca.toLowerCase()) ||
    modulo.keywords.toLowerCase().includes(busca.toLowerCase())
  );

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/20 text-foreground">{part}</mark>
        : part
    );
  };

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar módulos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 pr-10"
        />
        {busca && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBusca("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {busca && (
        <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
          {resultados.length > 0 ? (
            resultados.map((modulo, index) => (
              <Link
                key={index}
                to={modulo.url}
                onClick={onResultClick}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <span className="text-2xl">{modulo.emoji}</span>
                <span className="font-medium">
                  {highlightText(modulo.nome, busca)}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum módulo encontrado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
