import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy } from 'lucide-react';

interface ReferralGeneratorProps {
  onGenerate: (targetUrl: string, refCode: string) => void;
  isGenerating: boolean;
  defaultRefCode: string;
}

export function ReferralGenerator({ onGenerate, isGenerating, defaultRefCode }: ReferralGeneratorProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [refCode, setRefCode] = useState(defaultRefCode);
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerate = () => {
    if (!targetUrl.startsWith('http')) {
      alert('Informe um link válido.');
      return;
    }
    onGenerate(targetUrl, refCode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📢 Divulgar e Ganhar Pontos
        </CardTitle>
        <CardDescription>
          Gere um link com seu código pessoal para compartilhar notícias Illúmina.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <Input
              type="url"
              placeholder="Cole o link da notícia"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <Input
              type="text"
              placeholder="seu-usuário (ref)"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !targetUrl}
              className="w-full"
            >
              {isGenerating ? 'Gerando...' : 'Gerar & Copiar Link'}
            </Button>
          </div>
        </div>

        {generatedLink && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Seu link de indicação
            </Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={generatedLink} />
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigator.clipboard.writeText(generatedLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
