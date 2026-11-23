// Copies the Firestore rules from a Kids Games checkout to firebase/kidsgames.rules, for the
// emulator. KidsChinese has no rules file of its own: it shares the Kids Games project, and its
// rules are the KidsChinese block in kidsgames/firebase/firestore.rules.
//
// Rules file: the KIDSGAMES_RULES environment variable, else ../kidsgames/firebase/firestore.rules
// next to this repo (clone both repos into the same folder).
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const src = path.resolve(process.env.KIDSGAMES_RULES || path.join(repo, '..', 'kidsgames', 'firebase', 'firestore.rules'));
const dst = path.join(repo, 'firebase', 'kidsgames.rules');

if (!existsSync(src)) {
  console.error(`No Kids Games rules file at\n  ${src}\nClone seanlin-larc/kidsgames next to this repo, or set KIDSGAMES_RULES.`);
  process.exit(1);
}
if (!readFileSync(src, 'utf8').includes('match /chinese/{code}')) {
  console.error(`The rules file has no KidsChinese block (match /chinese/{code}):\n  ${src}`);
  process.exit(1);
}
copyFileSync(src, dst);
console.log(`Rules: ${src}`);
