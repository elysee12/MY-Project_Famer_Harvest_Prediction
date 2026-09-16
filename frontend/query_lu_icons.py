from pathlib import Path
p = Path('node_modules/react-icons/lu/index.d.ts')
text = p.read_text(encoding='utf-8')
for name in ['LuHelpCircle', 'LuMoreVertical', 'LuUnlock', 'LuHome', 'LuHouse', 'LuHousePlus', 'LuHomePlus', 'LuHelp', 'LuUnlock2', 'LuMoreHorizontal', 'LuMoreVertical', 'LuArrowRight', 'LuArrowLeft']:
    print(name, name in text)
print('--- possible substitutions ---')
for term in ['Help', 'More', 'Unlock', 'Home', 'House', 'Door', 'Building']:
    found = sorted({m.group(0) for m in __import__('re').finditer(r'Lu' + term + r'\w*', text)})
    print(term, found[:20])
