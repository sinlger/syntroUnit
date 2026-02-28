import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monaco from 'monaco-editor';
import 'monaco-editor/min/vs/editor/editor.main.css';
import { 
  Code, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Minimize, 
  Maximize, 
  Braces
} from 'lucide-react';
import Ajv from 'ajv';
import * as GenerateSchema from 'generate-schema';

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
      return new Worker(
        new URL('monaco-editor/esm/vs/editor/editor.worker?worker', import.meta.url),
        { type: 'module' }
      );
    }
  };
}

type Tab = 'format' | 'schema';
type SchemaMode = 'validate' | 'generate';

export default function JsonTool() {
  const [activeTab, setActiveTab] = useState<Tab>('format');
  const [schemaMode, setSchemaMode] = useState<SchemaMode>('validate');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  
  // Format / Validate State
  const [inputJson, setInputJson] = useState<string>('{\n  "key": "value",\n  "array": [1, 2, 3]\n}');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formatMessage, setFormatMessage] = useState<string | null>(null);

  // Schema State
  const [schemaInputJson, setSchemaInputJson] = useState<string>('{\n  "id": 1,\n  "name": "Test"\n}');
  const [schemaText, setSchemaText] = useState<string>('{\n  "type": "object",\n  "properties": {\n    "id": { "type": "integer" },\n    "name": { "type": "string" }\n  },\n  "required": ["id", "name"]\n}');
  const [schemaResult, setSchemaResult] = useState<string | null>(null);

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

  // Format Handlers
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setInputJson(formatted);
      setValidationError(null);
      setFormatMessage('Formatted successfully');
      setTimeout(() => setFormatMessage(null), 3000);
    } catch (e: any) {
      setValidationError(e.message);
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setInputJson(minified);
      setValidationError(null);
      setFormatMessage('Minified successfully');
      setTimeout(() => setFormatMessage(null), 3000);
    } catch (e: any) {
      setValidationError(e.message);
    }
  };

  const handleValidate = () => {
    try {
      JSON.parse(inputJson);
      setValidationError(null);
      setFormatMessage('Valid JSON');
      setTimeout(() => setFormatMessage(null), 3000);
    } catch (e: any) {
      setValidationError(e.message);
    }
  };

  // Schema Handlers
  const handleSchemaValidate = () => {
    try {
      const ajv = new Ajv({ strict: false }); // Relax strict mode for better compatibility
      const schema = JSON.parse(schemaText);
      
      // Remove $schema if it points to an unsupported draft (like draft-04)
      if (schema.$schema && schema.$schema.includes('draft-04')) {
        delete schema.$schema;
      }

      const data = JSON.parse(schemaInputJson);
      const validate = ajv.compile(schema);
      const valid = validate(data);
      
      if (valid) {
        setSchemaResult('Validation Passed: JSON conforms to Schema');
      } else {
        setSchemaResult(`Validation Failed: ${ajv.errorsText(validate.errors)}`);
      }
    } catch (e: any) {
      // If error is about unsupported draft, try removing $schema and retry
      if (e.message.includes('no schema with key or ref')) {
        try {
          const ajv = new Ajv({ strict: false });
          const schema = JSON.parse(schemaText);
          delete schema.$schema;
          const data = JSON.parse(schemaInputJson);
          const validate = ajv.compile(schema);
          const valid = validate(data);
          
          if (valid) {
            setSchemaResult('Validation Passed: JSON conforms to Schema (Note: $schema version ignored)');
            return;
          } else {
            setSchemaResult(`Validation Failed: ${ajv.errorsText(validate.errors)}`);
            return;
          }
        } catch (retryError) {
          // Fall through to original error
        }
      }
      setSchemaResult(`Error: ${e.message}`);
    }
  };

  const handleGenerateSchema = () => {
    try {
      const data = JSON.parse(schemaInputJson);
      // @ts-ignore - generate-schema types might be missing or mismatched
      const schema = GenerateSchema.json('Root', data);
      
      // Remove $schema property as it defaults to draft-04 which is not supported by default in Ajv v8
      if (schema.$schema) {
        delete schema.$schema;
      }
      
      setSchemaText(JSON.stringify(schema, null, 2));
      setSchemaResult('Schema Generated Successfully');
    } catch (e: any) {
      setSchemaResult(`Error generating schema: ${e.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setFormatMessage('Copied to clipboard');
    setTimeout(() => setFormatMessage(null), 3000);
  };

  return (
    <div className={`flex flex-col w-full bg-background border border-border shadow-sm overflow-hidden transition-all duration-200 ${
      isFullScreen 
        ? 'fixed inset-0 z-50 h-screen rounded-none' 
        : 'h-[800px] rounded-lg relative'
    }`}>
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between p-2 bg-muted/50 border-b border-border gap-2">
        <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border">
          {(['format', 'schema'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm flex items-center gap-2 transition-colors capitalize ${
                activeTab === tab 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab === 'format' && <Code className="w-4 h-4" />}
              {tab === 'schema' && <Braces className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'schema' && (
            <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border">
              <button 
                onClick={() => setSchemaMode('validate')}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${schemaMode === 'validate' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                Validate JSON
              </button>
              <button 
                onClick={() => setSchemaMode('generate')}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${schemaMode === 'generate' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                Generate Schema
              </button>
            </div>
          )}

          {activeTab === 'format' && (
            <>
              <button onClick={handleFormat} className="p-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 transition-colors flex items-center gap-1">
                <Maximize className="w-3 h-3" /> Format
              </button>
              <button onClick={handleMinify} className="p-2 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded hover:bg-purple-200 transition-colors flex items-center gap-1">
                <Minimize className="w-3 h-3" /> Minify
              </button>
              <button onClick={handleValidate} className="p-2 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 transition-colors flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Validate
              </button>
              <button onClick={() => copyToClipboard(inputJson)} className="p-2 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded hover:bg-gray-200 transition-colors flex items-center gap-1">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </>
          )}
          
          <div className="w-px h-4 bg-border mx-1" />
          
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)} 
            className="p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-colors"
            title={isFullScreen ? "Exit Full Screen (Esc)" : "Full Screen"}
          >
            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden"> 
        
        {/* Format Tab */}
        {activeTab === 'format' && (
          <MonacoEditor
            width="100%"
            height="100%"
            language="json"
            theme={theme}
            value={inputJson}
            options={editorOptions}
            onChange={setInputJson}
          />
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="flex flex-col h-full bg-background">
            
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#1e1e1e]">
                {/* JSON Input */}
                <div className="flex-1 flex flex-col h-full border-r border-gray-700">
                    <div className="p-2 text-xs text-gray-400 bg-[#252526] border-b border-gray-700">JSON Data</div>
                    <div className="flex-1">
                        <MonacoEditor
                            width="100%"
                            height="100%"
                            language="json"
                            theme={theme}
                            value={schemaInputJson}
                            options={editorOptions}
                            onChange={setSchemaInputJson}
                        />
                    </div>
                </div>

                {/* Schema Input/Output */}
                <div className="flex-1 flex flex-col h-full">
                    <div className="p-2 text-xs text-gray-400 bg-[#252526] border-b border-gray-700 flex justify-between items-center">
                        <span>JSON Schema</span>
                        {schemaMode === 'generate' ? (
                            <button onClick={handleGenerateSchema} className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                                Generate
                            </button>
                        ) : (
                            <button onClick={handleSchemaValidate} className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                Validate
                            </button>
                        )}
                    </div>
                    <div className="flex-1">
                        <MonacoEditor
                            width="100%"
                            height="100%"
                            language="json"
                            theme={theme}
                            value={schemaText}
                            options={{ ...editorOptions, readOnly: schemaMode === 'generate' }}
                            onChange={setSchemaText}
                        />
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <div className="h-10 bg-muted/50 border-t border-border flex items-center px-4 justify-between text-xs">
        <div className="flex items-center gap-4 truncate">
           {validationError ? (
             <span className="text-red-500 flex items-center gap-2 font-medium">
               <AlertCircle className="w-3 h-3" />
               {validationError}
             </span>
           ) : formatMessage ? (
             <span className="text-green-500 flex items-center gap-2 font-medium">
               <CheckCircle className="w-3 h-3" />
               {formatMessage}
             </span>
           ) : activeTab === 'schema' && schemaResult ? (
             <span className={`${schemaResult.startsWith('Error') || schemaResult.includes('Failed') ? 'text-red-500' : 'text-green-500'} flex items-center gap-2 font-medium`}>
               {schemaResult.startsWith('Error') || schemaResult.includes('Failed') ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
               {schemaResult}
             </span>
           ) : (
             <span className="text-muted-foreground">Ready</span>
           )}
        </div>
        <div className="text-muted-foreground hidden sm:block">
           SyntroUnit JSON Tool
        </div>
      </div>
    </div>
  );
}
