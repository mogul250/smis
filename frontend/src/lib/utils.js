import { clsx } from "clsx"

export function cn(...inputs) {
  return clsx(inputs)
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

export function formatPercentage(value) {
  return `${(value || 0).toFixed(1)}%`;
}
