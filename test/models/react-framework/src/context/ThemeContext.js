// Theme Context Provider
import { createContext, useContext, useEffect, useReducer } from 'react';
import { StorageService } from '../services/StorageService.js';

// Theme context
const ThemeContext = createContext();

// Theme actions
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  SET_PRIMARY_COLOR: 'SET_PRIMARY_COLOR',
  SET_FONT_SIZE: 'SET_FONT_SIZE',
  RESET_THEME: 'RESET_THEME'
};

// Available themes
const THEMES = {
  DEFAULT: 'default',
  MODERN: 'modern',
  CLASSIC: 'classic',
  MINIMAL: 'minimal'
};

// Theme reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload.theme
      };

    case THEME_ACTIONS.TOGGLE_DARK_MODE:
      return {
        ...state,
        isDarkMode: !state.isDarkMode
      };

    case THEME_ACTIONS.SET_PRIMARY_COLOR:
      return {
        ...state,
        primaryColor: action.payload.color
      };

    case THEME_ACTIONS.SET_FONT_SIZE:
      return {
        ...state,
        fontSize: action.payload.size
      };

    case THEME_ACTIONS.RESET_THEME:
      return {
        ...initialState
      };

    default:
      return state;
  }
};

// Initial state
const initialState = {
  theme: THEMES.DEFAULT,
  isDarkMode: false,
  primaryColor: '#3b82f6', // blue-500
  fontSize: 'medium'
};

// Theme Provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Load theme from storage on mount
  useEffect(() => {
    loadThemeFromStorage();
  }, []);

  // Save theme to storage when it changes
  useEffect(() => {
    saveThemeToStorage();
  }, [state]);

  // Apply theme to document
  useEffect(() => {
    applyThemeToDocument();
  }, [state]);

  const loadThemeFromStorage = () => {
    try {
      const savedTheme = StorageService.getItem('theme');
      if (savedTheme) {
        const themeData = JSON.parse(savedTheme);

        if (themeData.theme && Object.values(THEMES).includes(themeData.theme)) {
          dispatch({ type: THEME_ACTIONS.SET_THEME, payload: { theme: themeData.theme } });
        }

        if (typeof themeData.isDarkMode === 'boolean') {
          dispatch({ type: THEME_ACTIONS.TOGGLE_DARK_MODE });
        }

        if (themeData.primaryColor) {
          dispatch({ type: THEME_ACTIONS.SET_PRIMARY_COLOR, payload: { color: themeData.primaryColor } });
        }

        if (themeData.fontSize) {
          dispatch({ type: THEME_ACTIONS.SET_FONT_SIZE, payload: { size: themeData.fontSize } });
        }
      }
    } catch (error) {
      console.error('Failed to load theme from storage:', error);
    }
  };

  const saveThemeToStorage = () => {
    try {
      StorageService.setItem('theme', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save theme to storage:', error);
    }
  };

  const applyThemeToDocument = () => {
    const root = document.documentElement;

    // Apply theme class
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${state.theme}`);

    // Apply dark mode
    if (state.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply CSS custom properties
    root.style.setProperty('--primary-color', state.primaryColor);
    root.style.setProperty('--font-size-base', getFontSizeValue(state.fontSize));
  };

  const getFontSizeValue = (size) => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    return sizes[size] || sizes.medium;
  };

  const setTheme = (theme) => {
    if (Object.values(THEMES).includes(theme)) {
      dispatch({ type: THEME_ACTIONS.SET_THEME, payload: { theme } });
    }
  };

  const toggleDarkMode = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_DARK_MODE });
  };

  const setPrimaryColor = (color) => {
    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
      dispatch({ type: THEME_ACTIONS.SET_PRIMARY_COLOR, payload: { color } });
    }
  };

  const setFontSize = (size) => {
    const validSizes = ['small', 'medium', 'large', 'xlarge'];
    if (validSizes.includes(size)) {
      dispatch({ type: THEME_ACTIONS.SET_FONT_SIZE, payload: { size } });
    }
  };

  const resetTheme = () => {
    dispatch({ type: THEME_ACTIONS.RESET_THEME });
  };

  const getThemeColors = () => {
    const baseColors = {
      primary: state.primaryColor,
      secondary: '#6b7280', // gray-500
      success: '#10b981', // green-500
      warning: '#f59e0b', // yellow-500
      danger: '#ef4444', // red-500
      info: '#06b6d4' // cyan-500
    };

    if (state.isDarkMode) {
      return {
        ...baseColors,
        background: '#1f2937', // gray-800
        surface: '#374151', // gray-700
        text: '#f9fafb', // gray-50
        textSecondary: '#d1d5db' // gray-300
      };
    }

    return {
      ...baseColors,
      background: '#ffffff',
      surface: '#f9fafb', // gray-50
      text: '#1f2937', // gray-800
      textSecondary: '#6b7280' // gray-500
    };
  };

  const value = {
    ...state,
    themes: THEMES,
    setTheme,
    toggleDarkMode,
    setPrimaryColor,
    setFontSize,
    resetTheme,
    getThemeColors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
