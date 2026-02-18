// src/utils/__tests__/validation.spec.ts
import { describe, it, expect } from 'vitest'
import {
  validateStockSymbol,
  validateQuantity,
  validatePrice,
  validateTrade,
  sanitizeInput,
  escapeHtml,
  ValidationError,
  isValidationError,
  safeValidate,
  validateFields,
  TRADING_LIMITS,
} from '../validation'

describe('validateStockSymbol', () => {
  it('should accept valid stock symbols', () => {
    expect(() => validateStockSymbol('AAPL')).not.toThrow()
    expect(() => validateStockSymbol('GOOGL')).not.toThrow()
    expect(() => validateStockSymbol('A')).not.toThrow()
    expect(() => validateStockSymbol('TSLA')).not.toThrow()
    expect(() => validateStockSymbol('ABCDEF')).not.toThrow()
  })

  it('should reject lowercase symbols', () => {
    expect(() => validateStockSymbol('aapl')).toThrow(ValidationError)
    expect(() => validateStockSymbol('Aapl')).toThrow(ValidationError)
  })

  it('should reject symbols with numbers', () => {
    expect(() => validateStockSymbol('AAPL1')).toThrow(ValidationError)
    expect(() => validateStockSymbol('123')).toThrow(ValidationError)
  })

  it('should reject symbols with special characters', () => {
    expect(() => validateStockSymbol('AAP-L')).toThrow(ValidationError)
    expect(() => validateStockSymbol('AAPL.')).toThrow(ValidationError)
    expect(() => validateStockSymbol('AA PL')).toThrow(ValidationError)
  })

  it('should reject symbols that are too long', () => {
    expect(() => validateStockSymbol('GREATERTHAN10')).toThrow(ValidationError)
    expect(() => validateStockSymbol('TOOLONGGGGG')).toThrow(ValidationError)
  })

  it('should reject empty symbols', () => {
    expect(() => validateStockSymbol('')).toThrow(ValidationError)
    expect(() => validateStockSymbol('   ')).toThrow(ValidationError)
  })

  it('should reject non-string values', () => {
    expect(() => validateStockSymbol(123 as unknown as string)).toThrow(ValidationError)
    expect(() => validateStockSymbol(null as unknown as string)).toThrow(ValidationError)
    expect(() => validateStockSymbol(undefined as unknown as string)).toThrow(ValidationError)
  })
})

describe('validateQuantity', () => {
  it('should accept valid quantities', () => {
    expect(() => validateQuantity(1)).not.toThrow()
    expect(() => validateQuantity(10)).not.toThrow()
    expect(() => validateQuantity(100)).not.toThrow()
    expect(() => validateQuantity(TRADING_LIMITS.MAX_QUANTITY)).not.toThrow()
  })

  it('should reject zero quantity', () => {
    expect(() => validateQuantity(0)).toThrow(ValidationError)
  })

  it('should reject negative quantities', () => {
    expect(() => validateQuantity(-1)).toThrow(ValidationError)
    expect(() => validateQuantity(-100)).toThrow(ValidationError)
  })

  it('should reject decimal quantities', () => {
    expect(() => validateQuantity(10.5)).toThrow(ValidationError)
    expect(() => validateQuantity(1.1)).toThrow(ValidationError)
  })

  it('should reject quantities exceeding maximum', () => {
    expect(() => validateQuantity(TRADING_LIMITS.MAX_QUANTITY + 1)).toThrow(ValidationError)
    expect(() => validateQuantity(100000)).toThrow(ValidationError)
  })

  it('should reject NaN', () => {
    expect(() => validateQuantity(NaN)).toThrow(ValidationError)
  })

  it('should reject non-number values', () => {
    expect(() => validateQuantity('10' as unknown as number)).toThrow(ValidationError)
    expect(() => validateQuantity(null as unknown as number)).toThrow(ValidationError)
    expect(() => validateQuantity(undefined as unknown as number)).toThrow(ValidationError)
  })
})

