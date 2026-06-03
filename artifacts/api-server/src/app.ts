import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";

const app: Express = express();

const allowedOrigins = [
  "https://zynum.net",
  "https://www.zynum.net",
  /\.replit\.app$/,
  /\.replit\.dev$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((pattern) =>
      typeof pattern === "string" ? pattern === origin : pattern.test(origin)
    );
    callback(null, allowed ? origin : false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  // In esbuild CJS output, __dirname is always available as a real global
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const dir: string = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  const publicDir = path.join(dir, "public");
  app.use(express.static(publicDir));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
