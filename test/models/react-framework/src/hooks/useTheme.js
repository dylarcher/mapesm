// useTheme hook - Simplified interface to ThemeContext
import { useThemeContext } from '../context/ThemeContext.js';

export const useTheme = () => {
  const themeContext = useThemeContext();

  return themeContext;
};

// Enhanced theme hook with additional utilities
export const useThemeUtils = () => {
  const theme = useTheme();

  const getColorClass = (type, variant = 'base') => {
    const colorMap = {
      primary: {
        base: 'text-primary-600 dark:text-primary-400',
        bg: 'bg-primary-500 text-white',
        border: 'border-primary-500'
      },
      secondary: {
        base: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-500 text-white',
        border: 'border-gray-500'
      },
      success: {
        base: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-500 text-white',
        border: 'border-green-500'
      },
      warning: {
        base: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-500 text-white',
        border: 'border-yellow-500'
      },
      danger: {
        base: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500 text-white',
        border: 'border-red-500'
      }
    };

    return colorMap[type]?.[variant] || '';
  };

  const getSpacingClass = (size) => {
    const spacingMap = {
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8'
    };

    return spacingMap[size] || spacingMap.md;
  };

  const getTextSizeClass = (size) => {
    const sizeMap = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl'
    };

    return sizeMap[size] || sizeMap.md;
  };

  const getRoundedClass = (size) => {
    const roundedMap = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    };

    return roundedMap[size] || roundedMap.md;
  };

  const getShadowClass = (size) => {
    const shadowMap = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };

    return shadowMap[size] || shadowMap.md;
  };

  const createThemeStyles = (options = {}) => {
    const {
      color = 'primary',
      size = 'md',
      variant = 'base',
      spacing = 'md',
      rounded = 'md',
      shadow = 'none'
    } = options;

    return [
      getColorClass(color, variant),
      getTextSizeClass(size),
      getSpacingClass(spacing),
      getRoundedClass(rounded),
      getShadowClass(shadow)
    ].filter(Boolean).join(' ');
  };

  const getBreakpointClass = (breakpoint, classes) => {
    const breakpointPrefix = {
      sm: 'sm:',
      md: 'md:',
      lg: 'lg:',
      xl: 'xl:',
      '2xl': '2xl:'
    };

    const prefix = breakpointPrefix[breakpoint] || '';
    return Object.entries(classes)
      .map(([key, value]) => `${prefix}${value}`)
      .join(' ');
  };

  return {
    ...theme,
    getColorClass,
    getSpacingClass,
    getTextSizeClass,
    getRoundedClass,
    getShadowClass,
    createThemeStyles,
    getBreakpointClass
  };
};
