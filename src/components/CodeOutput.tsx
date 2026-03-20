import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Check, Code2, Copy, Download, Eye, Expand, Shrink, Monitor, Smartphone } from "lucide-react";
import type { GeneratedCode } from "@/types/chat";
import { buildStandaloneHtml, looksLikeCss } from "@/lib/code-output";
import { cn } from "@/lib/utils";

const TABS = ["HTML", "Tailwind", "JavaScript", "Python"] as const;
const TAB_KEY_MAP: Record<string, keyof GeneratedCode> = {
  HTML: "html",
  Tailwind: "tailwind",
  JavaScript: "javascript",
  Python: "python",
};
const EMPTY_CODE: GeneratedCode = {
  html: "",
  tailwind: "",
  javascript: "",
  python: "",
};
const tokenColors = {
  comment: "text-muted-foreground/70",
  string: "text-amber-400",
  keyword: "text-sky-400",
  number: "text-fuchsia-400",
  tag: "text-cyan-400",
  attr: "text-emerald-400",
  punctuation: "text-foreground/70",
  plain: "text-foreground",
} as const;

interface CodeOutputProps {
  visible: boolean;
  generatedCode: GeneratedCode | null;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const isMarkupTab = (tab: string, code = "") =>
  tab === "HTML" || (tab === "Tailwind" && !looksLikeCss(code));

const formatMarkup = (code: string) => {
  const normalized = code.replace(/>\s+</g, "><").trim();
  const tokens = normalized.split(/(?=<)|(?<=>)/g).filter(Boolean);
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  let indent = 0;

  return tokens
    .map((token) => {
      const trimmed = token.trim();
      if (!trimmed) return null;
      if (/^<\//.test(trimmed)) indent = Math.max(0, indent - 1);
      const line = `${"  ".repeat(indent)}${trimmed}`;
      const tagMatch = trimmed.match(/^<\s*([a-zA-Z0-9-]+)/);
      const tagName = tagMatch?.[1]?.toLowerCase();
      const isOpeningTag = /^<[^/!][^>]*>$/.test(trimmed) && !trimmed.endsWith("/>") && !(tagName && voidTags.has(tagName));
      if (isOpeningTag) indent += 1;
      return line;
    })
    .filter(Boolean)
    .join("\n");
};

const formatScriptLike = (code: string) =>
  code
    .replace(/;\s*/g, ";\n")
    .replace(/\{\s*/g, "{\n")
    .replace(/\}\s*/g, "}\n")
    .replace(/,\s*/g, ", ")
    .replace(/\n{2,}/g, "\n")
    .trim();

const formatPython = (code: string) =>
  code
    .replace(/:\s*/g, ":\n    ")
    .replace(/\n{2,}/g, "\n")
    .trim();

const highlightCode = (code: string, tab: string) => {
  const language =
    tab === "Python"
      ? "python"
      : tab === "JavaScript"
        ? "javascript"
        : looksLikeCss(code)
          ? "css"
          : "markup";

  return code.split("\n").map((line, lineIndex, lines) => {
    const tokens: Array<{ text: string; type: keyof typeof tokenColors }> = [];

    if (language === "markup") {
      const regex = /(<!--[\s\S]*?-->)|(<\/?[\w-]+)|(\s+[\w:-]+)(=)("[^"]*"|'[^']*')|(\/?>)/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({ text: line.slice(lastIndex, match.index), type: "plain" });
        }
        if (match[1]) tokens.push({ text: match[1], type: "comment" });
        else if (match[2]) tokens.push({ text: match[2], type: "tag" });
        else if (match[3]) {
          tokens.push({ text: match[3], type: "attr" });
          tokens.push({ text: match[4], type: "punctuation" });
          tokens.push({ text: match[5], type: "string" });
        } else if (match[6]) {
          tokens.push({ text: match[6], type: "punctuation" });
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        tokens.push({ text: line.slice(lastIndex), type: "plain" });
      }
    } else {
      const regex = /(\/\/.*$|#.*$)|("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`)|\b(import|from|export|default|return|const|let|var|function|async|await|if|else|for|while|class|new|try|catch|throw|def|True|False|None|in|and|or|not)\b|\b(\d+(?:\.\d+)?)\b|([()[\]{}.,:;=<>+\-*/]+)/gm;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({ text: line.slice(lastIndex, match.index), type: "plain" });
        }
        if (match[1]) tokens.push({ text: match[1], type: "comment" });
        else if (match[2]) tokens.push({ text: match[2], type: "string" });
        else if (match[3]) tokens.push({ text: match[3], type: "keyword" });
        else if (match[4]) tokens.push({ text: match[4], type: "number" });
        else if (match[5]) tokens.push({ text: match[5], type: "punctuation" });
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        tokens.push({ text: line.slice(lastIndex), type: "plain" });
      }
    }

    return (
      <Fragment key={lineIndex}>
        {tokens.map((token, tokenIndex) => (
          <span
            key={`${lineIndex}-${tokenIndex}`}
            className={tokenColors[token.type]}
            dangerouslySetInnerHTML={{ __html: escapeHtml(token.text).replace(/ /g, "&nbsp;") }}
          />
        ))}
        {lineIndex < lines.length - 1 ? "\n" : null}
      </Fragment>
    );
  });
};

