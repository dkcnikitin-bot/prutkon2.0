import json
import re

log_path = r"C:\Users\Никитин Иван\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"

print("Searching transcript for invoice information...")
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get("content", "")
            # Look for numbers or text that are related to invoice or weight
            if "УП-10775" in content or "1 567 396" in content or "1567396" in content or "10,577" in content or "60С2ХА" in content:
                print(f"Index {data.get('step_index')}:")
                # Print paragraphs containing the keywords
                for p in content.split('\n'):
                    if any(x in p for x in ["УП-10775", "1 567 396", "1567396", "10,577", "60С2ХА", "112 167", "112167"]):
                        print("  ", p)
        except Exception as e:
            pass
