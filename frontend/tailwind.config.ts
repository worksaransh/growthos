import type { Config } from "tailwindcss";

// Returns a Tailwind-compatible dynamic color using a CSS variable RGB triplet.
// Enables opacity modifiers like bg-surface/50 and text-on-surface/60 to work.
const cv = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter:           ["Inter", "sans-serif"],
        "body-md":       ["Inter", "sans-serif"],
        "body-lg":       ["Inter", "sans-serif"],
        "headline-md":   ["Inter", "sans-serif"],
        "headline-lg":   ["Inter", "sans-serif"],
        geist:           ["Geist", "sans-serif"],
        "label-md":      ["Geist", "sans-serif"],
        "label-sm":      ["Geist", "sans-serif"],
        "code-sm":       ["Geist", "monospace"],
        "tiny-tracking": ["Geist", "sans-serif"],
        syne:            ["Inter", "sans-serif"],
        mono:            ["Geist", "monospace"],
      },
      fontSize: {
        "body-md":        ["14px", { lineHeight: "1.5",  fontWeight: "400" }],
        "body-lg":        ["18px", { lineHeight: "1.6",  fontWeight: "400" }],
        "headline-md":    ["24px", { lineHeight: "1.3",  fontWeight: "600" }],
        "headline-lg":    ["32px", { lineHeight: "1.2",  letterSpacing: "-0.02em", fontWeight: "700" }],
        "label-md":       ["14px", { lineHeight: "1.4",  letterSpacing: "0.01em",  fontWeight: "500" }],
        "label-sm":       ["12px", { lineHeight: "1.2",  letterSpacing: "0.05em",  fontWeight: "600" }],
        "code-sm":        ["13px", { lineHeight: "1.6",  fontWeight: "400" }],
        "tiny-tracking":  ["10px", { lineHeight: "1",    letterSpacing: "0.1em",   fontWeight: "700" }],
      },
      colors: {
        // Theme-adaptive (respond to CSS variables — work in both dark and light)
        background:                   cv("--c-background"),
        "on-background":              cv("--c-on-background"),
        surface:                      cv("--c-surface"),
        "surface-dim":                cv("--c-surface-dim"),
        "surface-bright":             cv("--c-surface-bright"),
        "surface-container-lowest":   cv("--c-surface-container-lowest"),
        "surface-container-low":      cv("--c-surface-container-low"),
        "surface-container":          cv("--c-surface-container"),
        "surface-container-high":     cv("--c-surface-container-high"),
        "surface-container-highest":  cv("--c-surface-container-highest"),
        "surface-variant":            cv("--c-surface-variant"),
        "on-surface":                 cv("--c-on-surface"),
        "on-surface-variant":         cv("--c-on-surface-variant"),
        outline:                      cv("--c-outline"),
        "outline-variant":            cv("--c-outline-variant"),
        primary:                      cv("--c-primary"),
        "on-primary":                 cv("--c-on-primary"),
        secondary:                    cv("--c-secondary"),
        tertiary:                     cv("--c-tertiary"),
        "success-accent":             cv("--c-success"),
        "warning-accent":             cv("--c-warning"),
        error:                        cv("--c-error"),

        // Static (same in both themes)
        "surface-tint":            "#c0c1ff",
        "inverse-surface":         "#dbe2fd",
        "inverse-on-surface":      "#283044",
        "primary-container":       "#c0c1ff",
        "on-primary-container":    "#4b4d83",
        "primary-fixed":           "#e1e0ff",
        "primary-fixed-dim":       "#c0c1ff",
        "inverse-primary":         "#585990",
        "on-secondary":            "#40215e",
        "secondary-container":     "#583876",
        "on-secondary-container":  "#cba6ed",
        "on-tertiary":             "#00344a",
        "tertiary-container":      "#7bd0ff",
        "on-tertiary-container":   "#005979",
        "on-error":                "#690005",
        "error-container":         "#93000a",
        "info-accent":             "#60a5fa",
        "code-indigo":             "#8083ff",

        // Legacy alias
        growthos: {
          500:    "#c0c1ff",
          accent: "#c0c1ff",
          bg0:    "#0b1326",
          bg1:    "#131b2e",
          border: "#464554",
          text:   "#dbe2fd",
        },
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm:      "0.25rem",
        md:      "0.5rem",
        lg:      "0.75rem",
        xl:      "1rem",
        "2xl":   "1.5rem",
        full:    "9999px",
      },
      spacing: {
        "stack-xs":       "4px",
        "stack-sm":       "8px",
        "stack-md":       "16px",
        "stack-lg":       "24px",
        "stack-xl":       "48px",
        "gutter":         "24px",
        "margin-desktop": "40px",
        "sidebar-width":  "256px",
        "header-height":  "64px",
      },
      backdropBlur: {
        xs:    "4px",
        sm:    "8px",
        md:    "12px",
        lg:    "16px",
        xl:    "20px",
        "2xl": "40px",
      },
      boxShadow: {
        "glass":        "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glow-primary": "0 0 20px rgba(192,193,255,0.15)",
        "glow-success": "0 0 20px rgba(74,222,128,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
