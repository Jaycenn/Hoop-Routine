import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cleanEmail,
  cleanWorkoutTitle,
  isValidEmail,
  normalizeDrillIds,
  optionalNonNegativeInteger,
  validatePasswordConfirmation,
  ValidationError,
  objectBody, positiveId, normalizeResultBody, validateNewPassword,
} from '../lib/validation.js';

test('cleanEmail trims and normalizes email addresses', () => {
  assert.equal(cleanEmail('  PLAYER@Example.COM '), 'player@example.com');
});

test('isValidEmail rejects incomplete addresses', () => {
  assert.equal(isValidEmail('player@example.com'), true);
  assert.equal(isValidEmail('player@'), false);
  assert.equal(isValidEmail('player example.com'), false);
});

test('validatePasswordConfirmation accepts matching passwords', () => {
  assert.doesNotThrow(() => validatePasswordConfirmation('training123', 'training123'));
});

test('validatePasswordConfirmation rejects missing or different confirmations', () => {
  assert.throws(
    () => validatePasswordConfirmation('training123', 'different123'),
    ValidationError,
  );
  assert.throws(() => validatePasswordConfirmation('training123', undefined), ValidationError);
});

test('optionalNonNegativeInteger accepts blank optional fields', () => {
  assert.equal(optionalNonNegativeInteger('', 'Makes'), null);
  assert.equal(optionalNonNegativeInteger(undefined, 'Makes'), null);
});

test('optionalNonNegativeInteger accepts zero and positive whole numbers', () => {
  assert.equal(optionalNonNegativeInteger('0', 'Makes'), 0);
  assert.equal(optionalNonNegativeInteger('24', 'Makes'), 24);
});

test('optionalNonNegativeInteger rejects negative and decimal values', () => {
  assert.throws(() => optionalNonNegativeInteger('-1', 'Makes'), ValidationError);
  assert.throws(() => optionalNonNegativeInteger('2.5', 'Makes'), ValidationError);
});

test('cleanWorkoutTitle trims and collapses repeated spaces', () => {
  assert.equal(cleanWorkoutTitle('  My   Shooting Day  '), 'My Shooting Day');
});

test('cleanWorkoutTitle rejects missing and oversized names', () => {
  assert.throws(() => cleanWorkoutTitle(''), ValidationError);
  assert.throws(() => cleanWorkoutTitle('x'.repeat(81)), ValidationError);
});

test('normalizeDrillIds accepts ordered unique positive IDs', () => {
  assert.deepEqual(normalizeDrillIds(['4', 2, 9]), [4, 2, 9]);
  assert.deepEqual(normalizeDrillIds(Array.from({ length: 25 }, (_, index) => index + 1)),
    Array.from({ length: 25 }, (_, index) => index + 1));
});

test('normalizeDrillIds rejects empty, duplicate, and invalid selections', () => {
  assert.throws(() => normalizeDrillIds([]), ValidationError);
  assert.throws(() => normalizeDrillIds([1, 1]), ValidationError);
  assert.throws(() => normalizeDrillIds([0]), ValidationError);
});

test('numeric inputs reject coercion, unsafe integers, and database overflow', () => {
  for (const input of [true, false, [], [1], {}, ' ', '1e3', '0x10', 2147483648, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => optionalNonNegativeInteger(input, 'Makes'), ValidationError);
  }
  for (const input of [true, [], '1.0', '-1', 'no', Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => positiveId(input), ValidationError);
});

test('request bodies and shooting pairs have explicit contracts', () => {
  for (const body of [undefined, null, [], 'text']) assert.throws(() => objectBody(body), ValidationError);
  assert.throws(() => normalizeResultBody({ makes: 20 }), ValidationError);
  assert.throws(() => normalizeResultBody({ makes: 2, attempts: 1 }), ValidationError);
  assert.throws(() => normalizeResultBody({ completed: 'true' }), ValidationError);
  assert.deepEqual(normalizeResultBody({ makes: '0', attempts: '0', completed: true }), {
    makes: 0, attempts: 0, repetitions: null, timeSeconds: null, completed: true, notes: '',
  });
});

test('new password policy respects UTF-8 bytes', () => {
  assert.doesNotThrow(() => validateNewPassword('a'.repeat(72)));
  assert.throws(() => validateNewPassword('a'.repeat(73)), ValidationError);
  assert.throws(() => validateNewPassword('🏀'.repeat(19)), ValidationError);
  assert.doesNotThrow(() => validateNewPassword('🏀'.repeat(18)));
});

