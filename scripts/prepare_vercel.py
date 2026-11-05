"""Create a clean two-service Vercel source package without secrets or dependencies."""

import shutil
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--output", default="work/vercel")
args = parser.parse_args()
TARGET = (ROOT / args.output).resolve()
if not TARGET.is_relative_to(ROOT / "work"):
    raise SystemExit("Deployment staging must stay inside the project work directory.")
if TARGET.exists():
    raise SystemExit(
        "work/vercel already exists. Inspect or move it before preparing again."
    )
frontend = TARGET / "frontend"
backend = TARGET / "backend"
frontend.mkdir(parents=True)
backend.mkdir()
for name in ["app", "components", "lib", "public"]:
    shutil.copytree(ROOT / name, frontend / name)
for name in [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next-env.d.ts",
    "next.config.ts",
    "postcss.config.mjs",
    "eslint.config.mjs",
]:
    shutil.copy2(ROOT / name, frontend / name)
shutil.copytree(
    ROOT / "backend",
    backend / "backend",
    ignore=shutil.ignore_patterns("__pycache__", ".pytest_cache", "tests"),
)
(backend / "requirements.txt").write_text("-r backend/requirements.txt\n")
(backend / ".python-version").write_text("3.12\n")
shutil.copy2(ROOT / "deployment/vercel.json", TARGET / "vercel.json")
(TARGET / ".gitignore").write_text(
    ".vercel/\n.env*\nnode_modules/\n.next/\n__pycache__/\n"
)
print("Prepared", TARGET)
print(
    "Review the package; set Gemini credentials in Vercel, then run vercel deploy from this directory."
)
