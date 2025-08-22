// Component Library Pattern - Main Export Index
export { Button } from './Button/Button';
export type { ButtonProps } from './Button/Button';

export { Input } from './Input/Input';
export type { InputProps } from './Input/Input';

export { Modal } from './Modal/Modal';
export type { ModalProps } from './Modal/Modal';

export { Card } from './Card/Card';
export type { CardContentProps, CardFooterProps, CardHeaderProps, CardProps } from './Card/Card';

export { Dropdown } from './Dropdown/Dropdown';
export type { DropdownItemProps, DropdownProps } from './Dropdown/Dropdown';

export { DataTable } from './DataTable/DataTable';
export type { Column, DataTableProps } from './DataTable/DataTable';

export { Form } from './Form/Form';
export type { FormFieldProps, FormProps } from './Form/Form';

export { Toast } from './Toast/Toast';
export type { ToastProps } from './Toast/Toast';

export { Avatar } from './Avatar/Avatar';
export type { AvatarProps } from './Avatar/Avatar';

export { Badge } from './Badge/Badge';
export type { BadgeProps } from './Badge/Badge';

// Utility exports
export { cn } from './utils/cn';
export { formatCurrency, formatDate, formatFileSize } from './utils/formatters';
export { debounce, memoize, throttle } from './utils/performance';
export { sanitizeInput, validateEmail, validatePassword } from './utils/validation';

// Hook exports
export { useAsync } from './hooks/useAsync';
export { useClickOutside } from './hooks/useClickOutside';
export { useCopyToClipboard } from './hooks/useCopyToClipboard';
export { useDebounce } from './hooks/useDebounce';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useMediaQuery } from './hooks/useMediaQuery';
export { usePrevious } from './hooks/usePrevious';
export { useToggle } from './hooks/useToggle';

// Theme and context exports
export { ThemeProvider, useTheme } from './contexts/ThemeContext';
export type { Theme, ThemeContextValue } from './contexts/ThemeContext';

export { ToastProvider, useToast } from './contexts/ToastContext';
export type { ToastContextValue } from './contexts/ToastContext';

// Constants
export { KEYBOARD_KEYS, SCREEN_READER_TEXT } from './constants/accessibility';
export { API_ENDPOINTS, HTTP_STATUS_CODES } from './constants/api';
export { BREAKPOINTS, COLORS, SPACING, TYPOGRAPHY } from './constants/design-tokens';

// Version info
export const VERSION = '1.0.0';
export const LIBRARY_NAME = 'Design System Components';
