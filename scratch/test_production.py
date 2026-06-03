# -*- coding: utf-8 -*-
"""
Test script for verifying the Prutkon Rods Production warehouse balance integration logic in Python.
"""
from __future__ import print_function

# Mock database
db = {
    'rods_metal': [
        {'id': 0, 'name': '10-OMZ', 'dia': '10', 'pricePerM': 74.82}
    ],
    'rods_blanks': [
        {'id': 0, 'dia': '10', 'length': 500.0, 'labor': 50.0, 'price': 87.41}
    ],
    'rods_standard': [
        {'id': 0, 'name': 'Прямой пруток 10x500', 'article': 'PR-10-500', 'dia': '10', 'length': 500.0, 'price': 187.41}
    ]
}

dbWarehouseInv = {
    'metal_101': 100.0,  # 100 kg of 10-OMZ raw steel
    'blank': 5,
    'straight': 2
}

dbWarehouseBatches = [
    {
        'id': 'batch_eng_101',
        'name': '10-OMZ',
        'steel_type': '60С2ХА',
        'dia': 10.0,
        'qty': 100.0,
        'weight': 100.0,
        'available_weight': 100.0
    }
]

dbDirectories = [
    {'id': 101, 'category': 'metal', 'name': '10-OMZ', 'diameter': '10', 'weight_per_m': '0.616'}
]

print("=== STARTING RODS PRODUCTION MATH VERIFICATION ===")
print("Initial Warehouse Inventory:", dbWarehouseInv)
print("Initial Batches:", dbWarehouseBatches)

def simulate_produce_blanks(qty, blank_idx, batch_idx):
    batch = dbWarehouseBatches[batch_idx]
    blank = db['rods_blanks'][blank_idx]
    
    print("\n--- Simulating Production of {} Blanks (L={}mm, Dia={}mm) ---".format(qty, blank['length'], blank['dia']))
    print("Using batch: {} (Available weight: {} kg)".format(batch['name'], batch['qty']))
    
    # Calculate weight per meter
    weight_per_m = float(batch.get('weight_per_m', 0) or batch.get('weight_m', 0) or 0)
    if not weight_per_m and dbDirectories:
        dir_metal = next((d for d in dbDirectories if d['category'] == 'metal' and (d['name'] == batch['steel_type'] or d['name'] == batch['name']) and float(d['diameter'] or d['dia']) == float(batch['dia'] or batch['diameter'])), None)
        if dir_metal:
            weight_per_m = float(dir_metal.get('weight_per_m', 0) or dir_metal.get('weight_m', 0) or 0)
    
    if not weight_per_m:
        weight_per_m = float(batch.get('dia', 0) or batch.get('diameter', 0) or 0) ** 2 * 0.006165
        
    print("Calculated weight per meter: {} kg/m".format(weight_per_m))
    
    # Total raw weight required
    req_weight = round(qty * (float(blank['length']) / 1000.0) * weight_per_m, 2)
    print("Required raw metal weight: {} kg".format(req_weight))
    
    if batch['qty'] < req_weight:
        raise ValueError("Insufficient raw metal in batch! Needed: {}, Available: {}".format(req_weight, batch['qty']))
        
    # Deduct from batch
    batch['qty'] = round(float(batch['qty']) - req_weight, 2)
    batch['available_weight'] = batch['qty']
    if 'weight' in batch:
        batch['weight'] = batch['qty']
        
    # Deduct from main inventory key
    metal_key = 'metal_101'
    if metal_key in dbWarehouseInv:
        dbWarehouseInv[metal_key] = round(float(dbWarehouseInv[metal_key]) - req_weight, 2)
        
    # Add finished blanks to warehouse
    dbWarehouseInv['blank'] = int(dbWarehouseInv.get('blank', 0)) + qty
    
    details = "Нарезка заготовок L={} мм: +{} шт. Списано сырья ({} Ø{} мм): -{} кг".format(blank['length'], qty, batch['name'], batch['dia'], req_weight)
    print("Result:", details)
    print("Updated Warehouse Inventory:", dbWarehouseInv)
    print("Updated Batches:", dbWarehouseBatches)
    
    return req_weight, qty

def simulate_produce_standard_rods(qty, rod_idx):
    rod = db['rods_standard'][rod_idx]
    
    print("\n--- Simulating Production of {} Standard Rods [{}] ---".format(qty, rod['article']))
    print("Requires {} blanks. Available blanks: {}".format(qty, dbWarehouseInv['blank']))
    
    if dbWarehouseInv['blank'] < qty:
        raise ValueError("Insufficient blanks! Needed: {}, Available: {}".format(qty, dbWarehouseInv['blank']))
        
    # Deduct blanks
    dbWarehouseInv['blank'] = int(dbWarehouseInv.get('blank', 0)) - qty
    # Add standard rods
    dbWarehouseInv['straight'] = int(dbWarehouseInv.get('straight', 0)) + qty
    
    details = "Сборка прямого прутка [{}]: +{} шт. Списано заготовок: -{} шт.".format(rod['article'], qty, qty)
    print("Result:", details)
    print("Updated Warehouse Inventory:", dbWarehouseInv)
    
    return qty

# 1. Run blank production test
req_w, q_prod = simulate_produce_blanks(20, 0, 0)
expected_weight_deduction = round(20 * 0.5 * 0.616, 2)  # 6.16 kg

if req_w == expected_weight_deduction:
    print("\n[OK] PASS: Raw metal weight calculation correct! Deducted: {} kg (Expected: {} kg)".format(req_w, expected_weight_deduction))
else:
    print("\n[ERROR] FAIL: Raw metal weight calculation mismatch! Deducted: {} kg (Expected: {} kg)".format(req_w, expected_weight_deduction))

if dbWarehouseInv['blank'] == 25:
    print("[OK] PASS: Blanks inventory successfully credited to 25!")
else:
    print("[ERROR] FAIL: Blanks inventory mismatch! Got: {} (Expected: 25)".format(dbWarehouseInv['blank']))

if dbWarehouseInv['metal_101'] == 93.84:
    print("[OK] PASS: Metal raw inventory correctly decremented to 93.84 kg!")
else:
    print("[ERROR] FAIL: Metal raw inventory mismatch! Got: {} (Expected: 93.84)".format(dbWarehouseInv['metal_101']))

# 2. Run standard rod production test
simulate_produce_standard_rods(15, 0)

if dbWarehouseInv['blank'] == 10:
    print("[OK] PASS: Blanks inventory correctly decremented to 10!")
else:
    print("[ERROR] FAIL: Blanks inventory mismatch! Got: {} (Expected: 10)".format(dbWarehouseInv['blank']))

if dbWarehouseInv['straight'] == 17:
    print("[OK] PASS: Straight rods inventory successfully credited to 17!")
else:
    print("[ERROR] FAIL: Straight rods inventory mismatch! Got: {} (Expected: 17)".format(dbWarehouseInv['straight']))

print("\n=== RODS PRODUCTION MATH VERIFICATION COMPLETE ===")
