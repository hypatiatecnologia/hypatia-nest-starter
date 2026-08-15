import { NodeEnv, RabbitMqMode } from '../../config/configuration';

export interface StartupBannerInput {
  serviceName: string;
  baseUrl: string;
  rabbitmqMode: RabbitMqMode;
  nodeEnv: NodeEnv;
}

function boxWidth(lines: string[]): number {
  return Math.max(...lines.map((line) => line.length), 20);
}

function horizontal(width: number, left: string, fill: string, right: string): string {
  return `${left}${fill.repeat(width + 2)}${right}`;
}

function boxedLine(content: string, width: number): string {
  return `║  ${content.padEnd(width)} ║`;
}

/** Multiline ASCII banner for local dev terminals. */
export function buildStartupBanner(input: StartupBannerInput): string {
  const title = `HYPATIA — ${input.serviceName}`;
  const details = [
    `API      ${input.baseUrl}`,
    `Swagger  ${input.baseUrl}/docs/api`,
    `Health   ${input.baseUrl}/health`,
    `RabbitMQ ${input.rabbitmqMode}`,
    `Env      ${input.nodeEnv}`,
  ];
  const width = boxWidth([title, ...details]);

  return [
    horizontal(width, '╔', '═', '╗'),
    boxedLine(title, width),
    horizontal(width, '╠', '═', '╣'),
    ...details.map((line) => boxedLine(line, width)),
    horizontal(width, '╚', '═', '╝'),
  ].join('\n');
}

/** Prints the dev banner; production keeps structured Pino logs only. */
export function printStartupBanner(input: StartupBannerInput): void {
  if (input.nodeEnv === 'production') {
    return;
  }
  // Dev-only visual banner; avoids fighting pino-pretty singleLine formatting.
  console.log(`\n${buildStartupBanner(input)}\n`);
}

export function formatStartupLogMessage(input: StartupBannerInput): string {
  const swagger = input.nodeEnv === 'production' ? '' : ` — Swagger: ${input.baseUrl}/docs/api`;
  return `${input.serviceName} running at ${input.baseUrl}${swagger} — Health: ${input.baseUrl}/health — RabbitMQ: ${input.rabbitmqMode}`;
}
