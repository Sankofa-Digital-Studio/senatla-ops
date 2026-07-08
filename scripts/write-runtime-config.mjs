import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/assets/runtime-config.json');
const envPaths = [resolve('.env'), resolve('.env.local')];

for (const envPath of envPaths) {
  loadEnvFile(envPath);
}

const config = {
  api: {
    mode: process.env.SENATLA_API_MODE || 'local',
    baseUrl: process.env.SENATLA_API_BASE_URL || '',
    supabaseUrl: process.env.SENATLA_SUPABASE_URL || '',
    supabaseAnonKey: process.env.SENATLA_SUPABASE_ANON_KEY || '',
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(config, null, 2));

function loadEnvFile(filePath) {
  try {
    const contents = requireText(filePath);
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch {
    // Missing local env files are optional.
  }
}

function requireText(filePath) {
  return readFileSync(filePath, 'utf8');
}
