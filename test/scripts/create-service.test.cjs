const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const sourceRoot = join(__dirname, '..', '..');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'hypatia-create-service-'));
  const starter = join(root, 'starter');
  mkdirSync(join(starter, 'scripts'), { recursive: true });
  mkdirSync(join(starter, 'archetypes'));
  cpSync(join(sourceRoot, 'scripts', 'create-service.sh'), join(starter, 'scripts', 'create-service.sh'));
  writeFileSync(join(starter, 'package.json'), '{"name":"hypatia-nest-starter"}\n');
  writeFileSync(join(starter, 'README.md'), '# hypatia-nest-starter\n');
  writeFileSync(join(starter, 'archetypes', 'api.env.example'), 'SERVICE_NAME=hypatia-service\nINTERNAL_API_KEY=change-me-local-dev\n');
  writeFileSync(join(starter, 'archetypes', 'worker.env.example'), 'SERVICE_NAME=hypatia-worker\nINTERNAL_API_KEY=change-me-local-dev\n');
  return { root, starter, script: join(starter, 'scripts', 'create-service.sh') };
}

test('rejects an unsafe service name before creating a directory', () => {
  const { root, script } = fixture();
  const result = spawnSync('/bin/bash', [script, '../escape', 'api'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Invalid service name/);
  assert.equal(existsSync(join(root, 'escape')), false);
});

test('refuses to overwrite an existing destination', () => {
  const { root, script } = fixture();
  mkdirSync(join(root, 'existing-api'));
  const result = spawnSync('/bin/bash', [script, 'existing-api', 'api'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Target already exists/);
});

test('does not expose a partial destination when copying fails', () => {
  const { root, script } = fixture();
  const fakeBin = join(root, 'bin');
  mkdirSync(fakeBin);
  const fakeRsync = join(fakeBin, 'rsync');
  writeFileSync(fakeRsync, '#!/bin/sh\nexit 23\n');
  chmodSync(fakeRsync, 0o755);
  const result = spawnSync('/bin/bash', [script, 'sample-api', 'api'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` },
  });
  assert.notEqual(result.status, 0);
  assert.equal(existsSync(join(root, 'sample-api')), false);
  assert.equal(existsSync(join(root, `sample-api.tmp.${result.pid}`)), false);
});

test('creates and initializes a valid service atomically', () => {
  const { root, script } = fixture();
  execFileSync('/bin/bash', [script, 'sample-worker', 'worker'], { stdio: 'pipe' });
  const target = join(root, 'sample-worker');
  assert.equal(existsSync(join(target, '.git')), true);
  assert.match(require(join(target, 'package.json')).name, /sample-worker/);
  assert.match(require('node:fs').readFileSync(join(target, '.env.example'), 'utf8'), /sample-worker/);
});
