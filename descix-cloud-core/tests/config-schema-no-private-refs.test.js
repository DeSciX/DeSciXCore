import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// config-schema.json ships in the package: its descriptions name no private checkout and no internal work-item label.
const text = readFileSync(new URL('../config-schema.json', import.meta.url), 'utf8');

test('config-schema.json names no private checkout path', () => {
    assert.doesNotMatch(text, /DeSciX_(Cloud|Powch|Core)/);
});

test('config-schema.json carries no internal work-item label', () => {
    assert.doesNotMatch(text, /\bWS-[A-Z0-9]/);
});
