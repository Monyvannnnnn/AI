import { useState, useRef, useEffect } from "react";
import { Copy, Check, Download } from "lucide-react";
import type { GeneratedCode } from "@/hooks/useCodeGenerator";

type CodeTab = "html" | "css" | "js" | "preview";

interface CodeEditorProps {
  code: GeneratedCode | null;
  activeTab: CodeTab;
  onTabChange: (tab: CodeTab) => void;
  isGenerating: boolean;
}

const TAB_LABELS: Record<CodeTab, string> = {
  html: "index.html",
  css: "style.css",
  js: "script.js",
  preview: "Preview",
};

export function CodeEditor({ code, activeTab, onTabChange, isGenerating }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const currentCode = code
    ? activeTab === "html"
      ? code.html
      : activeTab === "css"
      ? code.css
      : activeTab === "js"
      ? code.js
      : ""
    : "";

  const handleCopy = async () => {
    if (!currentCode) return;
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!code) return;
    const combined = `${code.html.replace(
      "</head>",
      `<style>${code.css}</style></head>`
    ).replace("</body>", `<script>${code.js}<\/script></body>`)}`;
    
    const blob = new Blob([combined], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewSrc = code
    ? `data:text/html;charset=utf-8,${encodeURIComponent(
        code.html
          .replace("</head>", `<style>${code.css}</style></head>`)
          .replace("</body>", `<script>${code.js}<\/script></body>`)
      )}`
    : "";

  const tabs: CodeTab[] = ["html", "css", "js", "preview"];

  return (
    <div className="flex flex-col h-full bg-card rounded-md panel-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-2">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3 py-2.5 text-sm font-mono transition-colors relative ${
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABELS[tab]}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {activeTab !== "preview" && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {code && (
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Download .html"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {!code && !isGenerating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Describe a UI component to generate code</p>
              <p className="text-muted-foreground text-xs mt-1 opacity-60">
                e.g. "a responsive landing page with a hero section"
              </p>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Generating code...</span>
            </div>
          </div>
        ) : activeTab === "preview" ? (
          <iframe
            ref={previewRef}
            src={previewSrc}
            className="w-full h-full bg-foreground"
            sandbox="allow-scripts"
            title="Preview"
          />
        ) : (
          <pre className="p-6 text-[13px] leading-relaxed font-mono text-code-foreground overflow-auto">
            <code>{currentCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
