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
import { frontendUrl } from "./backendConstant.js";
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), ".env") });

app.use(
  cors({
    origin: frontendUrl,
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
