import test from 'node:test';
import assert from 'node:assert/strict';

test('attendance percentage formula', () => {
  const present = 16;
  const total = 20;
  assert.equal(Math.round(present / total * 100), 80);
});

test('mark percentage formula', () => {
  const obtained = 82;
  const maximum = 100;
  assert.equal(Math.round(obtained / maximum * 100), 82);
});
