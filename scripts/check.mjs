import {execFileSync} from 'node:child_process';
const checks = [
  'scripts/build.mjs',
  'work/simple-astra/check.mjs',
  'work/fixed-report/check-built.mjs',
  'work/fixed-report/check-play.mjs',
  'work/fixed-report/check-dice.mjs',
  'work/fixed-report/check-dice-interaction.mjs',
  'work/fixed-report/check-prompt-peek.mjs',
  'work/fixed-report/check-report-handoff.mjs',
  'scripts/security.mjs'
];
for (const file of checks) execFileSync(process.execPath, [file], {stdio: 'inherit'});
