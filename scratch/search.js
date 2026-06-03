const fs = require('fs');
const content = fs.readFileSync('scratch/contents.txt', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
    if (line.includes('10775') || line.includes('60С2ХА') || line.includes('ОМЗ') || line.includes('1 567 396') || line.includes('1567396') || line.includes('10,577')) {
        console.log(`--- Line ${idx} ---`);
        for (let i = Math.max(0, idx - 10); i <= Math.min(lines.length - 1, idx + 25); i++) {
            console.log(`${i === idx ? '>>> ' : '    '}${i}: ${lines[i]}`);
        }
        console.log('-------------------\n');
    }
});
