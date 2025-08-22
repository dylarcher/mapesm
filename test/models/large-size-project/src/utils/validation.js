// Validation utilities
export function validateProps(props) {
  return props && typeof props === 'object';
}

export function validateEmail(email) {
  return email.includes('@');
}

export function validateRequired(value) {
  return value !== null && value !== undefined && value !== '';
}
