/**
 * Standard Error Messages
 */

export const ERROR_MESSAGES = {
  ORDER: {
    NOT_FOUND: 'The requested order was not found',
    INVALID_STATE_TRANSITION: 'Illegal state transition attempted',
    FUTURE_DATE_REQD: 'Event date must be in the future',
    EMPTY_ADDRESS: 'Delivery address is required'
  },
  QUOTATION: {
    NOT_FOUND: 'The quotation was not found',
    ALREADY_APPROVED: 'This quotation has already been approved',
    FORBIDDEN: 'You do not have permission to access this quotation'
  },
  AUTH: {
    UNAUTHORIZED: 'Authentication required',
    INSUFFICIENT_ROLES: 'You do not have the required permissions'
  },
  VALIDATION: {
    INVALID_UUID: 'Invalid identifier format',
    INVALID_DATE: 'Invalid date format'
  }
}
