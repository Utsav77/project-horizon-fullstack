// A single, reusable formatter for INR (₹)
const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

/**
 * Formats a standard float amount (e.g., 895.20) as currency.
 * Used for market data.
 */
export function formatAsCurrency(amount: number): string {
  return rupeeFormatter.format(amount)
}

/**
 * Formats an integer amount in paise (e.g., 1000050) as currency.
 * Used for all portfolio values (cash, holdings value, etc.).
 */
export function formatPaiseAsCurrency(paise: number): string {
  const amountInRupees = paise / 100
  return rupeeFormatter.format(amountInRupees)
}

/**
 * Composable function to easily access the formatters
 */
export function useCurrency() {
  return {
    formatAsCurrency,
    formatPaiseAsCurrency,
  }
}
