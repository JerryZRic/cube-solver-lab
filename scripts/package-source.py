"""Make downloadable corresponding project source, without Git/runtime state."""
import tarfile
from pathlib import Path
root = Path(__file__).resolve().parents[1]
out = root / 'public/source/cube-lab-source.tar.gz'
out.parent.mkdir(parents=True, exist_ok=True)
exclude = {'.git', '.openai', 'node_modules', 'dist', 'docs', 'target', '.env', '.DS_Store', '__pycache__'}
with tarfile.open(out, 'w:gz') as archive:
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root)
        if any(part in exclude or part.startswith('.env.') for part in rel.parts): continue
        if rel.parts[:2] == ('public', 'source'): continue
        if path.is_file(): archive.add(path, arcname=Path('cube-lab-source') / rel, recursive=False)
print(out)
