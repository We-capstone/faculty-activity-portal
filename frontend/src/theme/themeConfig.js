const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const deepMerge = (base, override) => {
  if (!isObject(base)) return override ?? base;
  const result = { ...base };
  Object.keys(override || {}).forEach((key) => {
    const baseValue = base[key];
    const overrideValue = override[key];
    if (isObject(baseValue) && isObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  });
  return result;
};

const flattenTheme = (theme, segments = [], output = {}) => {
  Object.entries(theme).forEach(([key, value]) => {
    const path = [...segments, key];
    if (isObject(value)) {
      flattenTheme(value, path, output);
      return;
    }
    output[path.join('-')] = String(value);
  });
  return output;
};

export const STORAGE_KEY = 'faculty-portal-theme';
export const DEFAULT_THEME = 'light';

const BASE_THEME = {
  color: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    secondary: '#0f766e',
    secondaryHover: '#0d5f5b',
    accent: '#0891b2',
    accentHover: '#0e7490',
    background: '#eff4fb',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    card: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    border: '#dbe4ef',
    hover: '#f1f5f9',
    disabled: '#94a3b8',
    danger: '#b91c1c',
    dangerHover: '#991b1b',
    buttonText: '#ffffff',
    sidebarStart: '#0b1220',
    sidebarEnd: '#162032',
    sidebarText: '#e2e8f0',
    ink: '#000000',
    overlay: 'rgba(15, 23, 42, 0.45)',
    focusRing: 'rgba(37, 99, 235, 0.22)'
  },
  shadow: {
    soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
    panel: '0 16px 38px rgba(15, 23, 42, 0.15)',
    elevated: '0 14px 32px rgba(15, 23, 42, 0.22)'
  },
  chart: {
    journals: '#3b82f6',
    conferences: '#22c55e',
    patents: '#a855f7',
    funding: '#f97316',
    axis: '#64748b',
    grid: '#e2e8f0',
    heatmapLow: 'rgb(239 246 255)',
    heatmapHigh: 'rgb(29 78 216)'
  }
};

export const THEMES = {
  light: {},
  dark: {
    color: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      secondary: '#34d399',
      secondaryHover: '#10b981',
      accent: '#22d3ee',
      accentHover: '#06b6d4',
      background: '#0a1324',
      surface: '#0f1b2f',
      surfaceMuted: '#13233b',
      card: '#12243f',
      textPrimary: '#f8fafc',
      textSecondary: '#e2e8f0',
      textMuted: '#dbe7ff',
      border: '#2c3d57',
      hover: '#1a2d48',
      disabled: '#64748b',
      danger: '#f87171',
      dangerHover: '#ef4444',
      sidebarStart: '#050b16',
      sidebarEnd: '#0f1a2d',
      sidebarText: '#dbe7ff',
      ink: '#000000',
      overlay: 'rgba(2, 6, 23, 0.62)',
      focusRing: 'rgba(96, 165, 250, 0.28)'
    },
    shadow: {
      soft: '0 12px 34px rgba(2, 6, 23, 0.35)',
      panel: '0 18px 40px rgba(2, 6, 23, 0.42)',
      elevated: '0 16px 34px rgba(2, 6, 23, 0.5)'
    },
    chart: {
      journals: '#60a5fa',
      conferences: '#4ade80',
      patents: '#c084fc',
      funding: '#fb923c',
      axis: '#94a3b8',
      grid: '#314158',
      heatmapLow: 'rgb(30 41 59)',
      heatmapHigh: 'rgb(96 165 250)'
    }
  }
};

export const getThemeNames = () => Object.keys(THEMES);

export const resolveTheme = (themeName) => {
  const selected = THEMES[themeName] || THEMES[DEFAULT_THEME];
  return deepMerge(BASE_THEME, selected);
};

export const applyTheme = (themeName, root = document.documentElement) => {
  const resolved = resolveTheme(themeName);
  const flattened = flattenTheme(resolved);
  Object.entries(flattened).forEach(([token, value]) => {
    root.style.setProperty(`--theme-${token}`, value);
  });
  root.style.setProperty('color-scheme', themeName === 'dark' ? 'dark' : 'light');
  root.setAttribute('data-theme', themeName);
};
