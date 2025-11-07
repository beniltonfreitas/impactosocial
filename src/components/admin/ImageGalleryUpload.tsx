import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Image as ImageIcon, Upload, Edit2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  credit?: string;
}

interface ImageGalleryUploadProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  maxImages?: number;
}

export function ImageGalleryUpload({ 
  value = [], 
  onChange,
  maxImages = 10 
}: ImageGalleryUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `articles/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('article-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Limite atingido',
        description: `Você pode adicionar no máximo ${maxImages} imagens`,
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validar arquivos
    const validFiles = filesToUpload.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType) {
        toast({
          title: 'Formato inválido',
          description: `${file.name} não é um formato suportado (JPG, PNG, WEBP, GIF)`,
          variant: 'destructive',
        });
        return false;
      }

      if (!isValidSize) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede o limite de 5MB`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = validFiles.map(uploadImage);
      const uploadedUrls = await Promise.all(uploadPromises);

      const newImages: GalleryImage[] = uploadedUrls
        .filter((url): url is string => url !== null)
        .map(url => ({
          id: Math.random().toString(36).substring(2),
          url,
        }));

      onChange([...value, ...newImages]);

      toast({
        title: 'Upload concluído',
        description: `${newImages.length} imagem(ns) adicionada(s) com sucesso`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Erro no upload',
        description: 'Ocorreu um erro ao fazer upload das imagens',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [value, maxImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const removeImage = (id: string) => {
    onChange(value.filter(img => img.id !== id));
  };

  const updateImage = (updatedImage: GalleryImage) => {
    onChange(value.map(img => img.id === updatedImage.id ? updatedImage : img));
    setEditingImage(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Galeria de Imagens</Label>
        <span className="text-sm text-muted-foreground">
          {value.length}/{maxImages} imagens
        </span>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}
          ${value.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          id="gallery-upload"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading || value.length >= maxImages}
          className="hidden"
        />
        <label htmlFor="gallery-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">
            {uploading ? 'Enviando imagens...' : 'Arraste imagens ou clique para selecionar'}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP, GIF até 5MB • Máximo {maxImages} imagens
          </p>
        </label>
      </div>

      {/* Gallery Grid */}
      {value.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma imagem adicionada
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione imagens para criar uma galeria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={image.url}
                alt={image.caption || `Galeria ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Erro';
                }}
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingImage(image)}
                  className="gap-2"
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="h-3 w-3" />
                  Remover
                </Button>
              </div>

              {/* Caption preview */}
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2 truncate">
                  {image.caption}
                </div>
              )}

              {/* Image number */}
              <div className="absolute top-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Imagem</DialogTitle>
          </DialogHeader>

          {editingImage && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden border">
                <img
                  src={editingImage.url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Legenda</Label>
                <Input
                  id="caption"
                  placeholder="Descrição da imagem..."
                  value={editingImage.caption || ''}
                  onChange={(e) => setEditingImage({
                    ...editingImage,
                    caption: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit">Crédito</Label>
                <Input
                  id="credit"
                  placeholder="Autor ou fonte da imagem..."
                  value={editingImage.credit || ''}
                  onChange={(e) => setEditingImage({
                    ...editingImage,
                    credit: e.target.value
                  })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingImage(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => editingImage && updateImage(editingImage)}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
