import os

terms = [
    "МАСТЕР ПОСТРОЕНИЯ",
    "ДЛИНА КОЛЬЦА",
    "ТЕОРЕТИЧЕСКИЙ РАСЧЕТ",
    "ШИРИНА ТРАНСПОРТЕРА",
    "поставщик",
    "место хран",
    "ремни на складе"
]

for root, dirs, files in os.walk(r"c:\Users\Никитин Иван\Documents\GitHub\prutkon2.0"):
    for file in files:
        if file.endswith(".html") or file.endswith(".js"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    for term in terms:
                        if term.lower() in content.lower():
                            print(f"Found '{term}' in {path}")
            except Exception as e:
                pass
