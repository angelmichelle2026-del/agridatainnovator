import express, { type Express } from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const frontendPublicDirectory = resolve(
  import.meta.dirname,
  "../../agri-lens-ai/dist/public",
);
const frontendIndex = resolve(frontendPublicDirectory, "index.html");
if (existsSync(frontendIndex)) {
  app.use(express.static(frontendPublicDirectory, { redirect: false }));
  app.use((req, res, next) => {
    if (
      req.method !== "GET" ||
      req.path === "/api" ||
      req.path.startsWith("/api/")
    ) {
      next();
      return;
    }
    res.sendFile(frontendIndex, (error) => {
      if (error) next(error);
    });
  });
}

export default app;
