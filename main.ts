// Vaultbreak — the entry hand-in program (Node 22, standard library only).
//
// It hands this repository's game in: it copies game/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there,
// the summary the judge reads, using the vendored make.fun library. The
// grader runs it twice and both runs must write the same bytes, so every
// step below is deterministic: the output tree is wiped first, then rebuilt
// from the repository, then the dossier is written from that tree.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function wipeTree(path) {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
}

function copyTree(from, to) {
  if (!existsSync(from)) throw new Error(`missing input directory: ${from}`);
  cpSync(from, to, { recursive: true });
}

function handIn() {
  mkdirSync(outputDir, { recursive: true });

  // Rebuild the output tree from scratch so a re-run never keeps stale files.
  const gameOut = join(outputDir, 'game');
  const shotsOut = join(outputDir, 'screenshots');
  wipeTree(gameOut);
  wipeTree(shotsOut);
  copyTree(join(repoRoot, 'game'), gameOut);
  copyTree(join(repoRoot, 'screenshots'), shotsOut);

  // The scorer's own caps: only text_max_bytes shapes the bytes; the others
  // refuse an entry the scorer would refuse (more than 4 screenshots or one
  // over 256 KiB; more than 993 files in game/ or 48 MiB of game files in
  // all, or a path under game/ over 1000 bytes).
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.error(`hand-in complete: ${outputDir} (dossier ${dossier.length} bytes)`);
}

handIn();
