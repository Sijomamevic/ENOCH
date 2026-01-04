/*
  verifyLocks.cjs
  Verifica se algum arquivo lockado foi modificado.
  Falha com exit(1) para bloquear builds/deploys.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function main() {
  const root = process.cwd();
  const locksPath = path.join(root, 'locks.json');
  if (!fs.existsSync(locksPath)) return;

  const locks = JSON.parse(fs.readFileSync(locksPath, 'utf8'));
  const locked = locks.locked || {};
  const violations = [];

  for (const rel of Object.keys(locked)) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) {
      violations.push(`${rel} (arquivo removido)`);
      continue;
    }
    const cur = sha256(fs.readFileSync(p));
    if (cur !== locked[rel]) {
      violations.push(rel);
    }
  }

  if (violations.length) {
    console.error('\n🚫 LOCK VIOLADO: arquivos “travados” foram alterados.');
    for (const v of violations) console.error(` - ${v}`);
    console.error('\nSe isso foi intencional, rode: npm run lock -- <arquivos>');
    process.exit(1);
  }
}

main();
