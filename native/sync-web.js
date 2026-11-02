// Copies the web app (one level up) into native/www so Capacitor can bundle it.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..'), dst = path.join(__dirname, 'www');
fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });
for (const f of fs.readdirSync(src)) {
  if (['native', '.git', 'node_modules', 'tests'].includes(f) || f.startsWith('.')) continue;
  fs.cpSync(path.join(src, f), path.join(dst, f), { recursive: true });
}
console.log('Copied web app to', dst);
