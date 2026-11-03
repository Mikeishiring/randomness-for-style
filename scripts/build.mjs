import {execFileSync} from 'node:child_process';
for (const file of ['work/fixed-report/build.mjs', 'work/fixed-report/prepare-public.mjs', 'work/prompt-study/build.mjs']) {
  execFileSync(process.execPath, [file], {stdio: 'inherit'});
}
