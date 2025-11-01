import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface RedePcdBreadcrumbProps {
  moduloNome: string;
}

export function RedePcdBreadcrumb({ moduloNome }: RedePcdBreadcrumbProps) {
  return (
    <nav className="bg-muted/30 border-b">
      <div className="container mx-auto px-4 py-3">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Link 
              to="/" 
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4" />
          </li>
          <li className="flex items-center gap-2">
            <Link 
              to="/rede-pcd" 
              className="hover:text-foreground transition-colors"
            >
              Rede PcD
            </Link>
            <ChevronRight className="w-4 h-4" />
          </li>
          <li className="font-medium text-foreground">
            {moduloNome}
          </li>
        </ol>
      </div>
    </nav>
  );
}
