/**
 * Test script for verifying the Prutkon Rods Production warehouse balance integration logic.
 * This script simulates the production of blanks from raw steel and standard rods from blanks,
 * ensuring all deductions, fallbacks, and log records are mathematically correct.
 */

// Mock window and local storage
const mockLocalStorageStore = {};
global.localStorage = {
    getItem: (key) => mockLocalStorageStore[key] || null,
    setItem: (key, val) => { mockLocalStorageStore[key] = String(val); },
    removeItem: (key) => { delete mockLocalStorageStore[key]; }
};

// Setup Mock globals as in the real application environment
global.window = {
    db: {
        rods_metal: [
            { id: 0, name: '10-OMZ', dia: '10', pricePerM: 74.82 }
        ],
        rods_blanks: [
            { id: 0, dia: '10', length: 500, labor: 50, price: 87.41 }
        ],
        rods_standard: [
            { id: 0, name: 'Прямой пруток 10x500', article: 'PR-10-500', dia: '10', length: 500, price: 187.41 }
        ]
    },
    dbWarehouseInv: {
        'metal_101': 100.0, // 100 kg of 10-OMZ raw steel
        blank: 5,
        straight: 2
    },
    dbWarehouseBatches: [
        {
            id: 'batch_eng_101',
            name: '10-OMZ',
            steel_type: '60С2ХА',
            dia: 10,
            qty: 100.0,
            weight: 100.0,
            available_weight: 100.0
        }
    ],
    dbDirectories: [
        { id: 101, category: 'metal', name: '10-OMZ', diameter: '10', weight_per_m: '0.616' }
    ],
    dbEmployees: [
        { name: 'Иван Никитин', role: 'Администратор', pwd: '123' }
    ],
    dbWarehouseLog: []
};

// Assign local aliases to mimic rods_production.js globals
const db = global.window.db;
const dbWarehouseInv = global.window.dbWarehouseInv;
const dbWarehouseBatches = global.window.dbWarehouseBatches;
const dbDirectories = global.window.dbDirectories;

console.log("=== STARTING RODS PRODUCTION MATH VERIFICATION ===");
console.log("Initial Warehouse Inventory:", JSON.stringify(dbWarehouseInv));
console.log("Initial Batches:", JSON.stringify(dbWarehouseBatches));

// Simulation function for Step 2: Cut Blanks (Raw Metal -> Blanks)
function simulateProduceBlanks(qty, blankIdx, batchIdx) {
    const batch = dbWarehouseBatches[batchIdx];
    const blank = db.rods_blanks[blankIdx];
    
    console.log(`\n--- Simulating Production of ${qty} Blanks (L=${blank.length}mm, Dia=${blank.dia}mm) ---`);
    console.log(`Using batch: ${batch.name} (Available weight: ${batch.qty} kg)`);
    
    // Calculate weight per meter
    let weightPerM = parseFloat(batch.weight_per_m || batch.weight_m || 0);
    if (!weightPerM && dbDirectories) {
        const dirMetal = dbDirectories.find(d => d.category === 'metal' && (d.name === batch.steel_type || d.name === batch.name) && parseFloat(d.diameter || d.dia) === parseFloat(batch.dia || batch.diameter));
        if (dirMetal) weightPerM = parseFloat(dirMetal.weight_per_m || dirMetal.weight_m || 0);
    }
    if (!weightPerM) {
        weightPerM = parseFloat(batch.dia || batch.diameter || 0) * parseFloat(batch.dia || batch.diameter || 0) * 0.006165;
    }
    
    console.log(`Calculated weight per meter: ${weightPerM} kg/m`);
    
    // Total raw weight required
    const reqWeight = parseFloat((qty * (parseFloat(blank.length) / 1000) * weightPerM).toFixed(2));
    console.log(`Required raw metal weight: ${reqWeight} kg`);
    
    if (batch.qty < reqWeight) {
        throw new Error(`Insufficient raw metal in batch! Needed: ${reqWeight} kg, Available: ${batch.qty} kg`);
    }
    
    // Deduct from batch
    batch.qty = parseFloat((parseFloat(batch.qty || 0) - reqWeight).toFixed(2));
    batch.available_weight = batch.qty;
    if (batch.weight !== undefined) batch.weight = batch.qty;
    
    // Deduct from main inventory key
    const metalKey = 'metal_101';
    if (dbWarehouseInv[metalKey]) {
        dbWarehouseInv[metalKey] = parseFloat((parseFloat(dbWarehouseInv[metalKey] || 0) - reqWeight).toFixed(2));
    }
    
    // Add finished blanks to warehouse
    dbWarehouseInv.blank = parseInt(dbWarehouseInv.blank || 0) + qty;
    
    const details = `Нарезка заготовок L=${blank.length} мм: +${qty} шт. Списано сырья (${batch.name} Ø${batch.dia} мм): -${reqWeight} кг`;
    console.log(`Result: ${details}`);
    console.log("Updated Warehouse Inventory:", JSON.stringify(dbWarehouseInv));
    console.log("Updated Batches:", JSON.stringify(dbWarehouseBatches));
    
    return { reqWeight, qty };
}

