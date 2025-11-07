import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Filter } from 'lucide-react';

interface AdvancedFiltersProps {
  articles: any[];
  onFilterChange: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  search: string;
  status: string;
  category: string;
  author: string;
  tags: string[];
  dateType: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

export function AdvancedFilters({ articles, onFilterChange, currentFilters }: AdvancedFiltersProps) {
  const [uniqueAuthors, setUniqueAuthors] = useState<string[]>([]);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);

  useEffect(() => {
    // Extrair autores únicos
    const authors = [...new Set(articles.map(a => a.author).filter(Boolean))].sort();
    setUniqueAuthors(authors);

    // Extrair tags únicas
    const allTags = articles.flatMap(a => a.tags || []);
    const tags = [...new Set(allTags)].sort();
    setUniqueTags(tags);
  }, [articles]);

  const toggleTag = (tag: string) => {
    const newTags = currentFilters.tags.includes(tag)
      ? currentFilters.tags.filter(t => t !== tag)
      : [...currentFilters.tags, tag];
    onFilterChange({ ...currentFilters, tags: newTags });
  };

  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      category: 'all',
      author: 'all',
      tags: [],
      dateType: 'all',
      dateFrom: undefined,
      dateTo: undefined
    });
  };

  const hasActiveFilters = 
    currentFilters.search ||
    currentFilters.status !== 'all' ||
    currentFilters.category !== 'all' ||
    currentFilters.author !== 'all' ||
    currentFilters.tags.length > 0 ||
    currentFilters.dateFrom ||
    currentFilters.dateTo;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* Filtro por Autor */}
        <Select 
          value={currentFilters.author} 
          onValueChange={(value) => onFilterChange({ ...currentFilters, author: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por autor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os autores</SelectItem>
            {uniqueAuthors.map(author => (
              <SelectItem key={author} value={author}>
                {author}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Tags */}
        <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              <span>Tags {currentFilters.tags.length > 0 && `(${currentFilters.tags.length})`}</span>
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar tag..." />
              <CommandList>
                <CommandGroup>
                  {uniqueTags.map(tag => (
                    <CommandItem
                      key={tag}
                      onSelect={() => toggleTag(tag)}
                      className="cursor-pointer"
                    >
                      <Checkbox 
                        checked={currentFilters.tags.includes(tag)} 
                        className="mr-2"
                      />
                      <span>{tag}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar todos
          </Button>
        )}
      </div>

      {/* Badges de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentFilters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {currentFilters.search}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, search: '' })}
              />
            </Badge>
          )}
          {currentFilters.author !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Autor: {currentFilters.author}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, author: 'all' })}
              />
            </Badge>
          )}
          {currentFilters.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              Tag: {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
