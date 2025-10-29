import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface NewsFiltersProps {
  onFilterChange: (filters: { categoryId?: string; orderBy: string }) => void;
  initialCategory?: string;
  initialOrderBy?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function NewsFilters({ 
  onFilterChange, 
  initialCategory = "all", 
  initialOrderBy = "recent" 
}: NewsFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [orderBy, setOrderBy] = useState(initialOrderBy);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');
      
      if (data) setCategories(data);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    onFilterChange({
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      orderBy,
    });
  }, [selectedCategory, orderBy, onFilterChange]);

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setOrderBy("recent");
  };

  const hasActiveFilters = selectedCategory !== "all" || orderBy !== "recent";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={orderBy} onValueChange={setOrderBy}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Mais recentes</SelectItem>
          <SelectItem value="views">Mais lidos</SelectItem>
          <SelectItem value="relevance">Relevância</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <>
          <div className="flex gap-2">
            {selectedCategory !== "all" && (
              <Badge variant="secondary">
                {categories.find(c => c.id === selectedCategory)?.name}
              </Badge>
            )}
            {orderBy !== "recent" && (
              <Badge variant="secondary">
                {orderBy === "views" ? "Mais lidos" : "Relevância"}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar filtros
          </Button>
        </>
      )}
    </div>
  );
}
