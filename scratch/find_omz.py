import sys

with open('scratch/contents.txt', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

keywords = ['10775', '10.577', '10,577', '1567396', 'omz', 'омз']

for idx, line in enumerate(lines):
    found = False
    for kw in keywords:
        if kw in line.lower():
            found = True
            break
    if found:
        print(f"--- Line {idx} ---")
        start = max(0, idx - 10)
        end = min(len(lines) - 1, idx + 25)
        for j in range(start, end + 1):
            prefix = ">>> " if j == idx else "    "
            print(f"{prefix}{j}: {lines[j].strip()}")
        print("-------------------\n")
