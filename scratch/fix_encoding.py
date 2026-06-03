import os

def fix_mojibake(text):
    try:
        # Step 1: Convert the mojibake'd UTF-8 string to bytes assuming it was read as cp1251
        raw_bytes = text.encode('cp1251')
        # Step 2: Decode those bytes as UTF-8
        return raw_bytes.decode('utf-8')
    except Exception:
        return text

def process_file(filepath):
    print(f"Checking {filepath}...")
    try:
        # Read as UTF-8
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if it contains characteristic mojibake patterns
        # 'РџСЂСѓС‚РєРѕРЅ' is 'Пруткон'
        # 'Р' and 'С' are very common in mojibake
        if 'РџСЂСѓС‚РєРѕРЅ' in content or 'РќР°РёРјРµРЅРѕРІР°РЅРёРµ' in content or 'Р’Р«Р‘РћР ' in content:
            print(f"Fixing {filepath}...")
            fixed = fix_mojibake(content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
    return False

# Directories and extensions to scan
target_dir = r"c:\Users\Никитин Иван\Documents\Пруткон 3"
extensions = ('.html', '.js', '.css', '.md')

for root, dirs, files in os.walk(target_dir):
    for name in files:
        if name.endswith(extensions):
            process_file(os.path.join(root, name))
