import { spawn } from "node:child_process";
const command = process.platform === "win32" ? "python" : "python3";
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
const backend = spawn(
  command,
  [
    "-m",
    "uvicorn",
    "backend.main:app",
    "--host",
    "127.0.0.1",
    "--port",
    "8000",
    "--env-file",
    ".env.local",
  ],
  { stdio: "inherit", env },
);
const frontend = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1"],
  { stdio: "inherit", env },
);
function stop() {
  backend.kill();
  frontend.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
backend.on("exit", (code) => {
  if (code) frontend.kill();
});
frontend.on("exit", () => backend.kill());