const CodeOutput = ({ visible, generatedCode }: CodeOutputProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<string>("HTML");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typedCode, setTypedCode] = useState<GeneratedCode>(EMPTY_CODE);

  const normalizeCode = (code: string, tab: string) => {
    if (!code) return "";
    const normalized = code.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "  ");
    if (isMarkupTab(tab, normalized)) return formatMarkup(normalized);
    if (tab === "JavaScript") return formatScriptLike(normalized);
    if (tab === "Python") return formatPython(normalized);
    return normalized;
  };

  const availableTabs = useMemo(
    () =>
      TABS.filter((tab) => {
        if (!generatedCode) return false;
        return normalizeCode(generatedCode[TAB_KEY_MAP[tab]] || "", tab).trim().length > 0;
      }),
    [generatedCode],
  );

  const resolvedActiveTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0] ?? "HTML";
  const getCode = (tab: string) => normalizeCode(typedCode[TAB_KEY_MAP[tab]] || "", tab);

  useEffect(() => {
    if (!generatedCode) {
      setTypedCode(EMPTY_CODE);
      return;
    }
    setTypedCode(EMPTY_CODE);
    let cancelled = false;
    let timeoutId: number | null = null;
    let index = 0;
    const maxLength = Math.max(
      generatedCode.html.length,
      generatedCode.tailwind.length,
      generatedCode.javascript.length,
      generatedCode.python.length,
    );

    const tick = () => {
      if (cancelled) return;
      index += 12;
      setTypedCode({
        html: generatedCode.html.slice(0, index),
        tailwind: generatedCode.tailwind.slice(0, index),
        javascript: generatedCode.javascript.slice(0, index),
        python: generatedCode.python.slice(0, index),
      });
      if (index < maxLength) {
        timeoutId = window.setTimeout(tick, 12);
      }
    };

    timeoutId = window.setTimeout(tick, 12);
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [generatedCode]);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (viewMode !== "preview" && document.fullscreenElement === containerRef.current) {
      void document.exitFullscreen();
    }
  }, [viewMode]);

  if (!visible || !generatedCode) return null;

  const previewDocument = buildStandaloneHtml(generatedCode);
  const previewFrameClass =
    deviceMode === "mobile"
      ? "w-full max-w-[375px] max-sm:max-w-[calc(100vw-24px)] border-x border-black/5 shadow-2xl"
      : "w-full max-w-[1280px] min-w-[320px] border border-black/5 shadow-[0_24px_80px_rgba(15,23,42,0.12)]";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCode(resolvedActiveTab));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([buildStandaloneHtml(generatedCode)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "generated-website.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFullscreenToggle = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement === container) {
      await document.exitFullscreen();
      return;
    }

    await container.requestFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full overflow-hidden border border-white/10 bg-card/70 shadow-2xl backdrop-blur-xl transition-all duration-500",
        isFullscreen ? "h-screen rounded-none" : "rounded-[20px] sm:rounded-[28px]"
      )}
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-3 py-3 sm:px-4 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Workspace</div>
            <div className="mt-0.5 text-xs font-semibold text-foreground">Interactive Preview</div>
          </div>
          
          {viewMode === "preview" && (
            <div className="hidden items-center gap-1 rounded-lg border border-white/5 bg-white/5 p-1 sm:flex">
              <button
                onClick={() => setDeviceMode("desktop")}
                className={cn(
                  "rounded-md p-1.5 transition-all",
                  deviceMode === "desktop" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Desktop View"
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                className={cn(
                  "rounded-md p-1.5 transition-all",
                  deviceMode === "mobile" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Mobile View"
              >
                <Smartphone size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-0 flex items-center gap-1 rounded-xl border border-white/5 bg-white/5 p-1 sm:mr-2 sm:gap-1.5">
            <button
              onClick={() => setViewMode("preview")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition-all sm:gap-2 sm:px-3",
                viewMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye size={12} />
              Preview
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition-all sm:gap-2 sm:px-3",
                viewMode === "code" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 size={12} />
              Code
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleFullscreenToggle}
              disabled={viewMode !== "preview"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-muted-foreground hover:text-foreground disabled:opacity-30 sm:h-9 sm:w-9"
              title="Fullscreen"
            >
              {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-muted-foreground hover:text-foreground sm:h-9 sm:w-9"
              title="Copy Code"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-muted-foreground hover:text-foreground sm:h-9 sm:w-9"
              title="Download"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className={cn(
        "relative w-full overflow-hidden bg-[#fafafa]",
        isFullscreen ? "h-[calc(100vh-89px)]" : "h-[420px] sm:h-[480px]"
      )}>
        {viewMode === "preview" ? (
          <div className="flex h-full w-full items-start justify-center overflow-x-hidden overflow-y-auto p-3 sm:p-4">
            <div
              className={cn(
                "h-full overflow-hidden bg-white transition-all duration-500 ease-in-out",
                previewFrameClass
              )}
            >
              <iframe
                title="Preview"
                srcDoc={previewDocument}
                className="h-full w-full bg-white"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col bg-[#0d1117]">
            <div className="flex flex-wrap gap-2 border-b border-white/5 px-3 py-3 sm:px-4">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-full px-2.5 py-1.5 text-[10px] font-bold transition-all sm:px-3 sm:text-[11px]",
                    resolvedActiveTab === tab ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <pre className="flex-1 overflow-auto p-3 text-[12px] leading-relaxed text-white/90 scrollbar-thin sm:p-6 sm:text-[13px]">
              <code>{highlightCode(getCode(resolvedActiveTab), resolvedActiveTab)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeOutput;
