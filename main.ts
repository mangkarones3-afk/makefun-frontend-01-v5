// main.ts — Wispboard's hand-in program (Node 22, standard library
// only). The entry is the static frontend under app/; this program
// assembles the submission the grader scores. It stages app/ and
// screenshots/ into the output directory and writes dossier.json
// there with the kit's vendored buildDossier, so the dossier on disk
// is byte for byte the one the scorer rebuilds from the same files.
// The grader runs the program twice and both runs must write the
// same bytes, so nothing here reads the clock, the network, or
// anything beyond the files being staged:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts     (the grader default is /output)

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
const shotsDir = join(root, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The caps are the gate's own, from the kit's RULES.txt: only
// text_max_bytes shapes the dossier's bytes; the rest make this
// program refuse exactly what the scorer would refuse — a fourth
// screenshot, a screenshot over 256 KiB, an app/ past the file or
// byte ceilings.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163_840,
  screenshots: { max: 3, max_bytes: 262_144 },
  app_max_files: 993,
  app_max_bytes: 16_777_216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Report the staged shape, so a hand-in log shows the entry at a
// glance: app file count, screenshot count, dossier size.
const stagedApp = readdirSync(join(outDir, 'app'), { recursive: true })
  .filter((name) => !name.endsWith('/')).length;
const stagedShots = existsSync(join(outDir, 'screenshots'))
  ? readdirSync(join(outDir, 'screenshots')).length : 0;
console.log('dossier.json written to ' + outDir + ': ' + stagedApp + ' app files, '
  + stagedShots + ' screenshots, ' + dossier.length + ' bytes');
