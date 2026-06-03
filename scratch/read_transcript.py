import json
import os

app_data = os.environ.get('USERPROFILE')
log_path = os.path.join(app_data, r'.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl')

print(f"Reading from {log_path}...")
if not os.path.exists(log_path):
    print("Log path does not exist!")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            d = json.loads(line)
            idx = d.get('step_index', 0)
            # We want to check steps around 552, 632, 870
            if idx in [552, 632, 870]:
                print(f"\n=== STEP {idx} ({d.get('source')} | {d.get('type')}) ===")
                print(f"CONTENT: {d.get('content')}")
                if 'tool_calls' in d and d['tool_calls']:
                    print("TOOL CALLS:")
                    for tc in d['tool_calls']:
                        print(f"  {tc.get('name')}: {tc.get('args')}")
        except Exception as e:
            pass
