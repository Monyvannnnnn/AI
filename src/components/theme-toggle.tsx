import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextThemeLabel = isDark ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 min-w-11 items-center justify-center rounded-xl border border-border/70 bg-card/80 px-3 text-xs text-foreground shadow-[0_10px_30px_hsl(var(--background)/0.18)] backdrop-blur-xl hover:border-primary/40 hover:text-primary"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={nextThemeLabel}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
