from pathlib import Path
import re
base = Path('node_modules/react-icons/lu/index.d.ts')
if not base.exists():
    raise FileNotFoundError(base)
text = base.read_text(encoding='utf-8')
exports = {m.group(1) for m in re.finditer(r'export declare const (Lu\w+): IconType;', text)}
print('exports_count', len(exports))
print('has_LuHome', 'LuHome' in exports)
print('has_LuHouse', 'LuHouse' in exports)
path = Path('src/components/Common/Icons.jsx')
data = path.read_text(encoding='utf-8')
imports = sorted(set(re.findall(r'Lu\w+', data)))
invalid = sorted([name for name in imports if name not in exports])
print('imports_count', len(imports))
print('invalid', invalid)
print('imports', imports)
