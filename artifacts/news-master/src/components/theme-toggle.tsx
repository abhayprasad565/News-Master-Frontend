import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`h-9 w-9 rounded-full relative transition-transform active:scale-90 text-muted-foreground hover:text-foreground ${className ?? ""}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem] transition-all text-amber-400 rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem] transition-all text-slate-700 rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
