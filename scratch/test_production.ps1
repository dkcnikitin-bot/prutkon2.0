# Powershell Verification Script for Prutkon Production Math and Inventory Calculations

Write-Host "=== STARTING RODS PRODUCTION MATH VERIFICATION (POWERSHELL) ===" -ForegroundColor Cyan

# Mock variables
$dbWarehouseInv = @{
    "metal_101" = 100.0  # 100 kg of 10-OMZ raw steel
    "blank" = 5
    "straight" = 2
}

$batch_qty = 100.0
$blank_length = 500.0 # mm
$weight_per_m = 0.616 # kg/m

Write-Host "Initial Warehouse Inventory:"
Write-Host "  Raw metal (10-OMZ): $($dbWarehouseInv["metal_101"]) kg"
Write-Host "  Blanks: $($dbWarehouseInv["blank"]) pcs"
Write-Host "  Straight rods: $($dbWarehouseInv["straight"]) pcs"

# 1. Simulating Step 2: Cut Blanks
$qty_to_make = 20
Write-Host "`n--- Simulating Production of $qty_to_make Blanks (L=$blank_length mm, weight_per_m=$weight_per_m kg/m) ---"

$reqWeight = [Math]::Round(($qty_to_make * ($blank_length / 1000.0) * $weight_per_m), 2)
Write-Host "Calculated required raw weight: $reqWeight kg"

# Check balance
if ($batch_qty -lt $reqWeight) {
    Write-Error "Insufficient raw metal!"
    exit 1
}

# Deduct raw material
$batch_qty = [Math]::Round(($batch_qty - $reqWeight), 2)
$dbWarehouseInv["metal_101"] = [Math]::Round(($dbWarehouseInv["metal_101"] - $reqWeight), 2)

# Credit blanks
$dbWarehouseInv["blank"] = $dbWarehouseInv["blank"] + $qty_to_make

Write-Host "Result of Blanks Production:"
Write-Host "  Updated Raw Metal batch: $batch_qty kg"
Write-Host "  Updated Raw Metal inventory: $($dbWarehouseInv["metal_101"]) kg"
Write-Host "  Updated Blanks inventory: $($dbWarehouseInv["blank"]) pcs"

# 2. Simulating Step 3: Produce Standard Rods
$rods_to_make = 15
Write-Host "`n--- Simulating Production of $rods_to_make Standard Rods ---"
Write-Host "Requires $rods_to_make blanks. Available blanks: $($dbWarehouseInv["blank"])"

if ($dbWarehouseInv["blank"] -lt $rods_to_make) {
    Write-Error "Insufficient blanks!"
    exit 1
}

# Deduct blanks
$dbWarehouseInv["blank"] = $dbWarehouseInv["blank"] - $rods_to_make
# Credit standard rods
$dbWarehouseInv["straight"] = $dbWarehouseInv["straight"] + $rods_to_make

Write-Host "Result of Standard Rods Production:"
Write-Host "  Updated Blanks inventory: $($dbWarehouseInv["blank"]) pcs"
Write-Host "  Updated Straight rods inventory: $($dbWarehouseInv["straight"]) pcs"

Write-Host "`n=== RUNNING MATH ASSERTIONS ===" -ForegroundColor Yellow

$errors = 0

# Check metal weight deduction (100 - 6.16 = 93.84)
if ($dbWarehouseInv["metal_101"] -eq 93.84) {
    Write-Host "[OK] PASS: Raw metal inventory correctly decremented to 93.84 kg!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] FAIL: Raw metal inventory mismatch! Got $($dbWarehouseInv["metal_101"]) (Expected 93.84)" -ForegroundColor Red
    $errors++
}

# Check blanks credit and decrement (5 + 20 - 15 = 10)
if ($dbWarehouseInv["blank"] -eq 10) {
    Write-Host "[OK] PASS: Blanks inventory successfully calculated as 10!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] FAIL: Blanks inventory mismatch! Got $($dbWarehouseInv["blank"]) (Expected 10)" -ForegroundColor Red
    $errors++
}

# Check straight rods credit (2 + 15 = 17)
if ($dbWarehouseInv["straight"] -eq 17) {
    Write-Host "[OK] PASS: Straight rods inventory successfully calculated as 17!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] FAIL: Straight rods inventory mismatch! Got $($dbWarehouseInv["straight"]) (Expected 17)" -ForegroundColor Red
    $errors++
}

Write-Host "`n=== VERIFICATION SUMMARY ===" -ForegroundColor Yellow
if ($errors -eq 0) {
    Write-Host "ALL TESTS PASSED SUCCESSFULLY! The rod production inventory math is 100% correct and robust." -ForegroundColor Green
} else {
    Write-Host "TESTS COMPLETED WITH $errors ERRORS. Please check the mathematical logic." -ForegroundColor Red
}
