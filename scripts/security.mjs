import {execFileSync} from 'node:child_process';

// Inspect the index itself: a clean working copy must not hide a staged secret.
const git = args => execFileSync('git', args, {encoding: 'utf8', maxBuffer: 20 * 1024 * 1024});
const files = git(['ls-files', '-z']).split('\0').filter(Boolean);
if (!files.length) throw new Error('No staged or tracked files to scan.');
const forbidden = /(^|\/)(?:\.env(?:\.[^/]*)?|\.vercel|\.openai|\.aws|node_modules)(\/|$)|\.(?:pem|key|p12|pfx|log)$/i;
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['service key', /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{30,}\b/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['credential literal', /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][A-Za-z0-9_\/+.-]{20,}["']/i],
  ['local personal path', /\b[A-Z]:[\\/](?:Users|home)[\\/][^\s"'<>]+|file:\/\/\//i],
  ['deployment access link', /[?&]_vercel_share=[A-Za-z0-9]+/],
  ['contact email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i]
];
const failures = [];
for (const file of files) {
  if (forbidden.test(file)) failures.push(`${file}: forbidden local configuration`);
  const content = git(['show', `:${file}`]);
  for (const [label, pattern] of patterns) {
    if (pattern.test(content)) failures.push(`${file}: ${label}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${files.length} indexed files; no matching credentials, personal paths, contact emails or local account files.`);
}
