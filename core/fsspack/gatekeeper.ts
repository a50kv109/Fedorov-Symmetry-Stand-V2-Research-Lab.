import {
  FSSPackContainer,
  GatekeeperAuditReport,
  GatekeeperCheckResult,
  GatekeeperErrorCode,
  FSSPackAffineOperation
} from './types';
import { validateFSSPackSchema } from './schema_validator';
import { canonicalizeJson, computeSha256 } from './canonical_json';
import { ExactRational } from '../schema/crystallographic_exchange';

export const CURRENT_KERNEL_VERSION = '2.0.0';

export interface GatekeeperOptions {
  existingSettingIds?: Set<string>;
  disallowIdConflict?: boolean;
}

// Matrix 3x3 determinant using BigInt for exact computation
function det3x3(W: number[][]): number {
  const a = BigInt(W[0][0]), b = BigInt(W[0][1]), c = BigInt(W[0][2]);
  const d = BigInt(W[1][0]), e = BigInt(W[1][1]), f = BigInt(W[1][2]);
  const g = BigInt(W[2][0]), h = BigInt(W[2][1]), i = BigInt(W[2][2]);
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return Number(det);
}

// Matrix multiplication 3x3
function mul3x3(A: number[][], B: number[][]): number[][] {
  const C: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0n;
      for (let k = 0; k < 3; k++) {
        sum += BigInt(A[i][k]) * BigInt(B[k][j]);
      }
      C[i][j] = Number(sum);
    }
  }
  return C;
}

// Check W^T * W == I_3
function isOrthogonal3x3(W: number[][]): boolean {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let dot = 0;
      for (let k = 0; k < 3; k++) {
        dot += W[k][i] * W[k][j]; // W^T[i][k] * W[k][j]
      }
      const expected = i === j ? 1 : 0;
      if (dot !== expected) {
        return false;
      }
    }
  }
  return true;
}

export interface CanonicalOpInternal {
  index: number;
  W: number[][];
  w: [ExactRational, ExactRational, ExactRational];
  key: string;
}

function toInternalOp(op: FSSPackAffineOperation): CanonicalOpInternal {
  const W = op.rotation_matrix.map(row => [...row]);
  const w: [ExactRational, ExactRational, ExactRational] = [
    new ExactRational(op.translation_vector[0].n, op.translation_vector[0].d).mod1(),
    new ExactRational(op.translation_vector[1].n, op.translation_vector[1].d).mod1(),
    new ExactRational(op.translation_vector[2].n, op.translation_vector[2].d).mod1()
  ];
  const key = `${JSON.stringify(W)}|${w.map(r => r.toString()).join(',')}`;
  return { index: op.index, W, w, key };
}

function composeOps(
  op1: CanonicalOpInternal,
  op2: CanonicalOpInternal
): { W: number[][]; w: [ExactRational, ExactRational, ExactRational]; key: string } {
  // (W1, w1) o (W2, w2) = (W1 * W2, W1 * w2 + w1 mod 1)
  const W = mul3x3(op1.W, op2.W);
  const w: [ExactRational, ExactRational, ExactRational] = [
    new ExactRational(0, 1),
    new ExactRational(0, 1),
    new ExactRational(0, 1)
  ];
  for (let i = 0; i < 3; i++) {
    let linTerm = new ExactRational(0, 1);
    for (let k = 0; k < 3; k++) {
      linTerm = linTerm.add(new ExactRational(op1.W[i][k], 1).mul(op2.w[k]));
    }
    w[i] = op1.w[i].add(linTerm).mod1();
  }
  const key = `${JSON.stringify(W)}|${w.map(r => r.toString()).join(',')}`;
  return { W, w, key };
}

function isIdentityOp(op: CanonicalOpInternal): boolean {
  const isIdMat =
    op.W[0][0] === 1 && op.W[0][1] === 0 && op.W[0][2] === 0 &&
    op.W[1][0] === 0 && op.W[1][1] === 1 && op.W[1][2] === 0 &&
    op.W[2][0] === 0 && op.W[2][1] === 0 && op.W[2][2] === 1;
  const isZeroTrans = op.w.every(r => r.n === 0);
  return isIdMat && isZeroTrans;
}

/**
 * Gatekeeper independent audit function.
 * Evaluates GK-01 through GK-09 checks deterministically with zero trust.
 */
