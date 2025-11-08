import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Clock, Eye, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';

interface OptimalTimesSuggestionProps {
  categoryId?: string;
  onSelectTime?: (date: Date) => void;
}

export function OptimalTimesSuggestion({ categoryId, onSelectTime }: OptimalTimesSuggestionProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    loadSuggestions();
  }, [categoryId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-optimal-time', {
        body: { categoryId }
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      setMetadata(data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTime = (hour: number) => {
    const now = new Date();
    const suggestedDate = new Date(now);
    suggestedDate.setHours(hour, 0, 0, 0);
    
    if (suggestedDate < now) {
      suggestedDate.setDate(suggestedDate.getDate() + 1);
    }
    
    onSelectTime?.(suggestedDate);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Analisando melhores horários...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Horários Recomendados
        </CardTitle>
        <CardDescription>
          {metadata?.hasHistoricalData
            ? metadata.message
            : 'Sugestões baseadas em melhores práticas'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold">{suggestion.hour}h</span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {format(new Date().setHours(suggestion.hour, 0), 'HH:mm')}
                  </span>
                  <Badge variant={suggestion.rank <= 1 ? 'default' : 'secondary'}>
                    Score: {suggestion.score}
                  </Badge>
                  {suggestion.rank === 1 && (
                    <Badge className="bg-yellow-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Melhor horário
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {suggestion.reason}
                </p>
                {suggestion.avgViewsFirstHour && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Eye className="h-3 w-3" />
                    Média: {suggestion.avgViewsFirstHour} views na 1ª hora
                  </p>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSelectTime(suggestion.hour)}
            >
              Usar este horário
            </Button>
          </div>
        ))}

        {!metadata?.hasHistoricalData && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              💡 <strong>Dica:</strong> Após publicar alguns artigos, o sistema aprenderá os melhores horários 
              para sua audiência e fornecerá sugestões personalizadas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
