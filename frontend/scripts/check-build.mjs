import { cpSync, mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// An isolated output directory keeps `next dev` and its .next cache intact.
const source = process.cwd();
const target = mkdtempSync(join(tmpdir(), 'topwalker-build-'));
for (const file of ['src', 'public', 'package.json', 'package-lock.json', 'tsconfig.json', 'next-env.d.ts', 'next.config.ts', 'postcss.config.mjs']) {
  cpSync(join(source, file), join(target, file), { recursive: true });
}
symlinkSync(join(source, 'node_modules'), join(target, 'node_modules'), 'dir');
const result = spawnSync(process.execPath, [join(source, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
  cwd: target, env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' }, stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
