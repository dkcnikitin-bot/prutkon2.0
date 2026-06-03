import os

filepath = "scratch/contents.txt"
if not os.path.exists(filepath):
    print("contents.txt not found!")
    exit()

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines.")

# Search for matches
for idx, line in enumerate(lines):
    if "10775" in line or "1567396" in line or "1 567 396" in line or "1 447 396" in line:
        print(f"\n--- Match at line {idx}: {line.strip()} ---")
        start = max(0, idx - 10)
        end = min(len(lines), idx + 20)
        for j in range(start, end):
            prefix = ">>> " if j == idx else "    "
            print(f"{prefix}{j}: {lines[j].strip()}")
