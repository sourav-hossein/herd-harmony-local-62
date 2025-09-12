
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type AccentColor = 
  | 'sage' 
  | 'blue' 
  | 'green' 
  | 'orange' 
  | 'purple' 
  | 'pink' 
  | 'red' 
  | 'yellow'
  | 'slate'
  | 'emerald'
  | 'indigo'
  | 'teal'
  | 'custom';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  customAccentColor: string;
  setCustomAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const accentColorMap: Record<Exclude<AccentColor, 'custom'>, string> = {
  sage: '120 25% 35%',
  blue: '221 83% 53%',
  green: '142 76% 36%',
  orange: '25 95% 53%',
  purple: '262 83% 58%',
  pink: '330 81% 60%',
  red: '0 84% 60%',
  yellow: '48 96% 53%',
  slate: '215 28% 17%',
  emerald: '160 84% 39%',
  indigo: '239 84% 67%',
  teal: '173 80% 40%'
};

const generateColorVariants = (hsl: string) => {
  const [h, s, lRaw] = hsl.split(' ');
  const l = parseInt(lRaw);
  return {
    default: `${h} ${s} ${l}%`,
    lighter: `${h} ${s} ${Math.min(l + 10, 95)}%`,
    darker: `${h} ${s} ${Math.max(l - 10, 5)}%`,
    hover: `${h} ${s} ${Math.max(l - 5, 5)}%`,
    ghost: `${h} ${s} ${l}% / 0.1`,
    ghostHover: `${h} ${s} ${l}% / 0.2`,
    muted: `${h} calc(${s} * 0.5) ${l}% / 0.5`,
    subtle: `${h} calc(${s} * 0.3) ${Math.min(l + 20, 95)}%`,
    contrast: l > 50 ? '0 0% 0%' : '0 0% 100%'
  };
};

const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // eslint-disable-next-line prefer-const
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('accent-color') as AccentColor) || 'sage';
    }
    return 'sage';
  });

  const [customAccentColor, setCustomAccentColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('custom-accent-color') || '#3b82f6';
    }
    return '#3b82f6';
  });

  useEffect(() => {
    const root = document.documentElement;

    // Apply theme mode
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Generate accent color variants
    const baseHsl = accentColor === 'custom' 
      ? hexToHsl(customAccentColor)
      : accentColorMap[accentColor];
    
    const colors = generateColorVariants(baseHsl);

    // Apply accent color variables
    root.style.setProperty("--primary", colors.default);
    root.style.setProperty("--primary-foreground", colors.contrast);
    root.style.setProperty("--primary-hover", colors.hover);
    root.style.setProperty("--primary-ghost", colors.ghost);
    root.style.setProperty("--primary-ghost-hover", colors.ghostHover);
    root.style.setProperty("--primary-muted", colors.muted);
    root.style.setProperty("--primary-subtle", colors.subtle);
    
    // Ring and focus colors
    root.style.setProperty("--ring", colors.default);
    
    // Accent variants for components
    root.style.setProperty("--accent", colors.subtle);
    root.style.setProperty("--accent-foreground", colors.darker);
    
    // Chart colors based on accent
    root.style.setProperty("--chart-1", colors.default);
    root.style.setProperty("--chart-2", colors.lighter);
    root.style.setProperty("--chart-3", colors.darker);
    root.style.setProperty("--chart-4", colors.muted);
    root.style.setProperty("--chart-5", colors.ghost);
    
    // Sidebar colors
    root.style.setProperty("--sidebar-primary", colors.default);
    root.style.setProperty("--sidebar-primary-foreground", colors.contrast);
    root.style.setProperty("--sidebar-ring", colors.default);
    
    // Glow effects
    root.style.setProperty("--primary-glow", `hsl(${colors.default}) 0 0 20px`);
    root.style.setProperty("--primary-glow-strong", `hsl(${colors.default}) 0 0 30px`);
    
    // Update gradients
    root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${colors.default}) 0%, hsl(${colors.lighter}) 100%)`);
    root.style.setProperty("--gradient-accent", `linear-gradient(135deg, hsl(${colors.default}) 0%, hsl(${colors.hover}) 50%, hsl(${colors.darker}) 100%)`);
    
    // Update shadows with accent color
    root.style.setProperty("--shadow-accent", `0 4px 12px -4px hsl(${colors.default} / 0.25)`);
    root.style.setProperty("--shadow-accent-strong", `0 8px 25px -5px hsl(${colors.default} / 0.35)`);

    // Persist settings
    localStorage.setItem("theme", theme);
    localStorage.setItem("accent-color", accentColor);
    localStorage.setItem("custom-accent-color", customAccentColor);
  }, [theme, accentColor, customAccentColor]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(mediaQuery.matches ? "dark" : "light");
      };
      
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      accentColor, 
      setAccentColor,
      customAccentColor,
      setCustomAccentColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
