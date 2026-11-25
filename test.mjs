import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateLine } from './main.ts';

const EXPECTED =
  'One star. He waters me like a rumor — once, dramatically, then forgets I exist for a month. My leaves have filed a formal complaint. Would not photosynthesize here again.';

function runMain(outDir) {
  execFileSync(process.execPath, ['main.ts'], {
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: outDir },
    cwd: new URL('.', import.meta.url).pathname,
  });
  return readFileSync(join(outDir, 'entry.txt'), 'utf8');
}

test('entry is exactly the expected line, 170 chars, single line', () => {
  const dir = mkdtempSync(join(tmpdir(), 'plant-one-star-'));
  try {
    const entry = runMain(dir);
    assert.equal(entry, EXPECTED);
    assert.equal(entry.length, 170);
    assert.equal(entry.includes('\n'), false);
    assert.equal(entry.trim(), entry);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('two runs in different dirs are byte-identical', () => {
  const a = mkdtempSync(join(tmpdir(), 'plant-a-'));
  const b = mkdtempSync(join(tmpdir(), 'plant-b-'));
  try {
    assert.equal(runMain(a), runMain(b));
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
});

test('validator accepts the entry', () => {
  assert.doesNotThrow(() => validateLine(EXPECTED));
});

test('validator rejects over-limit text', () => {
  assert.throws(() => validateLine('x'.repeat(281)), /280/);
});

test('validator rejects whitespace-only text', () => {
  assert.throws(() => validateLine('   '), /whitespace/);
});

test('validator rejects multi-line text', () => {
  assert.throws(() => validateLine('one\ntwo'), /single line/);
});

test('validator rejects leading/trailing spaces', () => {
  assert.throws(() => validateLine(' padded '), /start or end/);
});

test('validator rejects control characters', () => {
  assert.throws(() => validateLine('hello\x1b[31mworld'), /control/);
});

test('validator rejects empty text', () => {
  assert.throws(() => validateLine(''), /1-280/);
});
