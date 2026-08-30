import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { portalRouter } from "./routes/portal.js";
import { adminRouter } from "./routes/admin.js";
import { ensureDatabase } from "./lib/ensure-db.js";

async function main() {
  if (process.env.SKIP_DB_MIGRATE !== "1") {
    await ensureDatabase();
  }

  const app = express();
  const port = Number(process.env.PORT ?? 4000);
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

  app.use(
    cors({
      origin: frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "8mb" }));
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({
      name: "BONE KOBOYI backend",
      ok: true,
      docs: {
        health: "/api/health",
        auth: "/api/auth/login",
        catalog: "/api/catalog/products",
        portal: "/api/portal",
        admin: "/api/admin",
      },
    });
  });

  app.get("/api/health", async (_req, res) => {
    try {
      const { prisma } = await import("./lib/db.js");
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, db: true });
    } catch (error) {
      res.status(503).json({
        ok: false,
        db: false,
        error: error instanceof Error ? error.message : "DB unavailable",
      });
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/catalog", catalogRouter);
  app.use("/api/portal", portalRouter);
  app.use("/api/admin", adminRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    },
  );

  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
    console.log(`Health: http://localhost:${port}/api/health`);
    console.log(`Portal API: http://localhost:${port}/api/portal`);
  });
}

main().catch((error) => {
  console.error("[db] Failed to start backend:", error);
  process.exit(1);
});
