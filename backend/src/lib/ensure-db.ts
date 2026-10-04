import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mariadb from "mariadb";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function mysqlConfig() {
  return {
    host: process.env.DATABASE_HOST ?? "127.0.0.1",
    user: process.env.DATABASE_USER ?? "root",
    password: process.env.DATABASE_PASSWORD ?? "",
    database: process.env.DATABASE_NAME ?? "bone_koboyi",
    port: Number(process.env.DATABASE_PORT ?? 3306),
  };
}

async function connectServer(attempts = 8) {
  const { host, user, password, port } = mysqlConfig();
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await mariadb.createConnection({
        host,
        user,
        password: password || undefined,
        port,
        connectTimeout: 10_000,
      });
    } catch (error) {
      lastError = error;
      console.warn(
        `[db] MySQL not ready at ${host}:${port} (attempt ${attempt}/${attempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Could not reach MySQL at ${host}:${port}. Start it, then retry — Homebrew: brew services start mysql — or start MySQL in XAMPP (if port 3306 is taken, XAMPP may be on 3307).`,
    { cause: lastError },
  );
}

/**
 * Creates the MySQL database (if missing) and applies Prisma migrations
 * so tables exist whenever the API starts.
 */
export async function ensureDatabase() {
  const { database } = mysqlConfig();
  const safeName = database.replace(/[^a-zA-Z0-9_]/g, "");

  const conn = await connectServer();

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
