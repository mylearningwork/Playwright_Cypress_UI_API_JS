import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(24).default('local-development-secret-change-me'),
  CORS_ORIGIN: z.string().default('*'),
  JSONPLACEHOLDER_BASE_URL: z.string().url().default('https://jsonplaceholder.typicode.com'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120)
});

export const env = schema.parse(process.env);
