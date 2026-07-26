const test = require('node:test');
const assert = require('node:assert/strict');
const { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const sourceScript = join(__dirname, '..', '..', 'scripts', 'setup-local.sh');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'hypatia-setup-local-'));
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'archetypes'));
  cpSync(sourceScript, join(root, 'scripts', 'setup-local.sh'));
  writeFileSync(join(root, 'archetypes', 'api.env.example'), 'NODE_ENV=development\n');
  return { root, script: join(root, 'scripts', 'setup-local.sh') };
}

test('reports a missing Docker prerequisite before writing .env', () => {
  const { root, script } = fixture();
  const result = spawnSync('/bin/bash', [script], {
    encoding: 'utf8',
    env: { ...process.env, PATH: '/usr/bin:/bin' },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Missing prerequisite: docker/);
  assert.equal(existsSync(join(root, '.env')), false);
});

test('reports an unavailable Compose v2 before writing .env', () => {
  const { root, script } = fixture();
  const fakeBin = join(root, 'bin');
  mkdirSync(fakeBin);
  for (const name of ['docker', 'npm', 'npx']) {
    const path = join(fakeBin, name);
    writeFileSync(path, name === 'docker' ? '#!/bin/sh\nexit 1\n' : '#!/bin/sh\nexit 0\n');
    chmodSync(path, 0o755);
  }
  const result = spawnSync('/bin/bash', [script], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:/usr/bin:/bin` },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Docker Compose v2/);
  assert.equal(existsSync(join(root, '.env')), false);
});
