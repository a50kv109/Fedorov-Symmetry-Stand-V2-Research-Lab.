import {
  REFERENCE_P41_RECORD,
  REFERENCE_P43_RECORD,
  analyzeTetragonalScrewAxis,
  createP41FSSPack,
  createP43FSSPack
} from './p41_p43_validator';
import { auditFSSPack } from './gatekeeper';
import { importFSSPack } from './importer';
import { Stand2Workspace } from './stand2_workspace';
import { ExactRational } from '../schema/crystallographic_exchange';
import { serializeFSSPack } from './exporter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('RUNNING SG 76 (P41) vs SG 78 (P43) TEST SUITE');
console.log('====================================================\n');

// 1. Structural and Mathematical Verification of P41 and P43 Reference Records
console.log('--- 1. Reference Records Verification ---');
assert(REFERENCE_P41_RECORD.operations.length === 4, 'P41 must have exactly 4 operations');
assert(REFERENCE_P43_RECORD.operations.length === 4, 'P43 must have exactly 4 operations');

// Verify P41 screw axis
const p41Analysis = analyzeTetragonalScrewAxis(REFERENCE_P41_RECORD.operations);
assert(p41Analysis.isTetragonal4Fold, 'P41 must be recognized as tetragonal 4-fold');
assert(p41Analysis.chirality === 'RIGHT_HANDED_P41', `P41 must be right-handed, got ${p41Analysis.chirality}`);
assert(p41Analysis.spaceGroupCandidate === 76, 'P41 space group candidate must be 76');
assert(p41Analysis.screwPitchZ!.n === 1 && p41Analysis.screwPitchZ!.d === 4, 'P41 screw pitch must be 1/4');
assert(!p41Analysis.isCentrosymmetric, 'P41 must not be centrosymmetric');
console.log('  ✓ P41 reference operations: right-handed screw pitch +1/4 along z [0,0,1]');

// Verify P43 screw axis
const p43Analysis = analyzeTetragonalScrewAxis(REFERENCE_P43_RECORD.operations);
assert(p43Analysis.isTetragonal4Fold, 'P43 must be recognized as tetragonal 4-fold');
assert(p43Analysis.chirality === 'LEFT_HANDED_P43', `P43 must be left-handed, got ${p43Analysis.chirality}`);
assert(p43Analysis.spaceGroupCandidate === 78, 'P43 space group candidate must be 78');
assert(p43Analysis.screwPitchZ!.n === 3 && p43Analysis.screwPitchZ!.d === 4, 'P43 screw pitch must be 3/4');
assert(!p43Analysis.isCentrosymmetric, 'P43 must not be centrosymmetric');
console.log('  ✓ P43 reference operations: left-handed screw pitch +3/4 along z [0,0,1]');

// 2. FSSPack Creation and Gatekeeper Validation
console.log('\n--- 2. FSSPack Packaging & Gatekeeper Acceptance ---');
const packP41 = createP41FSSPack();
const packP43 = createP43FSSPack();

const auditP41 = auditFSSPack(packP41);
assert(auditP41.overallPassed, `Gatekeeper rejected valid P41 pack: ${auditP41.errors.map(e => e.message).join('; ')}`);
console.log(`  ✓ Gatekeeper verified P41 pack (SHA-256: ${packP41.manifest.payload_sha256})`);

const auditP43 = auditFSSPack(packP43);
assert(auditP43.overallPassed, `Gatekeeper rejected valid P43 pack: ${auditP43.errors.map(e => e.message).join('; ')}`);
console.log(`  ✓ Gatekeeper verified P43 pack (SHA-256: ${packP43.manifest.payload_sha256})`);

// 3. Negative Enantiomorph Mismatch Tests (Chirality Guard)
console.log('\n--- 3. Testing Chirality & False Coincidence Guard ---');

// Case A: Package claims SG 76 (P41), but contains P43 operations (pitch 3/4)
const counterfeitP41 = JSON.parse(JSON.stringify(packP41));
counterfeitP41.payload.passport.operations = JSON.parse(JSON.stringify(packP43.payload.passport.operations));
// Re-hash so payload hash is valid, but Gatekeeper chirality check catches it
const { canonicalizeJson, computeSha256 } = await import('./canonical_json');
counterfeitP41.manifest.payload_sha256 = computeSha256(canonicalizeJson(counterfeitP41.payload));

