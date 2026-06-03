import pandas as pd
import json

excel_file = 'Пруткон.xlsx'
try:
    xl = pd.ExcelFile(excel_file)
    sheets = xl.sheet_names
    
    info = {}
    for sheet in sheets:
        try:
            df = xl.parse(sheet, nrows=5)
            info[sheet] = {
                'columns': list(df.columns.astype(str)),
                'head': df.astype(str).to_dict(orient='records')
            }
        except Exception as e:
            info[sheet] = f"Error reading sheet: {e}"
            
    with open('excel_info.json', 'w', encoding='utf-8') as f:
        json.dump(info, f, ensure_ascii=False, indent=2)
    print("Successfully extracted excel info to excel_info.json")
except Exception as e:
    print(f"Error: {e}")
