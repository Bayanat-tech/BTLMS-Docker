import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import { initializeAllConnections } from "./src/database/connection";
import "./src/utils/passport";
import { logError } from "./src/utils/logError";
import constants from "./src/helpers/constants";

const app = express();

process.on("uncaughtException", async (err: any) => {
  console.error("Uncaught Exception:", err);
  await logError(err, { note: "uncaughtException" });
  process.exit(1);
});

process.on("unhandledRejection", async (reason: any) => {
  console.error("Unhandled Rejection:", reason);
  await logError(reason, { note: "unhandledRejection" });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from "./src/routes/auth.routes";
import fileRoutes from "./src/routes/files.routes";
import hrRoutes from "./src/routes/hr.routes";
import logRoutes from "./src/routes/notification.routes";

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/notification", logRoutes);

app.get("/health", (req: Request, res: Response) => {
  res.status(constants.STATUS_CODES.OK).send("Server is up and running.");
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const err: any = new Error(`Not Found: ${req.originalUrl}`);
  err.status = constants.STATUS_CODES.NOT_FOUND;
  next(err);
});

app.use(async (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Express Error:", err);
  await logError(err, { url: req.originalUrl, method: req.method });

  const status = err?.status || constants.STATUS_CODES.INTERNAL_SERVER_ERROR;
  res.status(status).json({
    message: status === constants.STATUS_CODES.NOT_FOUND ? "Not Found" : "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3500;

async function startServerWithTypeORM() {
  try {
    console.log("Initializing HR system database connections...");
    await initializeAllConnections();
    console.log("Database initialization complete");

    app.listen(PORT, () => {
      console.log(`HR server is running on port ${PORT}`);
    });
  } catch (err: any) {
    console.error("Error in database connection:", err);
    await logError(err, { note: "DATABASE CONNECTION ERROR" });
    process.exit(1);
  }
}

startServerWithTypeORM();
