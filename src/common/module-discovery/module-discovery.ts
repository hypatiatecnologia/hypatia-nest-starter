import { Type } from '@nestjs/common';
import { glob } from 'glob';
import { createRequire } from 'module';
import { join } from 'path';

const requireModule = createRequire(__filename);

/**
 * Discovers feature modules under `src/modules/<feature>/<feature>.module.ts`.
 * Works in dev (ts) and prod (js) — cwd resolves to `src/` or `dist/` via __dirname.
 */
export async function discoverFeatureModules(): Promise<Type[]> {
  const files = [
    ...new Set(
      await glob('modules/*/*.module.{ts,js}', {
        cwd: join(__dirname, '../..'),
        absolute: true,
      }),
    ),
  ];

  return files.map((filePath) => {
    const mod = requireModule(filePath) as Record<string, unknown>;
    const moduleClass = mod.default ?? Object.values(mod)[0];

    if (typeof moduleClass !== 'function') {
      throw new Error(`Module file "${filePath}" does not export a valid NestJS module class.`);
    }

    return moduleClass as Type;
  });
}
