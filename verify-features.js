#!/usr/bin/env node
// Quick verification script for ready-made drinks feature

import { readFileSync } from 'fs';

console.log('🔍 Verifying Ready-Made Drinks Feature Installation...\n');

// Check 1: types.ts
console.log('📝 Check 1: Verifying types.ts...');
const typesFile = readFileSync('types.ts', 'utf8');
const hasIsReadyMade = typesFile.includes('isReadyMade?:');
const hasReadyMadeStockId = typesFile.includes('readyMadeStockId?:');

if (hasIsReadyMade && hasReadyMadeStockId) {
  console.log('   ✅ types.ts has new fields');
} else {
  console.log('   ❌ types.ts missing fields');
  console.log('      isReadyMade:', hasIsReadyMade);
  console.log('      readyMadeStockId:', hasReadyMadeStockId);
}

// Check 2: constants.ts
console.log('\n📝 Check 2: Verifying constants.ts...');
const constantsFile = readFileSync('constants.ts', 'utf8');
const hasCocaCola = constantsFile.includes('Coca-Cola Can');
const hasSprite = constantsFile.includes('Sprite Can');
const hasWater = constantsFile.includes('Mineral Water Bottle');
const hasJuice = constantsFile.includes('Orange Juice Box');

const hasCocaColaMenu = constantsFile.includes("name: 'Coca-Cola'");
const hasSpriteMenu = constantsFile.includes("name: 'Sprite'");

if (hasCocaCola && hasSprite && hasWater && hasJuice && hasCocaColaMenu && hasSpriteMenu) {
  console.log('   ✅ constants.ts has 4 new inventory items');
  console.log('   ✅ constants.ts has ready-made menu items');
} else {
  console.log('   ❌ constants.ts missing items');
  console.log('      Inventory:');
  console.log('        Coca-Cola Can:', hasCocaCola);
  console.log('        Sprite Can:', hasSprite);
  console.log('        Mineral Water:', hasWater);
  console.log('        Orange Juice:', hasJuice);
  console.log('      Menu:');
  console.log('        Coca-Cola menu:', hasCocaColaMenu);
  console.log('        Sprite menu:', hasSpriteMenu);
}

// Check 3: POS.tsx
console.log('\n📝 Check 3: Verifying components/POS.tsx...');
const posFile = readFileSync('components/POS.tsx', 'utf8');
const hasInventoryProp = posFile.includes('inventory: Ingredient[]');
const hasGetStockForItem = posFile.includes('getStockForItem');
const hasIsItemAvailable = posFile.includes('isItemAvailable');
const hasAvailableQty = posFile.includes('getAvailableQuantity');
const hasReadyBadge = posFile.includes('🥤 READY');

if (hasInventoryProp && hasGetStockForItem && hasIsItemAvailable && hasAvailableQty && hasReadyBadge) {
  console.log('   ✅ POS.tsx has stock checking logic');
  console.log('   ✅ POS.tsx has ready-made badges');
} else {
  console.log('   ❌ POS.tsx missing features');
  console.log('      inventory prop:', hasInventoryProp);
  console.log('      getStockForItem:', hasGetStockForItem);
  console.log('      isItemAvailable:', hasIsItemAvailable);
  console.log('      getAvailableQuantity:', hasAvailableQty);
  console.log('      Ready badge:', hasReadyBadge);
}

// Check 4: App.tsx
console.log('\n📝 Check 4: Verifying App.tsx...');
const appFile = readFileSync('App.tsx', 'utf8');
const passesInventoryToPOS = appFile.includes('inventory={inventory}');
const hasReadyMadeDeduction = appFile.includes('isReadyMade && menuItem.readyMadeStockId');

if (passesInventoryToPOS && hasReadyMadeDeduction) {
  console.log('   ✅ App.tsx passes inventory to POS');
  console.log('   ✅ App.tsx handles ready-made stock deduction');
} else {
  console.log('   ❌ App.tsx missing features');
  console.log('      Passes inventory:', passesInventoryToPOS);
  console.log('      Ready-made deduction:', hasReadyMadeDeduction);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY\n');

const allChecks = [
  hasIsReadyMade && hasReadyMadeStockId,
  hasCocaCola && hasSprite && hasWater && hasJuice,
  hasCocaColaMenu && hasSpriteMenu,
  hasInventoryProp && hasGetStockForItem,
  hasReadyBadge,
  passesInventoryToPOS && hasReadyMadeDeduction
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

if (passedChecks === totalChecks) {
  console.log('✅ ALL CHECKS PASSED! Feature is fully installed.');
  console.log('\n📱 Next Steps:');
  console.log('   1. Open: http://localhost:3000');
  console.log('   2. Login (click "Open Register")');
  console.log('   3. Click "Drinks" category');
  console.log('   4. Look for blue "🥤 READY" badges!');
  console.log('\n💡 If you still don\'t see them:');
  console.log('   - Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+F5');
  console.log('   - Clear localStorage in DevTools');
} else {
  console.log(`⚠️  ${passedChecks}/${totalChecks} checks passed`);
  console.log('\nSome features may be missing. Review the errors above.');
}

console.log('\n' + '='.repeat(60));

