#!/usr/bin/env python3
import argparse
import datetime as dt
from pathlib import Path

# ---------- настройки ----------
# Сюда добавляем только то, что НЕ НАДО сохранять
EXCLUDE_DIRS = {
    ".git", ".idea", ".vscode", "__pycache__", "node_modules", "venv",
    ".mypy_cache", ".pytest_cache", ".DS_Store",
    ".next", "dist", "build", "out", ".turbo",
    ".cache", ".parcel-cache", "coverage",
}

EXCLUDE_FILES = {
    ".env", ".env.local", ".env.production", ".env.development",
    "pnpm-lock.yaml", "package-lock.json", 
    "PROJECT_TREE_", "CODE_SNAPSHOT_" # Исключаем сами снапшоты, чтобы не копировать их в самих себя
}

# Сохраняем только текстовые форматы кода
INCLUDE_EXT = {
    ".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".html", 
    ".json", ".md", ".py", ".sql", ".mjs", ".yml", ".yaml", ".prisma"
}

# ---------- утилиты ----------
def project_root() -> Path:
    return Path(__file__).resolve().parents[1]

def is_ignored(path: Path) -> bool:
    # Проверка папок-исключений
    if any(part in EXCLUDE_DIRS for part in path.parts):
        return True
    # Проверка имен файлов (например, .env)
    if path.name in EXCLUDE_FILES or any(path.name.startswith(p) for p in ["PROJECT_TREE_", "CODE_SNAPSHOT_"]):
        return True
    return False

def build_tree(root: Path) -> str:
    lines = []
    def walk(base: Path, prefix=""):
        try:
            entries = sorted(
                [p for p in base.iterdir() if not is_ignored(p)],
                key=lambda p: (p.is_file(), p.name.lower())
            )
        except PermissionError:
            return

        for i, p in enumerate(entries):
            last = (i == len(entries) - 1)
            connector = "└── " if last else "├── "
            lines.append(prefix + connector + p.name)
            if p.is_dir():
                ext = "    " if last else "│   "
                walk(p, prefix + ext)
    walk(root)
    return "\n".join(lines)

def get_all_code_files(root: Path):
    """Рекурсивно ищет все файлы кода, которые не в игноре и имеют нужное расширение"""
    code_files = []
    for p in root.rglob("*"):
        if p.is_file() and not is_ignored(p):
            if p.suffix.lower() in INCLUDE_EXT or p.name in {"README.md", ".gitignore", "docker-compose.yml"}:
                code_files.append(p)
    return sorted(code_files)

def guess_lang(p: Path) -> str:
    ext = p.suffix.lower().lstrip(".")
    mapping = {
        "ts": "typescript", "tsx": "typescript",
        "js": "javascript", "jsx": "javascript",
        "mjs": "javascript", "sql": "sql",
        "yml": "yaml", "yaml": "yaml"
    }
    return mapping.get(ext, ext or "text")

# ---------- main ----------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Перезаписать файлы за сегодня")
    args = parser.parse_args()

    ROOT = project_root()
    now = dt.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S")

    # Формируем имена (добавил проверку на конфликты имен)
    suffix = f"_{time_str}" if not args.force else ""
    tree_name = f"PROJECT_TREE_{date_str}{suffix}.txt"
    code_name = f"CODE_SNAPSHOT_{date_str}{suffix}.md"

    tree_path = ROOT / tree_name
    code_path = ROOT / code_name

    # 1. Генерируем дерево (оно всегда актуальное)
    print("Сканирую структуру проекта...")
    tree_text = build_tree(ROOT)
    tree_path.write_text(tree_text, encoding="utf-8")
    print(f"[OK] Дерево сохранено: {tree_path.name}")

    # 2. Собираем весь код
    print("Собираю код из всех папок...")
    all_files = get_all_code_files(ROOT)
    
    with code_path.open("w", encoding="utf-8") as f:
        f.write(f"# Code snapshot ({now.isoformat(timespec='seconds')})\n")
        f.write(f"Всего файлов: {len(all_files)}\n\n")
        
        for p in all_files:
            try:
                rel = p.relative_to(ROOT)
                lang = guess_lang(p)
                content = p.read_text(encoding="utf-8")
                
                f.write(f"## {rel}\n\n")
                f.write(f"```{lang}\n")
                f.write(content)
                f.write("\n```\n\n---\n\n")
            except Exception as e:
                # Пропускаем бинарные файлы или ошибки доступа
                continue

    print(f"[OK] Снапшот кода создан: {code_path.name} ({len(all_files)} файлов)")

if __name__ == "__main__":
    main()