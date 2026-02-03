import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  experimental: {},
  schema: path.join('prisma', 'schema.prisma'),
  datasource: { url: process.env.DATABASE_URL! },
});