describe('validatePrice', () => {
  it('should accept valid prices', () => {
    expect(() => validatePrice(15000)).not.toThrow() // ₹150.00
    expect(() => validatePrice(100)).not.toThrow() // ₹1.00
    expect(() => validatePrice(TRADING_LIMITS.MAX_PRICE)).not.toThrow()
  })

  it('should reject zero price', () => {
    expect(() => validatePrice(0)).toThrow(ValidationError)
  })

  it('should reject negative prices', () => {
    expect(() => validatePrice(-1000)).toThrow(ValidationError)
  })

  it('should reject decimal prices', () => {
    expect(() => validatePrice(100.5)).toThrow(ValidationError)
  })

  it('should reject prices below minimum', () => {
    expect(() => validatePrice(TRADING_LIMITS.MIN_PRICE - 1)).toThrow(ValidationError)
    expect(() => validatePrice(50)).toThrow(ValidationError)
  })

  it('should reject prices exceeding maximum', () => {
    expect(() => validatePrice(TRADING_LIMITS.MAX_PRICE + 1)).toThrow(ValidationError)
  })

  it('should reject NaN', () => {
    expect(() => validatePrice(NaN)).toThrow(ValidationError)
  })

  it('should reject non-number values', () => {
    expect(() => validatePrice('15000' as unknown as number)).toThrow(ValidationError)
  })
})

describe('validateTrade', () => {
  it('should accept valid trades', () => {
    expect(() => validateTrade('AAPL', 10, 15000)).not.toThrow()
    expect(() => validateTrade('GOOGL', 1, 280000)).not.toThrow()
  })

  it('should reject trades with invalid symbols', () => {
    expect(() => validateTrade('invalid', 10, 15000)).toThrow(ValidationError)
  })

  it('should reject trades with invalid quantities', () => {
    expect(() => validateTrade('AAPL', 0, 15000)).toThrow(ValidationError)
    expect(() => validateTrade('AAPL', -10, 15000)).toThrow(ValidationError)
  })

  it('should reject trades with invalid prices', () => {
    expect(() => validateTrade('AAPL', 10, 0)).toThrow(ValidationError)
    expect(() => validateTrade('AAPL', 10, -1000)).toThrow(ValidationError)
  })

  it('should reject trades exceeding maximum trade value', () => {
    // Try to buy shares worth more than MAX_TRADE_VALUE
    const hugeQuantity = 10000
    const highPrice = 20000 // ₹200 per share
    expect(() => validateTrade('AAPL', hugeQuantity, highPrice)).toThrow(ValidationError)
  })

  it('should prevent integer overflow', () => {
    const maxQuantity = TRADING_LIMITS.MAX_QUANTITY
    const maxPrice = TRADING_LIMITS.MAX_PRICE

    // This should throw due to overflow protection
    expect(() => validateTrade('AAPL', maxQuantity, maxPrice)).toThrow(ValidationError)
  })
})