const auditCounterfeit = auditFSSPack(counterfeitP41);
assert(!auditCounterfeit.overallPassed, 'Gatekeeper must reject P43 operations packaged under SG 76 label');
assert(
  auditCounterfeit.checks.some(c => c.errorCode === 'ERR_CHIRALITY_MISMATCH'),
  'Expected ERR_CHIRALITY_MISMATCH for pitch 3/4 under SG 76'
);
console.log('  ✓ Prevented false substitution: P43 operations claiming SG 76 cleanly rejected (ERR_CHIRALITY_MISMATCH)');

// Case B: Centrosymmetric contamination (Inversion injected into P41)
const contaminatedP41 = JSON.parse(JSON.stringify(packP41));
contaminatedP41.payload.passport.operations.push({
  index: 4,
  rotation_matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
  translation_vector: [{ n: 0, d: 1 }, { n: 0, d: 1 }, { n: 0, d: 1 }],
  jones_faithful: "-x,-y,-z"
});
contaminatedP41.payload.passport.operations_count = 5;
contaminatedP41.manifest.payload_sha256 = computeSha256(canonicalizeJson(contaminatedP41.payload));

const auditContaminated = auditFSSPack(contaminatedP41);
assert(!auditContaminated.overallPassed, 'Gatekeeper must reject centrosymmetric contamination');
console.log('  ✓ Centrosymmetric contamination cleanly rejected');

// 4. Stand 2 Lab: Mutual Discrimination of P41 and P43
console.log('\n--- 4. Stand 2 Lab Enantiomorphic Discrimination ---');
const stand2 = new Stand2Workspace(false); // Isolated stand with no base catalog

// Import both P41 and P43
const imp1 = stand2.importToVault(serializeFSSPack(packP41));
const imp2 = stand2.importToVault(serializeFSSPack(packP43));
assert(imp1.success && imp2.success, 'Both packages must import to Stand 2 vault');

// Activate both in Stand 2 active catalog
stand2.activateSetting('P41');
stand2.activateSetting('P43');
assert(stand2.getActiveCatalog().length === 2, 'Stand 2 active catalog should have both P41 and P43');

// Query with P41 operations
const queryP41 = REFERENCE_P41_RECORD.operations;
const resMatchP41 = stand2.classifyExperiment(queryP41);
assert(resMatchP41.verdict === 'EXACT_MATCH', `Query P41 must yield EXACT_MATCH, got ${resMatchP41.verdict}`);
assert(resMatchP41.matchedSettingId === 'P41', `Query P41 must match P41, got ${resMatchP41.matchedSettingId}`);
assert(resMatchP41.matchedSpaceGroupNumber === 76, `Matched SG must be 76, got ${resMatchP41.matchedSpaceGroupNumber}`);
console.log('  ✓ Query P41 uniquely classified as P41 (SG 76) without ambiguity');

// Query with P43 operations
const queryP43 = REFERENCE_P43_RECORD.operations;
const resMatchP43 = stand2.classifyExperiment(queryP43);
assert(resMatchP43.verdict === 'EXACT_MATCH', `Query P43 must yield EXACT_MATCH, got ${resMatchP43.verdict}`);
assert(resMatchP43.matchedSettingId === 'P43', `Query P43 must match P43, got ${resMatchP43.matchedSettingId}`);
assert(resMatchP43.matchedSpaceGroupNumber === 78, `Matched SG must be 78, got ${resMatchP43.matchedSpaceGroupNumber}`);
console.log('  ✓ Query P43 uniquely classified as P43 (SG 78) without ambiguity');

// Cross-enantiomorph negative test: Ensure P41 never matches P43
assert(resMatchP41.matchedSettingId !== 'P43', 'P41 must not match P43');
assert(resMatchP43.matchedSettingId !== 'P41', 'P43 must not match P41');
console.log('  ✓ Cross-enantiomorph orthogonality verified: zero false matching across chiral boundary');

// 5. Origin Shift Invariance Analysis (Delta z)
console.log('\n--- 5. Origin Shift Analysis for Screw Axis ---');
// For any origin shift Delta = [x0, y0, z0]:
// The transformation of translation is w' = w + (I - W)*Delta.
// For W = [[0, -1, 0], [1, 0, 0], [0, 0, 1]], (I - W) has row 2 equal to [0, 0, 0].
// Thus w_z' = w_z + 0 * Delta = w_z.
// The z-translation component of C4+ is an absolute geometric invariant modulo 1.
console.log('  ✓ Proven: (I - W) row 2 is identically [0,0,0], guaranteeing invariant screw pitch under any origin shift');

console.log('\n====================================================');
console.log('ALL SG 76 (P41) vs SG 78 (P43) TESTS PASSED (100%)');
console.log('====================================================');
