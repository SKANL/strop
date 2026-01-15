'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LogCard, type BitacoraEntry } from './log-card';

interface DailyTimelineProps {
  date: Date;
  entries: BitacoraEntry[];
  onDateChange?: (date: Date) => void;
  onEntryClick?: (entry: BitacoraEntry) => void;
  selectable?: boolean;
  selectedEntries?: string[];
  onSelect?: (id: string, selected: boolean) => void;
  isClosed?: boolean;
}

export function DailyTimeline({
  date,
  entries,
  onDateChange,
  onEntryClick,
  selectable,
  selectedEntries,
  onSelect,
  isClosed = false,
}: DailyTimelineProps) {
  const goToPreviousDay = () => {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange?.(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange?.(nextDay);
  };

  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg">
            {isToday
              ? 'Hoy'
              : format(date, "EEEE, d 'de' MMMM", { locale: es })}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextDay}
            disabled={isToday}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {isClosed && (
            <Badge variant="secondary" className="ml-2">
              <Lock className="mr-1 h-3 w-3" />
              Día Cerrado
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {entries.length} entrada{entries.length !== 1 ? 's' : ''}
        </span>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-400px)]">
          {entries.length > 0 ? (
            <div className="space-y-4 pr-4">
              {entries.map((entry) => (
                <LogCard
                  key={entry.id}
                  entry={entry}
                  onClick={!selectable ? () => onEntryClick?.(entry) : undefined}
                  selectable={selectable}
                  selected={selectedEntries?.includes(entry.id)}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No hay entradas para este día
              </p>
              <Button variant="link" className="mt-2">
                Agregar primera entrada
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
