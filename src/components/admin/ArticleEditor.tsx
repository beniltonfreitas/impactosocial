import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ArticleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ArticleEditor({ value, onChange, placeholder }: ArticleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b border-border bg-muted/50">
        <button
          type="button"
          onClick={() => document.execCommand('bold')}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Negrito (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('italic')}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Itálico (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('underline')}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Sublinhado (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => document.execCommand('formatBlock', false, 'h2')}
          className="px-2 hover:bg-accent rounded transition-colors"
          title="Título 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('formatBlock', false, 'h3')}
          className="px-2 hover:bg-accent rounded transition-colors"
          title="Título 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('formatBlock', false, 'p')}
          className="px-2 hover:bg-accent rounded transition-colors"
          title="Parágrafo"
        >
          P
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => document.execCommand('insertUnorderedList')}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Lista"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('insertOrderedList')}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Lista numerada"
        >
          1.
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => document.execCommand('createLink', false, prompt('URL:') || undefined)}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Link"
        >
          🔗
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className={cn(
          "min-h-[400px] p-4 focus:outline-none prose prose-sm max-w-none",
          "prose-headings:text-foreground prose-p:text-foreground",
          "prose-strong:text-foreground prose-em:text-foreground",
          "prose-a:text-primary hover:prose-a:text-primary/80",
          !value && "text-muted-foreground"
        )}
        data-placeholder={placeholder}
      />
    </div>
  );
}
