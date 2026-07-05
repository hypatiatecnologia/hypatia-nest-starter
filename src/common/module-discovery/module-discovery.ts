import { DynamicModule, Type } from '@nestjs/common';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { glob } from 'glob';
import { createRequire } from 'module';
import { basename, join } from 'path';
import { AppConfig } from '../../config/configuration';

const requireModule = createRequire(__filename);

type FeatureModule = DynamicModule | Type;
type ModuleExport = Type & {
  register?: (config: AppConfig) => FeatureModule | Promise<FeatureModule>;
};

interface DiscoverFeatureModulesOptions {
  appConfig?: AppConfig;
  rootDir?: string;
  requireFromPath?: (filePath: string) => Record<string, unknown>;
}

/**
 * Discovers feature modules under `src/modules/<feature>/<feature>.module.ts`.
 * Works in dev (ts) and prod (js) — cwd resolves to `src/` or `dist/` via __dirname.
 *
 * Adding a feature = creating the folder; app.module.ts is never edited:
 *   src/modules/billing/billing.module.ts → export class BillingModule {}
 *
 * Naming contract: the kebab-case filename must match the exported class
 * (billing.module.ts → BillingModule); a mismatch fails the boot with a clear
 * error rather than silently skipping the module.
 *
 * Optionally export a static `register(config: AppConfig)` to shape the module
 * from typed config at bootstrap — see ExampleModule, which swaps HTTP
 * controllers for queue consumers based on RABBITMQ_MODE.
 */
export async function discoverFeatureModules(
  options: DiscoverFeatureModulesOptions = {},
): Promise<FeatureModule[]> {
  const rootDir = options.rootDir ?? join(__dirname, '../..');
  const loadModule = options.requireFromPath ?? ((filePath: string) => requireModule(filePath));
  const files = [
    ...new Set(
      await glob('modules/*/*.module.{ts,js}', {
        cwd: rootDir,
        absolute: true,
      }),
    ),
  ].sort();

  return Promise.all(
    files.map(async (filePath) => {
      const mod = loadModule(filePath);
      const moduleClass = resolveModuleExport(filePath, mod);

      if (options.appConfig && typeof moduleClass.register === 'function') {
        return moduleClass.register(options.appConfig);
      }

      return moduleClass;
    }),
  );
}

function resolveModuleExport(filePath: string, mod: Record<string, unknown>): ModuleExport {
  const exportName = getExpectedExportName(filePath);
  const moduleClass = mod[exportName] ?? mod.default;

  if (typeof moduleClass !== 'function' || !isNestModule(moduleClass)) {
    throw new Error(`Module file "${filePath}" must export a NestJS module named ${exportName}.`);
  }

  return moduleClass as ModuleExport;
}

function getExpectedExportName(filePath: string): string {
  const featureName = basename(filePath).replace(/\.module\.(ts|js)$/, '');
  const pascalName = featureName
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('');

  return `${pascalName}Module`;
}

function isNestModule(moduleClass: unknown): boolean {
  if (typeof moduleClass !== 'function') {
    return false;
  }

  return [
    MODULE_METADATA.IMPORTS,
    MODULE_METADATA.PROVIDERS,
    MODULE_METADATA.CONTROLLERS,
    MODULE_METADATA.EXPORTS,
  ].some((metadataKey) => Reflect.hasMetadata(metadataKey, moduleClass));
}
