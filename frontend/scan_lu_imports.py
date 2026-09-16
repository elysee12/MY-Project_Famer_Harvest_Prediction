from pathlib import Path
import re
root = Path('.')
index = root / 'node_modules' / 'react-icons' / 'lu' / 'index.d.ts'
text = index.read_text(encoding='utf-8')
exports = {m.group(1) for m in re.finditer(r'export declare const (Lu\w+): IconType;', text)}
print('exports_count', len(exports))
invalid = {}
for f in root.rglob('*.jsx'):
    data = f.read_text(encoding='utf-8')
    for match in re.finditer(r"import\s*\{([^}]+)\}\s*from\s*['\"]react-icons/lu['\"]", data):
        names = re.findall(r'\bLu\w+\b', match.group(1))
        for name in names:
            if name not in exports:
                invalid.setdefault(name, []).append(str(f.relative_to(root)))
print('invalid_count', len(invalid))
for name, files in sorted(invalid.items()):
    print(name, sorted(set(files)))
