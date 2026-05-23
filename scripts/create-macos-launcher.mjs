import { chmod, cp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const macosDir = join(root, 'launchers', 'macos');
const source = join(macosDir, 'SMART PromptCreator.app');
const targetDir = join(root, 'dist-launcher');
const target = join(targetDir, 'SMART PromptCreator.app');
const run = promisify(execFile);

await mkdir(targetDir, { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true, force: true });
await mkdir(join(target, 'Contents', 'Resources', 'app'), { recursive: true });
await cp(join(root, 'server'), join(target, 'Contents', 'Resources', 'app', 'server'), { recursive: true, force: true });
await cp(join(root, 'dist'), join(target, 'Contents', 'Resources', 'app', 'dist'), { recursive: true, force: true });
if (process.platform === 'darwin') {
  await run('clang', [
    join(macosDir, 'launcher.c'),
    '-framework',
    'CoreFoundation',
    '-o',
    join(target, 'Contents', 'MacOS', 'launcher')
  ]);

  const iconset = join(tmpdir(), 'smart-prompt-creator-icon.iconset');
  const rsrc = join(tmpdir(), 'smart-prompt-creator-icon.rsrc');
  await rm(iconset, { recursive: true, force: true });
  await run('iconutil', [
    '-c',
    'iconset',
    join(target, 'Contents', 'Resources', 'smart-promptcreator-icon.icns'),
    '-o',
    iconset
  ]);
  const iconPng = join(iconset, 'icon_512x512.png');
  await run('sips', ['-i', iconPng]);
  await run('sh', ['-c', `DeRez -only icns "${iconPng}" > "${rsrc}"`]);
  const customIconFile = join(target, 'Icon\r');
  await run('Rez', ['-append', rsrc, '-o', customIconFile]);
  await run('SetFile', ['-a', 'V', customIconFile]).catch(() => undefined);
  await run('SetFile', ['-a', 'C', target]);
  await run('codesign', ['--force', '--deep', '--sign', '-', target]).catch(() => undefined);
}
await chmod(join(target, 'Contents', 'MacOS', 'launcher'), 0o755);

console.log(`macOS Launcher erstellt: ${target}`);
