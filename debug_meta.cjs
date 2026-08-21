const fs = require('fs');
let file = 'src/lib/metadata.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /fetchSafe\(nextUrl, redirects \+ 1\)\.then\(resolve\)\.catch\(reject\);/,
  "fetchSafe(nextUrl, redirects + 1).then(r => resolve(r)).catch(reject);"
);

// Actually, wait, let's just trace the execution.
fs.writeFileSync('src/lib/metadata.ts', content);
