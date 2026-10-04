#!/usr/bin/env tsx
/**
 * Prints MySQL table inventory for phpMyAdmin / ops checks.
 * Usage: cd backend && npm run db:status
 */
import mariadb from "mariadb";
import "dotenv/config";

async function main() {
  const database = process.env.DATABASE_NAME ?? "bone_koboyi";
  const conn = await mariadb.createConnection({
    host: process.env.DATABASE_HOST ?? "127.0.0.1",
    user: process.env.DATABASE_USER ?? "root",
    password: process.env.DATABASE_PASSWORD || undefined,
    database,
    port: Number(process.env.DATABASE_PORT ?? 3306),
    connectTimeout: 10_000,
  });

  try {
    const tables = (await conn.query(
      `SELECT TABLE_NAME AS name,
              TABLE_ROWS AS approx_rows,
              TABLE_COMMENT AS comment
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
         AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [database],
    )) as Array<{ name: string; approx_rows: number; comment: string }>;

    console.log(`\nDatabase: ${database}`);
    console.log(`phpMyAdmin: http://localhost/phpmyadmin → select “${database}”\n`);
    console.log(
      `${"Table".padEnd(22)} ${"Rows~".padStart(8)}  Comment`,
    );
    console.log("-".repeat(72));
    for (const row of tables) {
      console.log(
        `${String(row.name).padEnd(22)} ${String(row.approx_rows ?? 0).padStart(8)}  ${row.comment || "-"}`,
      );
    }
    console.log(`\n${tables.length} tables ready in MySQL.\n`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
