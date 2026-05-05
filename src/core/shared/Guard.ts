/**
 * Guard - Validaciones defensivas
 * 
 * Previene valores inválidos en el dominio
 */

interface GuardResult {
  succeeded: boolean
  message?: string
}

export class Guard {
  public static combine(guardResults: GuardResult[]): GuardResult {
    for (const result of guardResults) {
      if (!result.succeeded) {
        return result
      }
    }
    return { succeeded: true }
  }

  public static againstNullOrUndefined(
    value: unknown,
    argumentName: string
  ): GuardResult {
    if (value === null || value === undefined) {
      return {
        succeeded: false,
        message: `${argumentName} is null or undefined`
      }
    }
    return { succeeded: true }
  }

  public static againstNullOrUndefinedBulk(
    args: { value: unknown; argumentName: string }[]
  ): GuardResult {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(arg.value, arg.argumentName)
      if (!result.succeeded) {
        return result
      }
    }
    return { succeeded: true }
  }

  public static isNumber(value: unknown, argumentName: string): GuardResult {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        succeeded: false,
        message: `${argumentName} is not a valid number`
      }
    }
    return { succeeded: true }
  }

  public static isString(value: unknown, argumentName: string): GuardResult {
    if (typeof value !== 'string') {
      return {
        succeeded: false,
        message: `${argumentName} is not a string`
      }
    }
    return { succeeded: true }
  }

  public static isOneOf(
    value: unknown,
    validValues: unknown[],
    argumentName: string
  ): GuardResult {
    if (!validValues.includes(value)) {
      return {
        succeeded: false,
        message: `${argumentName} must be one of: ${validValues.join(', ')}`
      }
    }
    return { succeeded: true }
  }

  public static inRange(
    value: number,
    min: number,
    max: number,
    argumentName: string
  ): GuardResult {
    if (value < min || value > max) {
      return {
        succeeded: false,
        message: `${argumentName} must be between ${min} and ${max}`
      }
    }
    return { succeeded: true }
  }

  public static isValidEmail(email: string): GuardResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        succeeded: false,
        message: 'Invalid email format'
      }
    }
    return { succeeded: true }
  }

  public static minLength(
    value: string,
    min: number,
    argumentName: string
  ): GuardResult {
    if (value.length < min) {
      return {
        succeeded: false,
        message: `${argumentName} must be at least ${min} characters`
      }
    }
    return { succeeded: true }
  }

  public static maxLength(
    value: string,
    max: number,
    argumentName: string
  ): GuardResult {
    if (value.length > max) {
      return {
        succeeded: false,
        message: `${argumentName} must be at most ${max} characters`
      }
    }
    return { succeeded: true }
  }

  public static greaterThan(
    value: number,
    min: number,
    argumentName: string
  ): GuardResult {
    if (value <= min) {
      return {
        succeeded: false,
        message: `${argumentName} must be greater than ${min}`
      }
    }
    return { succeeded: true }
  }
}
