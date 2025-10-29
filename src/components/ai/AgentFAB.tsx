import { Sparkles, X } from "lucide-react";
import { useState, lazy, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";

const AgentPanel = lazy(() => import("./AgentPanel"));

export function AgentFAB() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        size="icon"
        aria-label="Abrir Agente IA"
        aria-expanded={isOpen}
        aria-controls="agent-panel"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <Suspense fallback={
          <div className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-background border rounded-2xl shadow-2xl flex items-center justify-center z-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <AgentPanel onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
