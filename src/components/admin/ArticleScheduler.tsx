import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { OptimalTimesSuggestion } from './OptimalTimesSuggestion';

interface ArticleSchedulerProps {
  value: {
    publishMode: 'immediate' | 'scheduled';
    scheduledFor?: Date;
    notifyBefore: boolean;
  };
  onChange: (value: any) => void;
  categoryId?: string;
}

export function ArticleScheduler({ value, onChange, categoryId }: ArticleSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(value.scheduledFor);
  const [time, setTime] = useState<string>(
    value.scheduledFor ? format(value.scheduledFor, 'HH:mm') : '10:00'
  );

  useEffect(() => {
    if (value.publishMode === 'scheduled' && date) {
      const [hours, minutes] = time.split(':');
      const scheduledDate = new Date(date);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes));
      onChange({ ...value, scheduledFor: scheduledDate });
    }
  }, [date, time]);

  const handleModeChange = (mode: 'immediate' | 'scheduled') => {
    onChange({ ...value, publishMode: mode });
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
  };

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() + 5);

  const handleSelectSuggestedTime = (suggestedDate: Date) => {
    setDate(suggestedDate);
    setTime(format(suggestedDate, 'HH:mm'));
    onChange({ ...value, publishMode: 'scheduled', scheduledFor: suggestedDate });
  };

  return (
    <div className="space-y-6">
      {value.publishMode === 'scheduled' && categoryId && (
        <OptimalTimesSuggestion 
          categoryId={categoryId}
          onSelectTime={handleSelectSuggestedTime}
        />
      )}
      
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Agendamento de Publicação
        </CardTitle>
        <CardDescription>
          Publique imediatamente ou agende para uma data futura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={value.publishMode} onValueChange={handleModeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="immediate" id="immediate" />
            <Label htmlFor="immediate">Publicar Imediatamente</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scheduled" id="scheduled" />
            <Label htmlFor="scheduled">Agendar Publicação</Label>
          </div>
        </RadioGroup>

        {value.publishMode === 'scheduled' && (
          <div className="space-y-4 pl-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify"
                checked={value.notifyBefore}
                onCheckedChange={(checked) =>
                  onChange({ ...value, notifyBefore: checked === true })
                }
              />
              <Label htmlFor="notify" className="text-sm font-normal">
                Notificar 1 hora antes da publicação
              </Label>
            </div>

            {date && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p>
                  O artigo será publicado automaticamente em{' '}
                  <strong>
                    {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {time}
                  </strong>
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
