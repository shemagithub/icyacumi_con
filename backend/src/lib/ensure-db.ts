import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mariadb from "mariadb";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/**
 * Creates the MySQL database (if missing) and applies Prisma migrations
 * so tables exist whenever the API starts.
 */
export async function ensureDatabase() {
  const host = process.env.DATABASE_HOST ?? "localhost";
  const user = process.env.DATABASE_USER ?? "root";
  const password = process.env.DATABASE_PASSWORD ?? "";
  const database = process.env.DATABASE_NAME ?? "bone_koboyi";
  const port = Number(process.env.DATABASE_PORT ?? 3306);
  const safeName = database.replace(/[^a-zA-Z0-9_]/g, "");

  const conn = await mariadb.createConnection({
    host,
    user,
    password: password || undefined,
    port,
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${safeName}\``);
    console.log(`[db] Database ready: ${safeName}`);
  } finally {
    await conn.end();
  }

  console.log("[db] Applying migrations…");
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  console.log("[db] Tables are up to date.");
}
