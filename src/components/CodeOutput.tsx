import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Check, Code2, Copy, Download, Eye, Expand, Shrink } from "lucide-react";
import type { GeneratedCode } from "@/types/chat";
import { buildStandaloneHtml, looksLikeCss } from "@/lib/code-output";

const TABS = ["HTML", "Tailwind", "JavaScript", "Python"] as const;
const TAB_KEY_MAP: Record<string, keyof GeneratedCode> = {
  HTML: "html",
  Tailwind: "tailwind",
  JavaScript: "javascript",
  Python: "python",
};
const FILE_EXTENSIONS: Record<string, string> = {
  HTML: "html",
  Tailwind: "html",
  JavaScript: "js",
  Python: "py",
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
      className={`overflow-hidden border border-white/10 bg-card/70 shadow-[0_20px_80px_hsl(var(--background)/0.35)] backdrop-blur-xl ${isFullscreen ? "h-screen rounded-none" : "rounded-[28px]"}`}
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Code Workspace</div>
          <div className="mt-1 text-sm text-foreground">Preview is shown by default</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            aria-label="Preview"
            title="Preview"
            className={`inline-flex h-9 min-w-11 items-center justify-center rounded-xl px-3 text-xs ${viewMode === "preview" ? "bg-primary text-primary-foreground" : "border border-white/10 bg-white/5 text-muted-foreground"}`}
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("code")}
            aria-label="Code"
            title="Code"
            className={`inline-flex h-9 min-w-11 items-center justify-center rounded-xl px-3 text-xs ${viewMode === "code" ? "bg-primary text-primary-foreground" : "border border-white/10 bg-white/5 text-muted-foreground"}`}
          >
            <Code2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleFullscreenToggle}
            disabled={viewMode !== "preview"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="inline-flex h-9 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy"
            title="Copy"
            className="inline-flex h-9 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-muted-foreground"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download website"
            title="Download website"
            className="inline-flex h-9 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-muted-foreground"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {viewMode === "preview" ? (
        <iframe title="Preview" srcDoc={previewDocument} className={`w-full bg-white ${isFullscreen ? "h-[calc(100vh-89px)]" : "h-[420px]"}`} sandbox="allow-scripts" />
      ) : (
        <div>
          <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
            {availableTabs.map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-2 text-xs ${resolvedActiveTab === tab ? "bg-primary text-primary-foreground" : "border border-white/10 bg-white/5 text-muted-foreground"}`}>
                {tab}
              </button>
            ))}
          </div>
          <pre className={`overflow-auto p-5 text-[13px] leading-7 text-code-foreground ${isFullscreen ? "max-h-[calc(100vh-141px)]" : "max-h-[420px]"}`}>
            <code>{highlightCode(getCode(resolvedActiveTab), resolvedActiveTab)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default CodeOutput;
