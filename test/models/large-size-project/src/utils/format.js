// Format utilities

export function formatValue(value) {
  return String(value);
}

export function formatDate(date) {
  return date.toISOString();
}

export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}
