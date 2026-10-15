import { Stand2Workspace } from './stand2_workspace';
import { exportSettingToFSSPack, serializeFSSPack } from './exporter';
import { getDefaultCatalog, classifyOperationSet, REGISTERED_SETTING_IDS } from '../operation_set_match';
import { SymmetryCatalog } from '../registry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('RUNNING STAND 1 vs STAND 2 ISOLATION TEST SUITE');
console.log('====================================================\n');

// 1. Initial State of Stand 1
console.log('--- 1. Checking Baseline State of Stand 1 ---');
const baselineStand1Catalog = getDefaultCatalog();
assert(baselineStand1Catalog.length === 8, `Stand 1 standard catalog must have exactly 8 records, got ${baselineStand1Catalog.length}`);
assert(REGISTERED_SETTING_IDS.length === 8, `REGISTERED_SETTING_IDS must have exactly 8 entries`);
assert(!REGISTERED_SETTING_IDS.includes('P41' as any), 'P41 must NOT be in Stand 1 REGISTERED_SETTING_IDS');

// Get P41 operations from registry (extended record)
const p41Record = SymmetryCatalog.findBySettingId('P41');
assert(p41Record !== undefined, 'P41 record must exist in SymmetryCatalog');
const p41Ops = p41Record!.operations;

// In Stand 1, classifying P41 against the standard catalog must NOT match
const stand1BeforeMatch = classifyOperationSet(p41Ops);
assert(
  stand1BeforeMatch.verdict === 'NO_CANDIDATES' || stand1BeforeMatch.verdict !== 'EXACT_MATCH',
  `Stand 1 standard catalog must not match P41, verdict: ${stand1BeforeMatch.verdict}`
);
console.log(`  ✓ Stand 1 standard catalog: exactly 8 records, P41 classified as ${stand1BeforeMatch.verdict}`);

// 2. Export P41 to .fsspack
console.log('\n--- 2. Exporting P41 to FSSPack ---');
const p41Pack = exportSettingToFSSPack('P41', {
  exportedByStand: 'STAND-1-ACCEPTANCE-V9'
});
const serializedPack = serializeFSSPack(p41Pack);
assert(p41Pack.manifest.payload_sha256.length === 64, 'P41 package must have valid 64-char SHA-256');
console.log(`  ✓ P41 exported with payload SHA-256: ${p41Pack.manifest.payload_sha256}`);

// 3. Stand 2 Lifecycle: Import to Local Vault (Unactivated)
console.log('\n--- 3. Testing Stand 2 Local Vault Import (Zero Auto-Activation) ---');
const stand2 = new Stand2Workspace(true);
assert(stand2.vaultSize === 0, 'Stand 2 vault must start empty');

const importResult = stand2.importToVault(serializedPack);
assert(importResult.success, `Import to Stand 2 failed: ${importResult.error}`);
assert(stand2.vaultSize === 1, 'Stand 2 vault must contain 1 entry');

const vaultEntry = stand2.getVaultEntry('P41');
assert(vaultEntry !== undefined, 'Vault entry P41 must exist');
assert(vaultEntry!.isActiveInClassifier === false, 'CRITICAL: Imported group MUST NOT be active in classifier automatically');
console.log('  ✓ P41 imported into Stand 2 Local Vault (state: INACTIVE in classifier)');

// Stand 2 Active Catalog Before Explicit Activation
const stand2CatalogBefore = stand2.getActiveCatalog();
assert(stand2CatalogBefore.length === 8, 'Stand 2 active catalog must still have 8 records before activation');
const stand2MatchBefore = stand2.classifyExperiment(p41Ops);
assert(
  stand2MatchBefore.verdict !== 'EXACT_MATCH',
  `Stand 2 before activation must not match P41, verdict: ${stand2MatchBefore.verdict}`
);
console.log('  ✓ Stand 2 active classifier does NOT match P41 prior to explicit activation');

// 4. Stand 2 Activation and Isolated Experimentation
console.log('\n--- 4. Explicit Activation in Stand 2 & Isolated Classification ---');
stand2.activateSetting('P41');
const vaultEntryAfter = stand2.getVaultEntry('P41');
assert(vaultEntryAfter!.isActiveInClassifier === true, 'P41 must now be marked active');

const stand2CatalogAfter = stand2.getActiveCatalog();
assert(stand2CatalogAfter.length === 9, `Stand 2 active catalog must now contain 9 records, got ${stand2CatalogAfter.length}`);

// Classify P41 in Stand 2
const stand2MatchAfter = stand2.classifyExperiment(p41Ops);
assert(stand2MatchAfter.verdict === 'EXACT_MATCH', `Stand 2 must EXACT_MATCH P41 when activated, got ${stand2MatchAfter.verdict}`);
assert(stand2MatchAfter.matchedSettingId === 'P41', `Stand 2 matched setting must be P41, got ${stand2MatchAfter.matchedSettingId}`);
assert(stand2MatchAfter.matchedSpaceGroupNumber === 76, `Matched space group must be 76, got ${stand2MatchAfter.matchedSpaceGroupNumber}`);
console.log('  ✓ Stand 2 successfully classified P41 as EXACT_MATCH (SG 76)');

// 5. Deactivation in Stand 2
console.log('\n--- 5. Deactivation in Stand 2 ---');
stand2.deactivateSetting('P41');
assert(stand2.getActiveCatalog().length === 8, 'Active catalog must return to 8 records after deactivation');
const stand2MatchDeact = stand2.classifyExperiment(p41Ops);
assert(
  stand2MatchDeact.verdict !== 'EXACT_MATCH',
  'Stand 2 must not match P41 after deactivation'
);
console.log('  ✓ Stand 2 deactivation restored active catalog to 8 records');

// 6. Verification of Stand 1 Immutability (Zero Cross-Contamination)
console.log('\n--- 6. Verifying Stand 1 Complete Immutability ---');
const stand1AfterCatalog = getDefaultCatalog();
assert(stand1AfterCatalog.length === 8, 'Stand 1 standard catalog must strictly remain 8 records');
assert(REGISTERED_SETTING_IDS.length === 8, 'REGISTERED_SETTING_IDS must strictly remain 8 records');

const stand1AfterMatch = classifyOperationSet(p41Ops);
assert(
  stand1AfterMatch.verdict !== 'EXACT_MATCH',
  'Stand 1 must still reject P41 query with default catalog'
);

// Check all 8 registered settings in Stand 1
for (const id of REGISTERED_SETTING_IDS) {
  const rec = SymmetryCatalog.findBySettingId(id)!;
  const match = classifyOperationSet(rec.operations);
  assert(match.verdict === 'EXACT_MATCH' && match.matchedSettingId === id, `Stand 1 failed to match its own ${id}`);
}
console.log('  ✓ Stand 1 remains 100% immutable and unpolluted; all 8 baseline groups intact');

console.log('\n====================================================');
console.log('ALL STAND 1 / STAND 2 ISOLATION TESTS PASSED (100%)');
console.log('====================================================');
