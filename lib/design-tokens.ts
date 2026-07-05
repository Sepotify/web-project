/** Design tokens — single source of truth for the app's visual language */

export const colors = {
  background: {
    primary: "#0a0a0a",
    secondary: "#121212",
    elevated: "#1a1a1a",
    hover: "#282828",
  },
  text: {
    primary: "#ffffff",
    secondary: "#b3b3b3",
    muted: "#727272",
  },
  accent: {
    primary: "#1db954",
    primaryHover: "#1ed760",
    danger: "#e91429",
    warning: "#f59b23",
    info: "#2e77d0",
  },
  border: {
    default: "#282828",
    focus: "#1db954",
  },
} as const;

export const fonts = {
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  mono: "var(--font-geist-mono), monospace",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const radius = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
  md: "0 4px 12px rgba(0, 0, 0, 0.5)",
  lg: "0 8px 24px rgba(0, 0, 0, 0.6)",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export const zIndex = {
  dropdown: 50,
  modal: 100,
  toast: 200,
  player: 40,
} as const;
