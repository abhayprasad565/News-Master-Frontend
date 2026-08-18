import { useTheme } from "@/components/theme-provider";

export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  const { isDark } = useTheme();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 56"
      className={className}
      aria-label="Scrollbrief"
    >
      <text
        x="0"
        y="41"
        fill={isDark ? "#F3F1EA" : "#111827"}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="42"
        fontWeight="700"
        className="transition-colors duration-200"
      >
        scrollbrief
      </text>
      <circle cx="213" cy="36" r="5.5" fill="#E53935" />
      <text
        x="225"
        y="40"
        fill={isDark ? "#DCD9CF" : "#4B5563"}
        fontFamily="Menlo, Consolas, monospace"
        fontSize="23"
        fontWeight="500"
        className="transition-colors duration-200"
      >
        in
      </text>
    </svg>
  );
}
