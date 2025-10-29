import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';
import { 
  MessageCircle, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Send, 
  Mail, 
  Link2,
  Check
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: string, shareUrl: string) => {
    trackEvent('share', 'article', platform);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
      trackEvent('share', 'article', 'copy-link');
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent((description || title) + '\n\n' + url)}`,
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Compartilhe esta notícia</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => handleShare('whatsapp', shareLinks.whatsapp)}
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => handleShare('facebook', shareLinks.facebook)}
        >
          <Facebook className="h-4 w-4 text-blue-600" />
          Facebook
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => handleShare('twitter', shareLinks.twitter)}
        >
          <Twitter className="h-4 w-4 text-sky-500" />
          Twitter
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => handleShare('linkedin', shareLinks.linkedin)}
        >
          <Linkedin className="h-4 w-4 text-blue-700" />
          LinkedIn
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => handleShare('telegram', shareLinks.telegram)}
        >
          <Send className="h-4 w-4 text-sky-500" />
          Telegram
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => window.location.href = shareLinks.email}
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-2 sm:col-span-2"
          onClick={handleCopyLink}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Copiado!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              Copiar Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
