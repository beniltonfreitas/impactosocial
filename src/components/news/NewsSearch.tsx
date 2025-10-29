import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NewsSearchProps {
  onSearch: (term: string) => void;
  initialValue?: string;
}

export function NewsSearch({ onSearch, initialValue = "" }: NewsSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <div className="relative w-full max-w-md" role="search">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar notícias..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-10"
        aria-label="Buscar notícias"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
