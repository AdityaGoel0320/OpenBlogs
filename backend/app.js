import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import blogRouter from "./routes/blogRouter.js";
import fileUpload from "express-fileupload";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), ".env") });

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");
const localDevelopmentOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:4173",
];
const productionOrigins = [
  "https://open-blogs-a-place-to-share-your-thoughts-mern-cloudinary.vercel.app",
];
const allowedOrigins = new Set(
  [
    ...productionOrigins,
    ...(process.env.NODE_ENV === "production" ? [] : localDevelopmentOrigins),
    ...(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "").split(","),
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin ? normalizeOrigin(origin) : "";
      const isLocalDevelopmentOrigin =
        process.env.NODE_ENV !== "production" &&
        /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(
          normalizedOrigin
        );
      if (
        !origin ||
        isLocalDevelopmentOrigin ||
        allowedOrigins.has(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      const error = new Error("This website is not allowed to access the API.");
      error.statusCode = 403;
      return callback(error);
    },
    methods: ["GET", "PUT", "DELETE", "POST", "OPTIONS"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: tmpdir(),
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);

app.use("/api/v1/user", userRouter);
app.use("/api/v1/blog", blogRouter);

app.use(errorMiddleware);

export default app;
