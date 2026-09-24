import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cleanEmail,
  isValidEmail,
  optionalNonNegativeInteger,
  ValidationError,
} from '../lib/validation.js';

test('cleanEmail trims and normalizes email addresses', () => {
  assert.equal(cleanEmail('  PLAYER@Example.COM '), 'player@example.com');
});

test('isValidEmail rejects incomplete addresses', () => {
  assert.equal(isValidEmail('player@example.com'), true);
  assert.equal(isValidEmail('player@'), false);
  assert.equal(isValidEmail('player example.com'), false);
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

