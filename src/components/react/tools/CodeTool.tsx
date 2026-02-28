
import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monaco from 'monaco-editor';
import 'monaco-editor/min/vs/editor/editor.main.css';
import { 
  Code, 
  Minimize, 
  Maximize, 
  Copy, 
  Trash2,
  FileCode,
  FileType,
  Clock,
  Percent,
  ArrowRight
} from 'lucide-react';

// Monaco Environment Setup for Workers
if (typeof window !== 'undefined') {
  self.MonacoEnvironment = {
    getWorker: function (_workerId: string, label: string) {
      if (label === 'json') {
        return new Worker(
          new URL('monaco-editor/esm/vs/language/json/json.worker?worker', import.meta.url),
          { type: 'module' }
        );
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new Worker(
          new URL('monaco-editor/esm/vs/language/css/css.worker?worker', import.meta.url),
          { type: 'module' }
        );
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new Worker(
          new URL('monaco-editor/esm/vs/language/html/html.worker?worker', import.meta.url),
          { type: 'module' }
        );
      }
      if (label === 'typescript' || label === 'javascript') {
        return new Worker(
          new URL('monaco-editor/esm/vs/language/typescript/ts.worker?worker', import.meta.url),
          { type: 'module' }
        );
      }
      return new Worker(
        new URL('monaco-editor/esm/vs/editor/editor.worker?worker', import.meta.url),
        { type: 'module' }
      );
    }
  };
}

type Language = 'html' | 'css' | 'javascript';

interface MinifyStats {
  originalSize: number;
  minifiedSize: number;
  processingTime: string;
  compressionRate: string;
}

export default function CodeTool() {
  const [language, setLanguage] = useState<Language>('html');
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [showOutput, setShowOutput] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  const [stats, setStats] = useState<MinifyStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  // Editor Options
  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    automaticLayout: true,
    tabSize: 2,
    theme: theme,
    wordWrap: 'on',
  };

  const outputEditorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    ...editorOptions,
    readOnly: true,
    domReadOnly: true,
  };

  // Theme Observer
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'vs-dark' : 'light');
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = document.documentElement.classList.contains('dark');
          setTheme(isDarkNow ? 'vs-dark' : 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Full Screen Esc Key Handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullScreen]);

  const handleMinify = async () => {
    if (!inputCode.trim()) return;

    setIsLoading(true);
    setError(null);
    setStats(null);

    try {
      const response = await fetch('/api/minify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: inputCode,
          language: language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Minification failed');
      }

      // Ensure minifiedCode is treated as a string, defaulting to empty string if missing
      const result = data.minifiedCode !== undefined && data.minifiedCode !== null ? String(data.minifiedCode) : '';
      setOutputCode(result);
      setShowOutput(true);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message || 'An error occurred during minification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormat = async () => {
    if (!inputCode.trim()) return;

    setIsFormatting(true);
    setError(null);
    setOutputCode(''); // Clear output when formatting
    setShowOutput(false); // Hide output
    setStats(null);    // Clear stats when formatting

    try {
      const response = await fetch('/api/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: inputCode,
          language: language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Formatting failed');
      }

      setInputCode(data.formattedCode);
    } catch (err: any) {
      setError(err.message || 'An error occurred during formatting');
    } finally {
      setIsFormatting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyMessage('Copied!');
    setTimeout(() => setCopyMessage(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex flex-col w-full bg-background border border-border shadow-sm overflow-hidden transition-all duration-200 ${
      isFullScreen 
        ? 'fixed inset-0 z-50 h-screen rounded-none' 
        : 'h-[800px] rounded-lg relative'
    }`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2 bg-muted/50 border-b border-border gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-background rounded-md border border-border p-1">
            <button
              onClick={() => setLanguage('html')}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${language === 'html' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              HTML
            </button>
            <button
              onClick={() => setLanguage('css')}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${language === 'css' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              CSS
            </button>
            <button
              onClick={() => setLanguage('javascript')}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${language === 'javascript' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              JS
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleFormat}
            disabled={isFormatting || !inputCode.trim()}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
              isFormatting || !inputCode.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm'
            }`}
          >
            {isFormatting ? (
              <>Formatting...</>
            ) : (
              <>
                <Code className="w-4 h-4" /> Format
              </>
            )}
          </button>

          <button 
            onClick={handleMinify}
            disabled={isLoading || !inputCode.trim()}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
              isLoading || !inputCode.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
            }`}
          >
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                <Minimize className="w-4 h-4" /> Minify
              </>
            )}
          </button>
          
          <button 
            onClick={() => {
              setInputCode('');
              setOutputCode('');
              setShowOutput(false);
              setStats(null);
              setError(null);
            }} 
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setIsFullScreen(!isFullScreen)} 
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 border-b border-border text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileCode className="w-4 h-4" />
            <span>Original: <span className="font-medium text-foreground">{formatSize(stats.originalSize)}</span></span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileType className="w-4 h-4" />
            <span>Minified: <span className="font-medium text-foreground">{formatSize(stats.minifiedSize)}</span></span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Time: <span className="font-medium text-foreground">{stats.processingTime}ms</span></span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Percent className="w-4 h-4" />
            <span>Rate: <span className="font-medium text-foreground">{stats.compressionRate}%</span></span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm border-b border-destructive/20 flex items-center gap-2">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Input Editor */}
        <div className={`flex-1 flex flex-col border-b md:border-b-0 ${showOutput ? 'md:border-r' : ''} border-border min-h-[300px]`}>
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border flex justify-between items-center">
            <span>Input Code</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border uppercase">
              {language}
            </span>
          </div>
          <div className="flex-1 relative">
            <MonacoEditor
              width="100%"
              height="100%"
              language={language}
              theme={theme}
              value={inputCode}
              options={editorOptions}
              onChange={setInputCode}
            />
          </div>
        </div>

        {/* Output Editor */}
        {showOutput && (
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border flex justify-between items-center">
              <span>Minified Output</span>
              <button 
                onClick={() => copyToClipboard(outputCode || '')}
                className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copyMessage || 'Copy'}
              </button>
            </div>
            <div className="flex-1 relative">
              <MonacoEditor
                width="100%"
                height="100%"
                language={language}
                theme={theme}
                value={outputCode || ''}
                options={outputEditorOptions}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
