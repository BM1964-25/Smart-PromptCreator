import { chmod, cp, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = join(root, 'launchers', 'macos', 'SMART PromptCreator.app');
const targetDir = join(root, 'dist-launcher');
const target = join(targetDir, 'SMART PromptCreator.app');

await mkdir(targetDir, { recursive: true });
await cp(source, target, { recursive: true, force: true });
await chmod(join(target, 'Contents', 'MacOS', 'launcher'), 0o755);

console.log(`macOS Launcher erstellt: ${target}`);
