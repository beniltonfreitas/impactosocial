import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Plus, Image as ImageIcon } from 'lucide-react';

interface ImageGalleryManagerProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageGalleryManager({ 
  value = [], 
  onChange,
  maxImages = 10 
}: ImageGalleryManagerProps) {
  const [newImageUrl, setNewImageUrl] = useState('');

  const addImage = () => {
    const trimmedUrl = newImageUrl.trim();
    if (trimmedUrl && isValidUrl(trimmedUrl) && value.length < maxImages) {
      onChange([...value, trimmedUrl]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImage();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Galeria de Imagens</Label>
        <span className="text-sm text-muted-foreground">
          {value.length}/{maxImages} imagens
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://exemplo.com/imagem.jpg"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addImage}
          disabled={!newImageUrl.trim() || value.length >= maxImages}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma imagem adicionada
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione URLs de imagens para criar uma galeria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group aspect-video rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={imageUrl}
                alt={`Galeria ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Erro+ao+carregar';
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Imagem {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
