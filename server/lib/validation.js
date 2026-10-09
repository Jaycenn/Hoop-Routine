export function cleanEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validatePasswordConfirmation(password, confirmation) {
  if (typeof confirmation !== 'string' || password !== confirmation) {
    throw new ValidationError('Passwords do not match.');
  }
}

export function optionalNonNegativeInteger(value, fieldName) {
  if (value === '' || value === null || value === undefined) return null;
  if ((typeof value !== 'number' && typeof value !== 'string')
      || (typeof value === 'string' && !/^\d+$/.test(value))) {
    throw new ValidationError(`${fieldName} must be a whole number of 0 or more.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 2147483647) {
    throw new ValidationError(`${fieldName} must be a whole number between 0 and 2147483647.`);
  }
  return parsed;
}

export function cleanWorkoutTitle(value) {
  if (typeof value !== 'string') {
    throw new ValidationError('Workout name is required.');
  }

  const title = value.trim().replace(/\s+/g, ' ');
  if (title.length < 3 || title.length > 80) {
    throw new ValidationError('Workout name must be between 3 and 80 characters.');
  }
  return title;
}

export function normalizeDrillIds(value) {
  if (!Array.isArray(value)) {
    throw new ValidationError('Choose at least one drill.');
  }

  const drillIds = value.map((id) => positiveId(id, 'Drill'));
  if (drillIds.length < 1) {
    throw new ValidationError('Choose at least one drill.');
  }
  if (drillIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new ValidationError('Every selected drill must be valid.');
  }
  if (new Set(drillIds).size !== drillIds.length) {
    throw new ValidationError('A custom workout cannot contain the same drill twice.');
  }
  return drillIds;
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export function objectBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('Send a JSON object.');
  return value;
}

export function positiveId(value, name = 'ID') {
  if ((typeof value !== 'number' && typeof value !== 'string')
      || (typeof value === 'string' && !/^[1-9]\d*$/.test(value))
      || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
    throw new ValidationError(`${name} must be a valid positive ID.`);
  }
  return Number(value);
}

export function normalizeResultBody(input) {
  const body = objectBody(input);
  const makes = optionalNonNegativeInteger(body.makes, 'Makes');
  const attempts = optionalNonNegativeInteger(body.attempts, 'Attempts');
  const repetitions = optionalNonNegativeInteger(body.repetitions, 'Rounds');
  const timeSeconds = optionalNonNegativeInteger(body.timeSeconds, 'Time');
  if (makes !== null && (attempts === null || makes > attempts)) {
    throw new ValidationError('Enter attempts with makes; makes cannot exceed attempts.');
  }
  if (body.completed !== undefined && typeof body.completed !== 'boolean') throw new ValidationError('Completed must be true or false.');
  if (body.notes !== undefined && typeof body.notes !== 'string') throw new ValidationError('Notes must be text.');
  const notes = (body.notes || '').trim();
  if (notes.length > 500) throw new ValidationError('Notes cannot exceed 500 characters.');
  return { makes, attempts, repetitions, timeSeconds, completed: body.completed === true, notes };
}

export function validateNewPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new ValidationError('Use at least 8 characters and no more than 72 UTF-8 bytes for your password.');
  }
}

export function requestKey(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ValidationError('A valid request ID is required. Refresh the page and try again.');
  }
  return value;
}

