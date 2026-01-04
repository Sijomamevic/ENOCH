/*
  lockRoom.cjs
  Uso:
    npm run lock -- sections/DreamInterpretRoom.tsx sections/DreamInterpretRoom.module.css

  Grava hashes de arquivos em locks.json.
  Se um arquivo lockado for alterado, o build falha (verifyLocks).
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function loadLocks(locksPath) {
  if (!fs.existsSync(locksPath)) return { version: 1, locked: {} };
  return JSON.parse(fs.readFileSync(locksPath, 'utf8'));
}

function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Uso: node scripts/lockRoom.cjs <arquivo1> <arquivo2> ...');
    process.exit(1);
  }

  const root = process.cwd();
  const locksPath = path.join(root, 'locks.json');
  const locks = loadLocks(locksPath);

  for (const f of files) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) {
      console.error(`Arquivo não encontrado: ${f}`);
      process.exit(1);
    }
    locks.locked[f] = sha256File(p);
  }

  fs.writeFileSync(locksPath, JSON.stringify(locks, null, 2));
  console.log('Locked:', files.join(', '));
}

main();
