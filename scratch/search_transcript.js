const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\Никитин Иван\\.gemini\\antigravity\\brain\\2ee97f69-5947-463c-8436-366644de162c\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
    input: fs.createReadStream(logPath),
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    try {
        const data = JSON.parse(line);
        const content = data.content || "";
        if (content.includes("УП-10775") || content.includes("1 567 396") || content.includes("1567396") || content.includes("10,577") || content.includes("60С2ХА")) {
            console.log(`Index ${data.step_index}:`);
            const paragraphs = content.split('\n');
            paragraphs.forEach(p => {
                if (["УП-10775", "1 567 396", "1567396", "10,577", "60С2ХА", "112 167", "112167"].some(x => p.includes(x))) {
                    console.log("  ", p);
                }
            });
        }
    } catch (e) {
    }
});
