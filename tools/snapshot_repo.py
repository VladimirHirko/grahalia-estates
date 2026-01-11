#!/usr/bin/env python3
import argparse
import datetime as dt
from pathlib import Path

# ---------- настройки ----------
EXCLUDE_DIRS = {
    ".git", ".idea", ".vscode", "__pycache__", "node_modules", "venv",
    ".mypy_cache", ".pytest_cache", ".DS_Store",
    ".next", "dist", "build", "out", ".turbo",
    ".cache", ".parcel-cache",
    "coverage",
}

EXCLUDE_FILES = {
    ".env", ".env.local", ".env.production", ".env.development",
    "pnpm-lock.yaml",  # если используешь pnpm — можно оставить; сейчас не надо
}

EXCLUDE_EXT = {
    ".sqlite3", ".sqlite", ".pyc", ".log", ".map", ".lock",
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".ico", ".svg",
    ".mp4", ".mov", ".pdf",
    ".zip", ".7z", ".rar",
}

# Какие файлы кода включать в CODE_SNAPSHOT (важное)
CODE_GLOBS = [
    # root docs
    "README.md",
    ".gitignore",
    "tools/snapshot_repo.py",

    # Next.js app (у тебя всё внутри /app)
    "app/package.json",
    "app/package-lock.json",
    "app/next.config.*",
    "app/tsconfig.json",
    "app/eslint.config.*",
    "app/postcss.config.*",
    "app/src/app/**/*.*",
    "app/src/components/**/*.*",
    "app/src/lib/**/*.*",
    "app/src/styles/**/*.*",
    "app/src/hooks/**/*.*",

    # public assets (только текстовые)
    "app/public/**/*.txt",
    "app/public/**/*.json",

    # Prisma (позже)
    "app/prisma/schema.prisma",
    "app/prisma/**/*.ts",
]

# ---------- утилиты ----------
def project_root() -> Path:
    # tools/snapshot_repo.py -> <repo_root>/
    return Path(__file__).resolve().parents[1]

def is_ignored(path: Path) -> bool:
    # директории-исключения
    if any(part in EXCLUDE_DIRS for part in path.parts):
        return True

    # конкретные файлы
    if path.name in EXCLUDE_FILES:
        return True

    # расширения
    if path.suffix.lower() in EXCLUDE_EXT:
        return True

    return False

def build_tree(root: Path) -> str:
    lines = []

    def walk(base: Path, prefix=""):
        entries = sorted(
            [p for p in base.iterdir() if not is_ignored(p)],
            key=lambda p: (p.is_file(), p.name.lower())
        )
        for i, p in enumerate(entries):
            last = (i == len(entries) - 1)
            connector = "└── " if last else "├── "
            lines.append(prefix + connector + p.name)
            if p.is_dir():
                ext = "    " if last else "│   "
                walk(p, prefix + ext)

    walk(root)
    return "\n".join(lines)

def expand_globs(root: Path, patterns):
    out = []
    for pat in patterns:
        out.extend(sorted(root.glob(pat)))

    # убрать дубликаты и игноры
    uniq = []
    seen = set()
    for p in out:
        if not p.exists() or not p.is_file():
            continue
        if is_ignored(p):
            continue
        rp = p.resolve()
        if rp in seen:
            continue
        uniq.append(p)
        seen.add(rp)
    return uniq

def guess_lang(p: Path) -> str:
    ext = p.suffix.lower().lstrip(".")
    if ext in {"ts", "tsx"}:
        return "typescript"
    if ext in {"js", "jsx"}:
        return "javascript"
    if ext in {"css"}:
        return "css"
    if ext in {"html"}:
        return "html"
    if ext in {"json"}:
        return "json"
    if ext in {"md"}:
        return "markdown"
    if ext in {"py"}:
        return "python"
    return ext or "text"

# ---------- main ----------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--force",
        action="store_true",
        help="перезаписать файлы за сегодня (без добавления времени)"
    )
    parser.add_argument(
        "--with-public",
        action="store_true",
        help="включить текстовые файлы из app/public (json/txt уже включены по умолчанию)"
    )
    args = parser.parse_args()

    ROOT = project_root()

    now = dt.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S")

    # имена файлов
    if args.force:
        tree_name = f"PROJECT_TREE_{date_str}.txt"
        code_name = f"CODE_SNAPSHOT_{date_str}.md"
    else:
        tree_name = f"PROJECT_TREE_{date_str}_{time_str}.txt"
        code_name = f"CODE_SNAPSHOT_{date_str}_{time_str}.md"

    tree_path = ROOT / tree_name
    code_path = ROOT / code_name

    # --- дерево проекта ---
    tree = build_tree(ROOT)
    tree_path.write_text(tree, encoding="utf-8")
    print(f"[OK] Project tree -> {tree_path.relative_to(ROOT)}")

    # --- код-дамп основных файлов ---
    patterns = list(CODE_GLOBS)
    if args.with_public:
        patterns.append("app/public/**/*.*")

    files = expand_globs(ROOT, patterns)

    with code_path.open("w", encoding="utf-8") as f:
        f.write(f"# Code snapshot ({now.isoformat(timespec='seconds')})\n\n")
        for p in files:
            rel = p.relative_to(ROOT)
            lang = guess_lang(p)

            f.write("\n\n---\n\n")
            f.write(f"## `{rel}`\n\n")
            f.write(f"```{lang}\n")

            try:
                f.write(p.read_text(encoding="utf-8"))
            except UnicodeDecodeError:
                f.write("<binary or non-utf8 file omitted>")

            f.write("\n```\n")

    print(f"[OK] Code snapshot -> {code_path.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
