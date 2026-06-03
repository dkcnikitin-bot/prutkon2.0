const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'contents.txt');
if (!fs.existsSync(filepath)) {
    console.log("contents.txt not found at", filepath);
    process.exit();
}

const fileContent = fs.readFileSync(filepath, 'utf8');
const lines = fileContent.split(/\r?\n/);
console.log(`Read ${lines.length} lines.`);

// Search for matches
for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.includes("10775") || line.includes("1567396") || line.includes("1 567 396") || line.includes("1 447 396")) {
        console.log(`\n--- Match at line ${idx}: ${line.trim()} ---`);
        const start = Math.max(0, idx - 10);
        const end = Math.min(lines.length, idx + 20);
        for (let j = start; j < end; j++) {
            const prefix = j === idx ? ">>> " : "    ";
            console.log(`${prefix}${j}: ${lines[j].trim()}`);
        }
        console.log("----------------------------------");
    }
}
