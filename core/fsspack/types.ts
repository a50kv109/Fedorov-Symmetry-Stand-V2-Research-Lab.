/**
 * FSSPack V1.0 Types and Interfaces
 * 
 * Normative data types for the Fedorov Symmetry Stand exchange format (.fsspack).
 */

export interface RationalFraction {
  /** Numerator: integer */
  n: number;
  /** Denominator: positive non-zero integer */
  d: number;
}

export interface FSSPackAffineOperation {
  /** 0-indexed sequence position */
  index: number;
  /** 3x3 integer rotation/inversion matrix with det(W) in {+1, -1} */
  rotation_matrix: number[][];
  /** 3D exact rational translation vector [w_x, w_y, w_z] */
  translation_vector: [RationalFraction, RationalFraction, RationalFraction];
  /** Jones-Faithful string representation, e.g. "-y,x,z+1/4" */
  jones_faithful: string;
  /** Seitz notation symbol, e.g. "4+[0,0,1/4]" */
  seitz_symbol?: string;
}

export interface ScrewAxisDescriptor {
  /** Screw order (2, 3, 4, 6) */
  order: 2 | 3 | 4 | 6;
  /** Normalized Miller direction vector, e.g. [0, 0, 1] */
  axis_direction: [number, number, number];
  /** Fractional translation pitch along axis, e.g. { n: 1, d: 4 } */
  fractional_pitch: RationalFraction;
}

export interface FSSPackPassport {
  setting_id: string;
  space_group_number: number;
  hermann_mauguin: string;
  hall_symbol: string;
  crystal_system: string;
  point_group: string;
  laue_class: string;
  is_centrosymmetric: boolean;
  is_enantiomorphic: boolean;
  operations_count: number;
  operations: FSSPackAffineOperation[];
}

export interface FSSPackMathProperties {
  algebraic_group_order: number;
  screw_axes: ScrewAxisDescriptor[];
  glide_planes: string[];
  center_of_inversion_present: boolean;
}

export interface FSSPackSenderAttestation {
  tested_on_stand: string;
  math_engine_version: string;
  closure_test_passed: boolean;
  identity_element_verified: boolean;
  inverse_elements_verified: boolean;
  provenance_source: string;
  provenance_reference_hash: string;
}

export interface FSSPackPayload {
  passport: FSSPackPassport;
  mathematical_properties: FSSPackMathProperties;
  sender_attestation: FSSPackSenderAttestation;
}

export interface FSSPackManifest {
  package_id: string;
  created_at_utc: string;
  exported_by_stand: 'STAND-1-REFERENCE' | 'STAND-1-ACCEPTANCE-V9';
  kernel_version_compatibility: string;
  payload_sha256: string;
}

export interface FSSPackContainer {
  format_version: '1.0.0';
  manifest: FSSPackManifest;
  payload: FSSPackPayload;
}

/**
 * Status of space group record availability to classifiers.
 * These reflect accessibility, not mathematical correctness.
 */
export type CatalogAvailabilityStatus =
  | 'DEFAULT_CATALOG'   // Active in Stand 1 standard catalog (8 baseline settings)
  | 'EXTENDED_ONLY'     // Registered in reference registry, but not in standard catalog (e.g. P41 in Stand 1)
  | 'NOT_IN_CATALOG';   // External or isolated record not present in Stand 1 registry

/**
 * Gatekeeper Verification Error Codes
 */
export type GatekeeperErrorCode =
  | 'ERR_PARSE_FAILURE'
  | 'ERR_SCHEMA_VIOLATION'
  | 'ERR_KERNEL_INCOMPATIBLE'
  | 'ERR_PAYLOAD_INTEGRITY_COMPROMISED'
  | 'ERR_INVALID_ROTATION_MATRIX'
  | 'ERR_IDENTITY_ELEMENT_MISSING'
  | 'ERR_GROUP_CLOSURE_FAILED'
  | 'ERR_INVERSE_ELEMENT_MISSING'
  | 'ERR_CHIRALITY_MISMATCH'
  | 'ERR_WORKSPACE_ID_CONFLICT';

export interface GatekeeperCheckResult {
  checkId: string;
  description: string;
  passed: boolean;
  errorCode?: GatekeeperErrorCode;
  details?: string;
}

export interface GatekeeperAuditReport {
  overallPassed: boolean;
  checks: GatekeeperCheckResult[];
  errors: Array<{ code: GatekeeperErrorCode; message: string }>;
  verifiedProperties?: {
    algebraicOrder: number;
    hasIdentity: boolean;
    hasInverses: boolean;
    isClosed: boolean;
    isCentrosymmetric: boolean;
    isEnantiomorphic: boolean;
    computedPayloadSha256: string;
  };
}
