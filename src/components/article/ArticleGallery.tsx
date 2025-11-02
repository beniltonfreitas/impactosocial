import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  credit: string | null;
  display_order: number;
}

interface ArticleGalleryProps {
  articleId: string;
}

export function ArticleGallery({ articleId }: ArticleGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGallery();
  }, [articleId]);

  const loadGallery = async () => {
    try {
      const { data, error } = await supabase
        .from('article_gallery')
        .select('*')
        .eq('article_id', articleId)
        .order('display_order');

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % images.length);
  };

  return (
    <>
      <div className="my-12">
        <h2 className="text-2xl font-bold mb-6">Galeria de Imagens</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={image.image_url}
                alt={image.caption || `Imagem ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              {image.caption && (
                <div className="p-3 text-sm">
                  <p className="text-muted-foreground">{image.caption}</p>
                  {image.credit && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Crédito: {image.credit}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-7xl p-0 bg-black/95">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {selectedIndex !== null && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={() => setSelectedIndex(null)}
                >
                  <X className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>

                <div className="flex flex-col items-center max-w-6xl max-h-[85vh]">
                  <img
                    src={images[selectedIndex].image_url}
                    alt={images[selectedIndex].caption || ''}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                  {images[selectedIndex].caption && (
                    <div className="mt-4 text-center text-white">
                      <p className="text-lg">{images[selectedIndex].caption}</p>
                      {images[selectedIndex].credit && (
                        <p className="text-sm text-white/70 mt-2">
                          Crédito: {images[selectedIndex].credit}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="text-white/70 text-sm mt-2">
                    {selectedIndex + 1} / {images.length}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
