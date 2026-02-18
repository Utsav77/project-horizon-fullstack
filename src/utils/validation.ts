// src/utils/validation.ts

/**
 * Custom error class for validation failures
 * Helps distinguish validation errors from other errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================
// VALIDATION RULES & CONSTANTS
// ============================================

/**
 * Trading business rules and limits
 * These should match your business requirements
 */
export const TRADING_LIMITS = {
  // Stock symbol rules
  SYMBOL_MIN_LENGTH: 1,
  SYMBOL_MAX_LENGTH: 10,

  // Quantity limits
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 10000, // Max shares per trade

  // Price limits (in paise)
  MIN_PRICE: 100, // ₹1.00
  MAX_PRICE: 10000000, // ₹100,000.00

  // Maximum trade value (in paise)
  MAX_TRADE_VALUE: 100000000, // ₹10,00,000 (10 lakhs)
} as const

// ============================================
// REGEX PATTERNS
// ============================================

/**
 * Validation regex patterns
 */
const PATTERNS = {
  // Stock symbol: 1-10 uppercase letters only
  STOCK_SYMBOL: /^[A-Z]{1,10}$/,

  // Positive integer
  POSITIVE_INTEGER: /^\d+$/,

  // Alphanumeric with basic punctuation (for sanitization)
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?]+$/,
} as const

// ============================================
// CORE VALIDATORS
// ============================================

/**
 * Validates a stock symbol
 *
 * Rules:
 * - Must be 1-10 characters
 * - Only uppercase letters
 * - No spaces, numbers, or special characters
 *
 * @param symbol - Stock symbol to validate
 * @throws {ValidationError} If validation fails
 *
 * @example
 * validateStockSymbol('AAPL') // ✅ Valid
 * validateStockSymbol('GOOGL') // ✅ Valid
 * validateStockSymbol('aapl') // ❌ Throws - lowercase
 * validateStockSymbol('TOOLONG') // ❌ Throws - too long
 * validateStockSymbol('AA123') // ❌ Throws - contains numbers
 */
export function validateStockSymbol(symbol: unknown): asserts symbol is string {
  // Type check
  if (typeof symbol !== 'string') {
    throw new ValidationError('Stock symbol must be a string', 'symbol', symbol)
  }

  // Trim whitespace
  const trimmed = symbol.trim()

  // Length check
  if (
    trimmed.length < TRADING_LIMITS.SYMBOL_MIN_LENGTH ||
    trimmed.length > TRADING_LIMITS.SYMBOL_MAX_LENGTH
  ) {
    throw new ValidationError(
      `Stock symbol must be ${TRADING_LIMITS.SYMBOL_MIN_LENGTH}-${TRADING_LIMITS.SYMBOL_MAX_LENGTH} characters`,
      'symbol',
      symbol,
    )
  }

  // Pattern check
  if (!PATTERNS.STOCK_SYMBOL.test(trimmed)) {
    throw new ValidationError(
      'Stock symbol must contain only uppercase letters (A-Z)',
      'symbol',
      symbol,
    )
  }
}

/**
 * Validates trade quantity
 *
 * Rules:
 * - Must be a positive integer
 * - Must be between MIN_QUANTITY and MAX_QUANTITY
 * - No decimals allowed
 *
 * @param quantity - Number of shares
 * @throws {ValidationError} If validation fails
 *
 * @example
 * validateQuantity(10) // ✅ Valid
 * validateQuantity(1) // ✅ Valid
 * validateQuantity(0) // ❌ Throws - too small
 * validateQuantity(-5) // ❌ Throws - negative
 * validateQuantity(10.5) // ❌ Throws - decimal
 * validateQuantity(100000) // ❌ Throws - exceeds limit
 */
export function validateQuantity(quantity: unknown): asserts quantity is number {
  // Type check
  if (typeof quantity !== 'number') {
    throw new ValidationError('Quantity must be a number', 'quantity', quantity)
  }

  // NaN check
  if (Number.isNaN(quantity)) {
    throw new ValidationError('Quantity cannot be NaN', 'quantity', quantity)
  }

  // Integer check
  if (!Number.isInteger(quantity)) {
    throw new ValidationError('Quantity must be a whole number (no decimals)', 'quantity', quantity)
  }

  // Range check
  if (quantity < TRADING_LIMITS.MIN_QUANTITY) {
    throw new ValidationError(
      `Quantity must be at least ${TRADING_LIMITS.MIN_QUANTITY}`,
      'quantity',
      quantity,
    )
  }

  if (quantity > TRADING_LIMITS.MAX_QUANTITY) {
    throw new ValidationError(
      `Quantity cannot exceed ${TRADING_LIMITS.MAX_QUANTITY.toLocaleString()} shares`,
      'quantity',
      quantity,
    )
  }
}

/**
 * Validates price in paise
 *
 * Rules:
 * - Must be a positive integer (paise)
 * - Must be between MIN_PRICE and MAX_PRICE
 * - Must be realistic for a stock price
 *
 * @param priceInPaise - Price in paise (1 rupee = 100 paise)
 * @throws {ValidationError} If validation fails
 *
 * @example
 * validatePrice(15000) // ✅ Valid (₹150.00)
 * validatePrice(100) // ✅ Valid (₹1.00)
 * validatePrice(0) // ❌ Throws - too low
 * validatePrice(-1000) // ❌ Throws - negative
 * validatePrice(99999999) // ❌ Throws - unrealistic
 */
