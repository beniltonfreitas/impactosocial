import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  dateFrom?: Date;
  dateTo?: Date;
  onDateChange: (from?: Date, to?: Date) => void;
  placeholder?: string;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateChange,
  placeholder = "Selecione um período"
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onDateChange(range?.from, range?.to);
  };

  const quickFilters = [
    { label: "Hoje", from: new Date(), to: new Date() },
    { label: "Últimos 7 dias", from: subDays(new Date(), 7), to: new Date() },
    { label: "Últimos 30 dias", from: subDays(new Date(), 30), to: new Date() },
    { label: "Este mês", from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !dateFrom && !dateTo && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateFrom && dateTo ? (
            <>
              {format(dateFrom, "dd/MM/yyyy", { locale: ptBR })} - {format(dateTo, "dd/MM/yyyy", { locale: ptBR })}
            </>
          ) : dateFrom ? (
            <>A partir de {format(dateFrom, "dd/MM/yyyy", { locale: ptBR })}</>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  onDateChange(filter.from, filter.to);
                  setOpen(false);
                }}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        <Calendar
          mode="range"
          selected={{ from: dateFrom, to: dateTo }}
          onSelect={handleSelect}
          initialFocus
          numberOfMonths={2}
          locale={ptBR}
          className={cn("p-3 pointer-events-auto")}
        />
        <div className="p-3 border-t flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onDateChange(undefined, undefined);
              setOpen(false);
            }}
          >
            Limpar
          </Button>
          <Button
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
