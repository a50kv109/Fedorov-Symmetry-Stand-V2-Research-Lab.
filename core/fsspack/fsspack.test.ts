import { canonicalizeJson, computeSha256 } from './canonical_json';
import { validateFSSPackSchema } from './schema_validator';
import { auditFSSPack } from './gatekeeper';
import { exportToFSSPack, exportSettingToFSSPack, serializeFSSPack } from './exporter';
import { importFSSPack, determineCatalogStatus } from './importer';
import { SymmetryCatalog } from '../registry';
import { REGISTERED_SETTING_IDS } from '../operation_set_match';
import { FSSPackContainer } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('RUNNING FSSPACK V1.0 & GATEKEEPER TEST SUITE');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// 1. RFC 8785 (JCS) & SHA-256 TESTS
// -----------------------------------------------------------------------------
console.log('--- 1. Testing RFC 8785 (JCS) Canonicalization & SHA-256 ---');

// 1.1 Object Key Ordering (UTF-16 code units)
const unorderedObj = {
  z: 1,
  b: 2,
  a: { y: 10, x: 20 },
  _special: true
};
const canonicalStr = canonicalizeJson(unorderedObj);
const expectedStr = '{"_special":true,"a":{"x":20,"y":10},"b":2,"z":1}';
assert(canonicalStr === expectedStr, `JCS key ordering failed: got ${canonicalStr}`);
console.log('  ✓ 1.1 JCS key ordering strictly follows UTF-16 code units');

// 1.2 Number Normalization (-0 -> 0, exponents)
const numObj = { zero: -0, positiveZero: 0, float: 1.5, int: 42 };
const canonicalNum = canonicalizeJson(numObj);
assert(canonicalNum === '{"float":1.5,"int":42,"positiveZero":0,"zero":0}', `JCS number normalization failed: got ${canonicalNum}`);
console.log('  ✓ 1.2 JCS number formatting: -0 normalized to 0');

// 1.3 String Escaping Minimalist Rules
const escapeObj = { str: 'Line 1\nLine 2\t"quoted" \\backslash\\ /slash' };
const canonicalEsc = canonicalizeJson(escapeObj);
assert(canonicalEsc === '{"str":"Line 1\\nLine 2\\t\\"quoted\\" \\\\backslash\\\\ /slash"}', `JCS escaping failed: ${canonicalEsc}`);
console.log('  ✓ 1.3 JCS string escaping: minimal per RFC 8785');

// 1.4 Deterministic SHA-256
const hash1 = computeSha256(canonicalStr);
const hash2 = computeSha256(canonicalStr);
assert(hash1 === hash2 && hash1.length === 64, 'SHA-256 calculation must be deterministic 64-char hex');
console.log(`  ✓ 1.4 SHA-256 deterministic computation verified (${hash1.slice(0, 16)}...)`);

// -----------------------------------------------------------------------------
// 2. EXPORT AND ROUNDTRIP OF STAND 1 SETTINGS
// -----------------------------------------------------------------------------
console.log('\n--- 2. Testing Export & Roundtrip of Stand 1 Settings ---');

// Test all 8 registered settings + P41 in SymmetryCatalog
const settingsToTest = [...REGISTERED_SETTING_IDS, 'P41'];

for (const settingId of settingsToTest) {
  const pack = exportSettingToFSSPack(settingId);
  const serialized = serializeFSSPack(pack);

  // Gatekeeper import check
  const importRes = importFSSPack(serialized);
  assert(importRes.success, `Failed to re-import exported package for ${settingId}: ${importRes.error}`);
  assert(importRes.auditReport.overallPassed, `Gatekeeper rejected valid package for ${settingId}`);
  assert(importRes.settingId === settingId, `Setting ID mismatch on re-import: ${importRes.settingId} vs ${settingId}`);

  // Status check
  if (settingId === 'P41') {
    assert(importRes.catalogStatus === 'EXTENDED_ONLY', `P41 must be EXTENDED_ONLY in Stand 1, got ${importRes.catalogStatus}`);
  } else {
    assert(importRes.catalogStatus === 'DEFAULT_CATALOG', `${settingId} must be DEFAULT_CATALOG, got ${importRes.catalogStatus}`);
  }

  // Exact rational check
  const origRecord = SymmetryCatalog.findBySettingId(settingId)!;
  assert(importRes.record!.operations.length === origRecord.operations.length, `Operations length mismatch for ${settingId}`);

  for (let i = 0; i < origRecord.operations.length; i++) {
    const origW = origRecord.operations[i].W;
    const impW = importRes.record!.operations[i].W;
    assert(JSON.stringify(origW) === JSON.stringify(impW), `Matrix W mismatch for ${settingId} op ${i}`);
  }

  console.log(`  ✓ Export, Gatekeeper validation and re-import verified for ${settingId} (${importRes.catalogStatus})`);
}

// -----------------------------------------------------------------------------
// 3. NEGATIVE AND SECURITY GATEKEEPER TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 3. Testing Gatekeeper Negative Rejections & Security Boundary ---');

// 3.1 Tampered Payload Hash (ERR_PAYLOAD_INTEGRITY_COMPROMISED)
const validP1 = exportSettingToFSSPack('P1');
const tamperedHashPack: FSSPackContainer = JSON.parse(JSON.stringify(validP1));
tamperedHashPack.manifest.payload_sha256 = '0000000000000000000000000000000000000000000000000000000000000000';
const resTamperedHash = importFSSPack(tamperedHashPack);
assert(!resTamperedHash.success, 'Gatekeeper must reject corrupted payload SHA-256');
assert(
  resTamperedHash.auditReport.checks.some(c => c.errorCode === 'ERR_PAYLOAD_INTEGRITY_COMPROMISED'),
  'Expected ERR_PAYLOAD_INTEGRITY_COMPROMISED'
);
console.log('  ✓ 3.1 Rejected corrupted checksum (ERR_PAYLOAD_INTEGRITY_COMPROMISED)');

