import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Play, Pause, Square, Gauge } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface ArticleAudioPlayerProps {
  title: string;
  summary?: string | null;
  content?: string | null;
}

export function ArticleAudioPlayer({ title, summary, content }: ArticleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getTextToRead = () => {
    let text = `${title}. `;
    if (summary) text += `${summary}. `;
    if (content) text += content;
    return text;
  };

  const handlePlay = () => {
    if (!isSupported) return;

    const synth = window.speechSynthesis;

    // Resume if paused
    if (isPaused) {
      synth.resume();
      setIsPlaying(true);
      setIsPaused(false);
      trackEvent('audio', 'resume', 'article');
      return;
    }

    // Start new speech
    synth.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(getTextToRead());
    utterance.lang = 'pt-BR';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
    trackEvent('audio', 'play', 'article');
  };

  const handlePause = () => {
    if (!isSupported) return;
    
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
    trackEvent('audio', 'pause', 'article');
  };

  const handleStop = () => {
    if (!isSupported) return;
    
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    trackEvent('audio', 'stop', 'article');
  };

  const handleRateChange = () => {
    const rates = [0.8, 1.0, 1.2, 1.5];
    const currentIndex = rates.indexOf(rate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setRate(nextRate);

    // If currently playing, restart with new rate
    if (isPlaying || isPaused) {
      handleStop();
      setTimeout(() => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(getTextToRead());
        utterance.lang = 'pt-BR';
        utterance.rate = nextRate;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };

        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
      }, 100);
    }

    trackEvent('audio', 'rate_change', nextRate.toString());
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-4 rounded-lg border border-border">
      <Volume2 className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium mr-2">Versão em áudio</span>
      
      <div className="flex items-center gap-2">
        {!isPlaying && !isPaused ? (
          <Button
            size="sm"
            onClick={handlePlay}
            className="gap-2"
            aria-label="Reproduzir áudio"
          >
            <Play className="h-4 w-4" />
            Ouvir
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={isPlaying ? handlePause : handlePlay}
              aria-label={isPlaying ? 'Pausar' : 'Continuar'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              aria-label="Parar"
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={handleRateChange}
          className="gap-1"
          aria-label="Alterar velocidade"
        >
          <Gauge className="h-4 w-4" />
          {rate}x
        </Button>
      </div>

      {isPlaying && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Reproduzindo...
        </span>
      )}
    </div>
  );
}
