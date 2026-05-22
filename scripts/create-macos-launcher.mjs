import { chmod, cp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const macosDir = join(root, 'launchers', 'macos');
const source = join(macosDir, 'SMART PromptCreator.app');
const targetDir = join(root, 'dist-launcher');
const target = join(targetDir, 'SMART PromptCreator.app');

await mkdir(targetDir, { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true, force: true });
await mkdir(join(target, 'Contents', 'Resources', 'app'), { recursive: true });
await cp(join(root, 'server'), join(target, 'Contents', 'Resources', 'app', 'server'), { recursive: true, force: true });
await cp(join(root, 'dist'), join(target, 'Contents', 'Resources', 'app', 'dist'), { recursive: true, force: true });
await chmod(join(target, 'Contents', 'MacOS', 'launcher'), 0o755);

console.log(`macOS Launcher erstellt: ${target}`);