// 3.2 Tampered Payload Content (Payload altered after hashing)
const tamperedContentPack: FSSPackContainer = JSON.parse(JSON.stringify(validP1));
tamperedContentPack.payload.passport.hermann_mauguin = 'P 1 TAMPERED';
const resTamperedContent = importFSSPack(tamperedContentPack);
assert(!resTamperedContent.success, 'Gatekeeper must reject payload altered after hash computation');
assert(
  resTamperedContent.auditReport.checks.some(c => c.errorCode === 'ERR_PAYLOAD_INTEGRITY_COMPROMISED'),
  'Expected ERR_PAYLOAD_INTEGRITY_COMPROMISED upon content tampering'
);
console.log('  ✓ 3.2 Rejected post-hash payload tampering (ERR_PAYLOAD_INTEGRITY_COMPROMISED)');

// 3.3 Invalid Rotation Matrix - Singular / det=0 (ERR_INVALID_ROTATION_MATRIX)
const invalidMatPack = exportSettingToFSSPack('P-1');
invalidMatPack.payload.passport.operations[1].rotation_matrix = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0]
];
// Recalculate hash so hash check passes and matrix check triggers
invalidMatPack.manifest.payload_sha256 = computeSha256(canonicalizeJson(invalidMatPack.payload));
const resInvalidMat = importFSSPack(invalidMatPack);
assert(!resInvalidMat.success, 'Gatekeeper must reject singular matrix det=0');
assert(
  resInvalidMat.auditReport.checks.some(c => c.errorCode === 'ERR_INVALID_ROTATION_MATRIX'),
  'Expected ERR_INVALID_ROTATION_MATRIX'
);
console.log('  ✓ 3.3 Rejected singular rotation matrix (ERR_INVALID_ROTATION_MATRIX)');

// 3.4 Missing Identity Element (ERR_IDENTITY_ELEMENT_MISSING)
const noIdPack = exportSettingToFSSPack('P-1');
// Replace identity op with another inversion
noIdPack.payload.passport.operations[0].rotation_matrix = [
  [-1, 0, 0],
  [0, -1, 0],
  [0, 0, -1]
];
noIdPack.manifest.payload_sha256 = computeSha256(canonicalizeJson(noIdPack.payload));
const resNoId = importFSSPack(noIdPack);
assert(!resNoId.success, 'Gatekeeper must reject package without identity operation');
assert(
  resNoId.auditReport.checks.some(c => c.errorCode === 'ERR_IDENTITY_ELEMENT_MISSING'),
  'Expected ERR_IDENTITY_ELEMENT_MISSING'
);
console.log('  ✓ 3.4 Rejected package lacking identity element (ERR_IDENTITY_ELEMENT_MISSING)');

// 3.5 Group Closure Failure (ERR_GROUP_CLOSURE_FAILED)
// Take P212121 (order 4) and delete 1 generator so product is not in the set
const brokenClosurePack = exportSettingToFSSPack('P212121');
brokenClosurePack.payload.passport.operations = brokenClosurePack.payload.passport.operations.slice(0, 3);
brokenClosurePack.payload.passport.operations_count = 3;
brokenClosurePack.manifest.payload_sha256 = computeSha256(canonicalizeJson(brokenClosurePack.payload));
const resBrokenClosure = importFSSPack(brokenClosurePack);
assert(!resBrokenClosure.success, 'Gatekeeper must reject non-closed operation set');
assert(
  resBrokenClosure.auditReport.checks.some(c => c.errorCode === 'ERR_GROUP_CLOSURE_FAILED'),
  'Expected ERR_GROUP_CLOSURE_FAILED'
);
console.log('  ✓ 3.5 Rejected non-closed operation set (ERR_GROUP_CLOSURE_FAILED)');

// 3.6 Incompatible Kernel Version (ERR_KERNEL_INCOMPATIBLE)
const kernelPack = exportSettingToFSSPack('P1');
kernelPack.manifest.kernel_version_compatibility = '>=99.0.0';
kernelPack.manifest.payload_sha256 = computeSha256(canonicalizeJson(kernelPack.payload));
const resKernel = importFSSPack(kernelPack);
assert(!resKernel.success, 'Gatekeeper must reject package requiring higher kernel version');
assert(
  resKernel.auditReport.checks.some(c => c.errorCode === 'ERR_KERNEL_INCOMPATIBLE'),
  'Expected ERR_KERNEL_INCOMPATIBLE'
);
console.log('  ✓ 3.6 Rejected incompatible kernel version (ERR_KERNEL_INCOMPATIBLE)');

// 3.7 JSON Schema Violation (Missing required fields)
const invalidSchemaPack = JSON.parse(JSON.stringify(validP1));
delete invalidSchemaPack.payload.passport.hermann_mauguin;
invalidSchemaPack.manifest.payload_sha256 = computeSha256(canonicalizeJson(invalidSchemaPack.payload));
const resSchema = importFSSPack(invalidSchemaPack);
assert(!resSchema.success, 'Gatekeeper must reject missing schema fields');
assert(
  resSchema.auditReport.checks.some(c => c.errorCode === 'ERR_SCHEMA_VIOLATION'),
  'Expected ERR_SCHEMA_VIOLATION'
);
console.log('  ✓ 3.7 Rejected missing required schema fields (ERR_SCHEMA_VIOLATION)');

console.log('\n====================================================');
console.log('ALL FSSPACK & GATEKEEPER TESTS PASSED SUCCESSFULLY (100%)');
console.log('====================================================');