export function validatePrice(priceInPaise: unknown): asserts priceInPaise is number {
  // Type check
  if (typeof priceInPaise !== 'number') {
    throw new ValidationError('Price must be a number', 'price', priceInPaise)
  }

  // NaN check
  if (Number.isNaN(priceInPaise)) {
    throw new ValidationError('Price cannot be NaN', 'price', priceInPaise)
  }

  // Integer check (prices stored in paise)
  if (!Number.isInteger(priceInPaise)) {
    throw new ValidationError('Price must be an integer (in paise)', 'price', priceInPaise)
  }

  // Range check
  if (priceInPaise < TRADING_LIMITS.MIN_PRICE) {
    throw new ValidationError(
      `Price must be at least ₹${(TRADING_LIMITS.MIN_PRICE / 100).toFixed(2)}`,
      'price',
      priceInPaise,
    )
  }

  if (priceInPaise > TRADING_LIMITS.MAX_PRICE) {
    throw new ValidationError(
      `Price cannot exceed ₹${(TRADING_LIMITS.MAX_PRICE / 100).toLocaleString()}`,
      'price',
      priceInPaise,
    )
  }
}

/**
 * Validates complete trade parameters
 *
 * This is the main validation function to use before executing trades
 *
 * @param symbol - Stock symbol
 * @param quantity - Number of shares
 * @param priceInPaise - Price per share in paise
 * @throws {ValidationError} If any validation fails
 *
 * @example
 * validateTrade('AAPL', 10, 15000) // ✅ Valid
 * validateTrade('invalid', 10, 15000) // ❌ Throws - invalid symbol
 */
export function validateTrade(symbol: unknown, quantity: unknown, priceInPaise: unknown): void {
  // Validate each parameter
  validateStockSymbol(symbol)
  validateQuantity(quantity)
  validatePrice(priceInPaise)

  // Additional business rule: check total trade value
  const totalValue = quantity * priceInPaise

  if (totalValue > TRADING_LIMITS.MAX_TRADE_VALUE) {
    const maxValue = TRADING_LIMITS.MAX_TRADE_VALUE / 100
    throw new ValidationError(
      `Trade value (₹${(totalValue / 100).toLocaleString()}) exceeds maximum allowed (₹${maxValue.toLocaleString()})`,
      'tradeValue',
      totalValue,
    )
  }

  // Additional validation: prevent integer overflow
  if (totalValue > Number.MAX_SAFE_INTEGER) {
    throw new ValidationError(
      'Trade value is too large and may cause calculation errors',
      'tradeValue',
      totalValue,
    )
  }
}

// ============================================
// STRING SANITIZATION
// ============================================

/**
 * Sanitizes user input to prevent XSS attacks
 *
 * Removes/escapes potentially dangerous characters:
 * - HTML tags
 * - JavaScript event handlers
 * - SQL injection attempts
 *
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized string
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>') // Returns: 'scriptalert("xss")/script'
 * sanitizeInput('AAPL') // Returns: 'AAPL'
 */
export function sanitizeInput(input: string, maxLength: number = 100): string {
  if (typeof input !== 'string') {
    return ''
  }

  let sanitized = input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove common XSS vectors
    .replace(/on\w+\s*=/gi, '') // onclick=, onload=, etc.
    // Remove SQL injection attempts
    .replace(/['";]/g, '') // Remove quotes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()

  // Limit length to prevent memory issues
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength)
  }

  return sanitized
}

/**
 * Escapes HTML special characters
 *
 * Use this when displaying user input in HTML
 *
 * @param str - String to escape
 * @returns HTML-safe string
 */
export function escapeHtml(str: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char)
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * Safe validator that returns a result object instead of throwing
 * Useful for form validation where you want to collect all errors
 *
 * @example
 * const result = safeValidate(() => validateStockSymbol('AAPL'))
 * if (result.success) {
 *   console.log('Valid!')
 * } else {
 *   console.error(result.error.message)
 * }
 */
export function safeValidate<T>(
  validator: () => T,
): { success: true; value: T } | { success: false; error: ValidationError } {
  try {
    const value = validator()
    return { success: true, value }
  } catch (error) {
    if (isValidationError(error)) {
      return { success: false, error }
    }
    // Re-throw unexpected errors
    throw error
  }
}

// ============================================
// FORM VALIDATION HELPERS
// ============================================

/**
 * Validates multiple fields and returns all errors
 * Useful for form validation to show all errors at once
 *
 * @example
 * const errors = validateFields({
 *   symbol: () => validateStockSymbol(formData.symbol),
 *   quantity: () => validateQuantity(formData.quantity)
 * })
 *
 * if (Object.keys(errors).length > 0) {
 *   // Show errors to user
 * }
 */
export function validateFields(validators: Record<string, () => void>): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const [field, validator] of Object.entries(validators)) {
    try {
      validator()
    } catch (error) {
      if (isValidationError(error)) {
        errors[field] = error.message
      } else if (error instanceof Error) {
        errors[field] = error.message
      } else {
        errors[field] = 'Validation failed'
      }
    }
  }

  return errors
}

// ============================================
// EXPORTS FOR TESTING
// ============================================

// Export patterns for testing purposes
export const __PATTERNS_FOR_TESTING__ = PATTERNS