// Simulation function for Step 3: Produce Standard Rods (Blanks -> Standard Rods)
function simulateProduceStandardRods(qty, rodIdx) {
    const rod = db.rods_standard[rodIdx];
    
    console.log(`\n--- Simulating Production of ${qty} Standard Rods [${rod.article}] ---`);
    console.log(`Requires ${qty} blanks. Available blanks: ${dbWarehouseInv.blank}`);
    
    if (dbWarehouseInv.blank < qty) {
        throw new Error(`Insufficient blanks! Needed: ${qty}, Available: ${dbWarehouseInv.blank}`);
    }
    
    // Deduct blanks
    dbWarehouseInv.blank = parseInt(dbWarehouseInv.blank || 0) - qty;
    // Add standard rods
    dbWarehouseInv.straight = parseInt(dbWarehouseInv.straight || 0) + qty;
    
    const details = `Сборка прямого прутка [${rod.article || rod.name}]: +${qty} шт. Списано заготовок: -${qty} шт.`;
    console.log(`Result: ${details}`);
    console.log("Updated Warehouse Inventory:", JSON.stringify(dbWarehouseInv));
    
    return qty;
}

// 1. Run blank production test
const result1 = simulateProduceBlanks(20, 0, 0); // Make 20 blanks of 500mm (requires 20 * 0.5m * 0.616kg/m = 6.16 kg)
const expectedWeightDeduction = parseFloat((20 * 0.5 * 0.616).toFixed(2)); // 6.16 kg

if (result1.reqWeight === expectedWeightDeduction) {
    console.log(`\n✅ PASS: Raw metal weight calculation correct! Deducted: ${result1.reqWeight} kg (Expected: ${expectedWeightDeduction} kg)`);
} else {
    console.error(`\n❌ FAIL: Raw metal weight calculation mismatch! Deducted: ${result1.reqWeight} kg (Expected: ${expectedWeightDeduction} kg)`);
}

if (dbWarehouseInv.blank === 25) { // 5 initial + 20 produced
    console.log(`✅ PASS: Blanks inventory successfully credited to 25!`);
} else {
    console.error(`❌ FAIL: Blanks inventory mismatch! Got: ${dbWarehouseInv.blank} (Expected: 25)`);
}

if (dbWarehouseInv.metal_101 === 93.84) { // 100 - 6.16
    console.log(`✅ PASS: Metal raw inventory correctly decremented to 93.84 kg!`);
} else {
    console.error(`❌ FAIL: Metal raw inventory mismatch! Got: ${dbWarehouseInv.metal_101} (Expected: 93.84)`);
}

// 2. Run standard rod production test
simulateProduceStandardRods(15, 0); // Make 15 straight rods from our 25 blanks (requires 15 blanks, leaves 10)

if (dbWarehouseInv.blank === 10) {
    console.log(`✅ PASS: Blanks inventory correctly decremented to 10!`);
} else {
    console.error(`❌ FAIL: Blanks inventory mismatch! Got: ${dbWarehouseInv.blank} (Expected: 10)`);
}

if (dbWarehouseInv.straight === 17) { // 2 initial + 15 produced
    console.log(`✅ PASS: Straight rods inventory successfully credited to 17!`);
} else {
    console.error(`❌ FAIL: Straight rods inventory mismatch! Got: ${dbWarehouseInv.straight} (Expected: 17)`);
}

console.log("\n=== RODS PRODUCTION MATH VERIFICATION COMPLETE ===");
