import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  label?: string;
  suggestions?: string[];
}

export function TagsInput({ 
  value = [], 
  onChange, 
  maxTags = 12,
  placeholder = "Digite tags separadas por vírgula ou Enter",
  label = "Tags",
  suggestions = []
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      // Process comma-separated tags
      const tags = inputValue.split(',').map(t => t.trim()).filter(t => t);
      tags.forEach(tag => addTag(tag));
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const addSuggestion = (suggestion: string) => {
    addTag(suggestion);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {value.length}/{maxTags} tags
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-background">
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {value.length < maxTags && (
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6"
          />
        )}
      </div>

      {suggestions.length > 0 && value.length < maxTags && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Sugestões:</span>
          {suggestions
            .filter(s => !value.includes(s))
            .slice(0, 8)
            .map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addSuggestion(suggestion)}
                className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted-foreground/20 transition-colors"
              >
                + {suggestion}
              </button>
            ))}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Pressione Enter ou vírgula para adicionar. Use Backspace para remover a última tag.
      </p>
    </div>
  );
}
