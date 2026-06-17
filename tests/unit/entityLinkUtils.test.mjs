import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseEntityLinksInText } from '../../src/utils/entityLinkUtils.js';

describe('parseEntityLinksInText', () => {
  it('returns single text segment when no entity links', () => {
    const segments = parseEntityLinksInText('hello world');
    assert.deepEqual(segments, [{ kind: 'text', value: 'hello world' }]);
  });

  it('parses transaction path link', () => {
    const segments = parseEntityLinksInText('Смотри /transactions/42 пожалуйста');
    assert.equal(segments.length, 3);
    assert.deepEqual(segments[0], { kind: 'text', value: 'Смотри ' });
    assert.equal(segments[1].kind, 'entity_link');
    assert.equal(segments[1].entity, 'transaction');
    assert.equal(segments[1].entity_id, 42);
    assert.equal(segments[1].url, '/transactions/42');
    assert.deepEqual(segments[2], { kind: 'text', value: ' пожалуйста' });
  });

  it('parses absolute transaction url', () => {
    const segments = parseEntityLinksInText('https://app.example.com/transactions/15');
    assert.equal(segments.length, 1);
    assert.equal(segments[0].kind, 'entity_link');
    assert.equal(segments[0].entity_id, 15);
    assert.equal(segments[0].url, '/transactions/15');
  });

  it('returns empty array for empty text', () => {
    assert.deepEqual(parseEntityLinksInText(''), []);
    assert.deepEqual(parseEntityLinksInText(null), []);
  });
});