describe('sanitizeInput', () => {
  it('should remove HTML tags and quotes', () => {
    // Note: The function removes BOTH tags AND quotes for security
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert(xss)')
    expect(sanitizeInput('<b>Bold</b>')).toBe('Bold')
    expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('')
  })

  it('should remove javascript protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)')
    expect(sanitizeInput('JAVASCRIPT:alert(1)')).toBe('alert(1)')
  })

  it('should remove event handlers', () => {
    expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)')
    expect(sanitizeInput('onload=alert(1)')).toBe('alert(1)')
    expect(sanitizeInput('onerror=alert(1)')).toBe('alert(1)')
  })

  it('should remove SQL injection attempts', () => {
    expect(sanitizeInput("'; DROP TABLE users--")).toBe('DROP TABLE users')
    expect(sanitizeInput('1" OR "1"="1')).toBe('1 OR 1=1')
    expect(sanitizeInput('/* comment */')).toBe('comment')
  })

  it('should preserve safe input', () => {
    expect(sanitizeInput('AAPL')).toBe('AAPL')
    expect(sanitizeInput('Buy 10 shares')).toBe('Buy 10 shares')
  })

  it('should trim whitespace', () => {
    expect(sanitizeInput('  AAPL  ')).toBe('AAPL')
    expect(sanitizeInput('A  A  P  L')).toBe('A A P L')
  })

  it('should limit length', () => {
    const longString = 'A'.repeat(200)
    expect(sanitizeInput(longString, 50).length).toBe(50)
  })

  it('should handle non-string input', () => {
    expect(sanitizeInput(123 as unknown as string)).toBe('')
    expect(sanitizeInput(null as unknown as string)).toBe('')
    expect(sanitizeInput(undefined as unknown as string)).toBe('')
  })
})

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('"alert"')).toBe('&quot;alert&quot;')
    expect(escapeHtml("'alert'")).toBe('&#x27;alert&#x27;')
    expect(escapeHtml('A & B')).toBe('A &amp; B')
    expect(escapeHtml('</script>')).toBe('&lt;&#x2F;script&gt;')
  })

  it('should handle mixed content', () => {
    const input = '<img src="x" onerror="alert(\'XSS\')">'
    const expected = '&lt;img src=&quot;x&quot; onerror=&quot;alert(&#x27;XSS&#x27;)&quot;&gt;'
    expect(escapeHtml(input)).toBe(expected)
  })
})

describe('ValidationError', () => {
  it('should create error with message', () => {
    const error = new ValidationError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.name).toBe('ValidationError')
  })

  it('should include field and value', () => {
    const error = new ValidationError('Invalid symbol', 'symbol', 'invalid')
    expect(error.field).toBe('symbol')
    expect(error.value).toBe('invalid')
  })
})

describe('isValidationError', () => {
  it('should identify ValidationError', () => {
    const error = new ValidationError('Test')
    expect(isValidationError(error)).toBe(true)
  })

  it('should reject regular Error', () => {
    const error = new Error('Test')
    expect(isValidationError(error)).toBe(false)
  })

  it('should reject non-errors', () => {
    expect(isValidationError('string')).toBe(false)
    expect(isValidationError(null)).toBe(false)
    expect(isValidationError(undefined)).toBe(false)
  })
})

describe('safeValidate', () => {
  it('should return success for valid input', () => {
    const result = safeValidate(() => validateStockSymbol('AAPL'))
    expect(result.success).toBe(true)
  })

  it('should return error for invalid input', () => {
    const result = safeValidate(() => validateStockSymbol('invalid'))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError)
    }
  })

  it('should re-throw unexpected errors', () => {
    expect(() => {
      safeValidate(() => {
        throw new Error('Unexpected')
      })
    }).toThrow('Unexpected')
  })
})

describe('validateFields', () => {
  it('should return empty object for valid fields', () => {
    const errors = validateFields({
      symbol: () => validateStockSymbol('AAPL'),
      quantity: () => validateQuantity(10),
    })
    expect(Object.keys(errors).length).toBe(0)
  })

  it('should collect all errors', () => {
    const errors = validateFields({
      symbol: () => validateStockSymbol('invalid'),
      quantity: () => validateQuantity(-10),
      price: () => validatePrice(0),
    })

    expect(Object.keys(errors).length).toBe(3)
    expect(errors.symbol).toBeDefined()
    expect(errors.quantity).toBeDefined()
    expect(errors.price).toBeDefined()
  })

  it('should continue validation after first error', () => {
    const errors = validateFields({
      field1: () => validateStockSymbol('invalid'),
      field2: () => validateQuantity(10), // Valid
      field3: () => validatePrice(0), // Invalid
    })

    expect(Object.keys(errors).length).toBe(2)
    expect(errors.field1).toBeDefined()
    expect(errors.field2).toBeUndefined()
    expect(errors.field3).toBeDefined()
  })
})
