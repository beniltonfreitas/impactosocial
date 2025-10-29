import { useEffect, useState } from "react";
import { Contrast, Type, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadVLibras } from "@/lib/vlibras";

export function AccessibilityBar() {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const savedContrast = localStorage.getItem("high-contrast") === "true";
    const savedFontSize = parseInt(localStorage.getItem("font-size") || "16");
    
    setHighContrast(savedContrast);
    setFontSize(savedFontSize);
    
    if (savedContrast) {
      document.documentElement.classList.add("high-contrast");
    }
    document.documentElement.style.fontSize = `${savedFontSize}px`;
  }, []);

  const toggleContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem("high-contrast", String(newValue));
    
    if (newValue) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(24, fontSize + delta));
    setFontSize(newSize);
    localStorage.setItem("font-size", String(newSize));
    document.documentElement.style.fontSize = `${newSize}px`;
  };

  const handleVLibras = () => {
    loadVLibras();
  };

  return (
    <div className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-end gap-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleContrast}
            aria-label="Alternar alto contraste"
            className="text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80"
          >
            <Contrast className="h-4 w-4 mr-1" />
            <span className="text-xs">Alto Contraste</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustFontSize(-2)}
              aria-label="Diminuir fonte"
              className="text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80"
            >
              <span className="text-xs">A-</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustFontSize(0)}
              aria-label="Fonte normal"
              className="text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80"
            >
              <span className="text-sm">A</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustFontSize(2)}
              aria-label="Aumentar fonte"
              className="text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80"
            >
              <span className="text-base">A+</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleVLibras}
            aria-label="Ativar VLibras"
            className="text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80"
          >
            <Accessibility className="h-4 w-4 mr-1" />
            <span className="text-xs">VLibras</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
