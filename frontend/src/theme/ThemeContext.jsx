import React from 'react';
import { applyTheme, DEFAULT_THEME, getThemeNames, STORAGE_KEY } from './themeConfig';

const ThemeContext = React.createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
  availableThemes: []
});

const getInitialTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  const availableThemes = getThemeNames();
  if (availableThemes.includes(storedTheme)) return storedTheme;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && availableThemes.includes('dark')) {
    return 'dark';
  }
  return DEFAULT_THEME;
};

export const ThemeProvider = ({ children }) => {
  const availableThemes = React.useMemo(() => getThemeNames(), []);
  const [theme, setThemeState] = React.useState(getInitialTheme);

  const setTheme = React.useCallback(
    (nextTheme) => {
      setThemeState((current) => {
        const resolved = typeof nextTheme === 'function' ? nextTheme(current) : nextTheme;
        return availableThemes.includes(resolved) ? resolved : DEFAULT_THEME;
      });
    },
    [availableThemes]
  );

  React.useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      availableThemes
    }),
    [theme, toggleTheme, availableThemes]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => React.useContext(ThemeContext);
