export function cleanEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function optionalNonNegativeInteger(value, fieldName) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ValidationError(`${fieldName} must be a whole number of 0 or more.`);
  }
  return parsed;
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

