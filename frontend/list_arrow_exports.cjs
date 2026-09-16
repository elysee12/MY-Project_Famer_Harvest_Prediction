const fs=require('fs');
const text=fs.readFileSync('node_modules/react-icons/lu/index.d.ts','utf8');
const re=/export declare const (Lu\w+): IconType;/g;
let m, arr=[];
while((m=re.exec(text))!==null){ if(m[1].includes('Arrow')) arr.push(m[1]); }
console.log(arr.join('\n'));