export function auditFSSPack(
  container: any,
  options: GatekeeperOptions = {}
): GatekeeperAuditReport {
  const checks: GatekeeperCheckResult[] = [];
  const errors: Array<{ code: GatekeeperErrorCode; message: string }> = [];

  // GK-01: JSON Schema & Syntax Validation
  const schemaRes = validateFSSPackSchema(container);
  if (!schemaRes.valid) {
    const detail = schemaRes.errors.map(e => `${e.path}: ${e.message}`).join('; ');
    checks.push({
      checkId: 'GK-01',
      description: 'JSON Schema & Syntax Validation',
      passed: false,
      errorCode: 'ERR_SCHEMA_VIOLATION',
      details: detail
    });
    errors.push({ code: 'ERR_SCHEMA_VIOLATION', message: `Schema violation: ${detail}` });
    return { overallPassed: false, checks, errors };
  }

  checks.push({
    checkId: 'GK-01',
    description: 'JSON Schema & Syntax Validation',
    passed: true
  });

  const pack = container as FSSPackContainer;

  // GK-02: Kernel Version Compatibility
  const requiredKernelStr = pack.manifest.kernel_version_compatibility; // e.g. ">=2.0.0"
  const minKernel = requiredKernelStr.replace(/^>=/, '').trim();
  const [minMajor, minMinor] = minKernel.split('.').map(Number);
  const [currMajor, currMinor] = CURRENT_KERNEL_VERSION.split('.').map(Number);

  const isKernelCompat =
    currMajor > minMajor || (currMajor === minMajor && currMinor >= minMinor);

  if (!isKernelCompat) {
    checks.push({
      checkId: 'GK-02',
      description: 'Kernel Version Compatibility',
      passed: false,
      errorCode: 'ERR_KERNEL_INCOMPATIBLE',
      details: `Requires kernel ${requiredKernelStr}, current kernel is ${CURRENT_KERNEL_VERSION}`
    });
    errors.push({
      code: 'ERR_KERNEL_INCOMPATIBLE',
      message: `Kernel mismatch: requires ${requiredKernelStr}, running ${CURRENT_KERNEL_VERSION}`
    });
  } else {
    checks.push({
      checkId: 'GK-02',
      description: 'Kernel Version Compatibility',
      passed: true
    });
  }

  // GK-03: JCS Payload SHA-256 Integrity Verification
  let computedPayloadSha256 = '';
  try {
    const canonicalPayload = canonicalizeJson(pack.payload);
    computedPayloadSha256 = computeSha256(canonicalPayload);

    if (computedPayloadSha256 !== pack.manifest.payload_sha256) {
      checks.push({
        checkId: 'GK-03',
        description: 'JCS Payload SHA-256 Integrity Verification',
        passed: false,
        errorCode: 'ERR_PAYLOAD_INTEGRITY_COMPROMISED',
        details: `Checksum mismatch: expected ${pack.manifest.payload_sha256}, computed ${computedPayloadSha256}`
      });
      errors.push({
        code: 'ERR_PAYLOAD_INTEGRITY_COMPROMISED',
        message: `Payload hash mismatch: manifest=${pack.manifest.payload_sha256}, computed=${computedPayloadSha256}`
      });
    } else {
      checks.push({
        checkId: 'GK-03',
        description: 'JCS Payload SHA-256 Integrity Verification',
        passed: true,
        details: `Matches payload SHA-256: ${computedPayloadSha256}`
      });
    }
  } catch (err: any) {
    checks.push({
      checkId: 'GK-03',
      description: 'JCS Payload SHA-256 Integrity Verification',
      passed: false,
      errorCode: 'ERR_PAYLOAD_INTEGRITY_COMPROMISED',
      details: `JCS error: ${err?.message}`
    });
    errors.push({
      code: 'ERR_PAYLOAD_INTEGRITY_COMPROMISED',
      message: `Failed JCS canonicalization: ${err?.message}`
    });
  }

  // Convert operations to exact rational internal representation
  const ops = pack.payload.passport.operations;
  const internalOps: CanonicalOpInternal[] = [];
  let matrixError: string | null = null;

  // GK-04: Orthogonality & Unimodularity Check
  for (let idx = 0; idx < ops.length; idx++) {
    const op = ops[idx];
    const W = op.rotation_matrix;
    const det = det3x3(W);

    if (det !== 1 && det !== -1) {
      matrixError = `Operation ${idx} has invalid determinant det(W) = ${det}. Must be +1 or -1.`;
      break;
    }

    if (!isOrthogonal3x3(W)) {
      matrixError = `Operation ${idx} rotation matrix is not orthogonal (W^T * W != I_3).`;
      break;
    }

    try {
      internalOps.push(toInternalOp(op));
    } catch (e: any) {
      matrixError = `Operation ${idx} has invalid translation rational: ${e?.message}`;
      break;
    }
  }

  if (matrixError) {
    checks.push({
      checkId: 'GK-04',
      description: 'Orthogonality & Unimodularity of Matrices',
      passed: false,
      errorCode: 'ERR_INVALID_ROTATION_MATRIX',
      details: matrixError
    });
    errors.push({ code: 'ERR_INVALID_ROTATION_MATRIX', message: matrixError });
  } else {
    checks.push({
      checkId: 'GK-04',
      description: 'Orthogonality & Unimodularity of Matrices',
      passed: true
    });
  }

  // GK-05: Identity Element Existence
  let hasIdentity = false;
  let identityCount = 0;
  for (const op of internalOps) {
    if (isIdentityOp(op)) {
      hasIdentity = true;
      identityCount++;
    }
  }

  if (!hasIdentity || identityCount !== 1) {
    const msg = !hasIdentity
      ? 'Identity operation (W = I_3, w = 0 mod 1) is missing'
      : `Multiple identity operations detected (${identityCount})`;
    checks.push({
      checkId: 'GK-05',
      description: 'Identity Element Existence',
      passed: false,
      errorCode: 'ERR_IDENTITY_ELEMENT_MISSING',
      details: msg
    });
    errors.push({ code: 'ERR_IDENTITY_ELEMENT_MISSING', message: msg });
  } else {
    checks.push({
      checkId: 'GK-05',
      description: 'Identity Element Existence',
      passed: true
    });
  }

  // GK-06 & GK-07: Group Closure & Inverses
  const opKeySet = new Set(internalOps.map(o => o.key));
  let isClosed = true;
  let closureError: string | null = null;
  let hasInverses = true;
  let inverseError: string | null = null;

  if (internalOps.length > 0 && !matrixError) {
    for (let i = 0; i < internalOps.length; i++) {
      const op1 = internalOps[i];
      let foundInverse = false;

      for (let j = 0; j < internalOps.length; j++) {
        const op2 = internalOps[j];
        const comp = composeOps(op1, op2);

        if (!opKeySet.has(comp.key)) {
          isClosed = false;
          if (!closureError) {
            closureError = `Closure failure: op[${op1.index}] * op[${op2.index}] = key ${comp.key} is not in group set`;
          }
        }

        // Check if op2 is two-sided inverse of op1
        if (isIdentityOp(comp as any)) {
          const compBack = composeOps(op2, op1);
          if (isIdentityOp(compBack as any)) {
            foundInverse = true;
          }
        }
      }

      if (!foundInverse && hasInverses) {
        hasInverses = false;
        inverseError = `Operation index ${op1.index} lacks a two-sided inverse element in group`;
      }
    }
  }

  // GK-06 check record
  if (!isClosed) {
    checks.push({
      checkId: 'GK-06',
      description: 'Group Closure under Affine Composition Modulo 1',
      passed: false,
      errorCode: 'ERR_GROUP_CLOSURE_FAILED',
      details: closureError || 'Group closure failed'
    });
    errors.push({
      code: 'ERR_GROUP_CLOSURE_FAILED',
      message: closureError || 'Group closure failed'
    });
  } else {
    checks.push({
      checkId: 'GK-06',
      description: 'Group Closure under Affine Composition Modulo 1',
      passed: true
    });
  }

  // GK-07 check record
  if (!hasInverses) {
    checks.push({
      checkId: 'GK-07',
      description: 'Inverse Elements Existence',
      passed: false,
      errorCode: 'ERR_INVERSE_ELEMENT_MISSING',
      details: inverseError || 'Missing inverse elements'
    });
    errors.push({
      code: 'ERR_INVERSE_ELEMENT_MISSING',
      message: inverseError || 'Missing inverse elements'
    });
  } else {
    checks.push({
      checkId: 'GK-07',
      description: 'Inverse Elements Existence',
      passed: true
    });
  }

  // GK-08: Chirality & Screw Vector Guard
  let chiralityOk = true;
  let chiralityError: string | null = null;
  const sgNum = pack.payload.passport.space_group_number;

  // SG 76: P41
  if (sgNum === 76) {
    // Rotation generator C4+ about [0,0,1] is W = [[0, -1, 0], [1, 0, 0], [0, 0, 1]]
    // For P41, translation must be [0, 0, 1/4] mod 1
    // For P43 (SG 78), it would be [0, 0, 3/4] mod 1
    const c4p = internalOps.find(
      op =>
        op.W[0][0] === 0 && op.W[0][1] === -1 && op.W[0][2] === 0 &&
        op.W[1][0] === 1 && op.W[1][1] === 0 && op.W[1][2] === 0 &&
        op.W[2][0] === 0 && op.W[2][1] === 0 && op.W[2][2] === 1
    );

    if (!c4p) {
      chiralityOk = false;
      chiralityError = 'SG 76 (P41) must contain a counter-clockwise 4-fold rotation matrix along z';
    } else {
      const wz = c4p.w[2];
      // Expect 1/4
      if (wz.n !== 1 || wz.d !== 4) {
        chiralityOk = false;
        chiralityError = `SG 76 (P41) screw axis translation along z must be 1/4, found ${wz.toString()}`;
      }
    }
  } else if (sgNum === 78) {
    // SG 78: P43
    const c4p = internalOps.find(
      op =>
        op.W[0][0] === 0 && op.W[0][1] === -1 && op.W[0][2] === 0 &&
        op.W[1][0] === 1 && op.W[1][1] === 0 && op.W[1][2] === 0 &&
        op.W[2][0] === 0 && op.W[2][1] === 0 && op.W[2][2] === 1
    );

    if (!c4p) {
      chiralityOk = false;
      chiralityError = 'SG 78 (P43) must contain a counter-clockwise 4-fold rotation matrix along z';
    } else {
      const wz = c4p.w[2];
      // Expect 3/4
      if (wz.n !== 3 || wz.d !== 4) {
        chiralityOk = false;
        chiralityError = `SG 78 (P43) screw axis translation along z must be 3/4, found ${wz.toString()}`;
      }
    }
  }

  if (!chiralityOk) {
    checks.push({
      checkId: 'GK-08',
      description: 'Chirality & Screw Vector Guard',
      passed: false,
      errorCode: 'ERR_CHIRALITY_MISMATCH',
      details: chiralityError || 'Chirality check failed'
    });
    errors.push({
      code: 'ERR_CHIRALITY_MISMATCH',
      message: chiralityError || 'Chirality check failed'
    });
  } else {
    checks.push({
      checkId: 'GK-08',
      description: 'Chirality & Screw Vector Guard',
      passed: true
    });
  }

  // GK-09: Workspace Conflict Check
  if (options.disallowIdConflict && options.existingSettingIds) {
    const settingId = pack.payload.passport.setting_id;
    if (options.existingSettingIds.has(settingId)) {
      checks.push({
        checkId: 'GK-09',
        description: 'Workspace ID Conflict Check',
        passed: false,
        errorCode: 'ERR_WORKSPACE_ID_CONFLICT',
        details: `Setting ID '${settingId}' already exists in workspace vault`
      });
      errors.push({
        code: 'ERR_WORKSPACE_ID_CONFLICT',
        message: `Setting ID '${settingId}' already exists in workspace vault`
      });
    } else {
      checks.push({
        checkId: 'GK-09',
        description: 'Workspace ID Conflict Check',
        passed: true
      });
    }
  } else {
    checks.push({
      checkId: 'GK-09',
      description: 'Workspace ID Conflict Check',
      passed: true,
      details: 'Check omitted or no conflict found'
    });
  }

  // Check inversion center presence
  const hasInversion = internalOps.some(
    op =>
      op.W[0][0] === -1 && op.W[0][1] === 0 && op.W[0][2] === 0 &&
      op.W[1][0] === 0 && op.W[1][1] === -1 && op.W[1][2] === 0 &&
      op.W[2][0] === 0 && op.W[2][1] === 0 && op.W[2][2] === -1
  );

  const overallPassed = checks.every(c => c.passed);

  return {
    overallPassed,
    checks,
    errors,
    verifiedProperties: {
      algebraicOrder: internalOps.length,
      hasIdentity,
      hasInverses,
      isClosed,
      isCentrosymmetric: hasInversion,
      isEnantiomorphic: pack.payload.passport.is_enantiomorphic,
      computedPayloadSha256
    }
  };
}
