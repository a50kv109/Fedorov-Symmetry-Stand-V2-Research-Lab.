import { FSSPackContainer } from './types';

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
}

const PACKAGE_ID_REGEX = /^fsspack-[a-z0-9-]+-v[0-9.]+$/;
const KERNEL_COMPAT_REGEX = /^>=[0-9]+\.[0-9]+\.[0-9]+$/;
const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

function isPlainObject(v: any): boolean {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function checkDisallowedKeys(obj: Record<string, any>, allowed: string[], path: string, errors: ValidationIssue[]) {
  for (const k of Object.keys(obj)) {
    if (!allowed.includes(k)) {
      errors.push({ path: `${path}.${k}`, message: `Disallowed property: '${k}'` });
    }
  }
}

/**
 * Validates an unknown object against the FSSPack V1.0 JSON Schema.
 */
export function validateFSSPackSchema(data: any): SchemaValidationResult {
  const errors: ValidationIssue[] = [];

  if (!isPlainObject(data)) {
    return {
      valid: false,
      errors: [{ path: '', message: 'Container must be a JSON object' }]
    };
  }

  checkDisallowedKeys(data, ['format_version', 'manifest', 'payload'], '', errors);

  // 1. format_version
  if (data.format_version !== '1.0.0') {
    errors.push({
      path: 'format_version',
      message: `Invalid format_version: expected '1.0.0', got '${data.format_version}'`
    });
  }

  // 2. manifest
  if (!isPlainObject(data.manifest)) {
    errors.push({ path: 'manifest', message: 'manifest must be an object' });
  } else {
    const m = data.manifest;
    checkDisallowedKeys(
      m,
      ['package_id', 'created_at_utc', 'exported_by_stand', 'kernel_version_compatibility', 'payload_sha256'],
      'manifest',
      errors
    );

    if (typeof m.package_id !== 'string' || !PACKAGE_ID_REGEX.test(m.package_id)) {
      errors.push({
        path: 'manifest.package_id',
        message: `package_id must match regex ${PACKAGE_ID_REGEX}, got '${m.package_id}'`
      });
    }

    if (typeof m.created_at_utc !== 'string' || m.created_at_utc.trim() === '') {
      errors.push({ path: 'manifest.created_at_utc', message: 'created_at_utc must be a non-empty string' });
    }

    if (m.exported_by_stand !== 'STAND-1-REFERENCE' && m.exported_by_stand !== 'STAND-1-ACCEPTANCE-V9') {
      errors.push({
        path: 'manifest.exported_by_stand',
        message: `exported_by_stand must be 'STAND-1-REFERENCE' or 'STAND-1-ACCEPTANCE-V9', got '${m.exported_by_stand}'`
      });
    }

    if (typeof m.kernel_version_compatibility !== 'string' || !KERNEL_COMPAT_REGEX.test(m.kernel_version_compatibility)) {
      errors.push({
        path: 'manifest.kernel_version_compatibility',
        message: `kernel_version_compatibility must match regex ${KERNEL_COMPAT_REGEX}, got '${m.kernel_version_compatibility}'`
      });
    }

    if (typeof m.payload_sha256 !== 'string' || !SHA256_HEX_REGEX.test(m.payload_sha256)) {
      errors.push({
        path: 'manifest.payload_sha256',
        message: `payload_sha256 must be a 64-character lowercase hexadecimal string`
      });
    }
  }

  // 3. payload
  if (!isPlainObject(data.payload)) {
    errors.push({ path: 'payload', message: 'payload must be an object' });
  } else {
    const p = data.payload;
    checkDisallowedKeys(p, ['passport', 'mathematical_properties', 'sender_attestation'], 'payload', errors);

    // 3A. Passport
    if (!isPlainObject(p.passport)) {
      errors.push({ path: 'payload.passport', message: 'passport must be an object' });
    } else {
      const pass = p.passport;
      checkDisallowedKeys(
        pass,
        [
          'setting_id',
          'space_group_number',
          'hermann_mauguin',
          'hall_symbol',
          'crystal_system',
          'point_group',
          'laue_class',
          'is_centrosymmetric',
          'is_enantiomorphic',
          'operations_count',
          'operations'
        ],
        'payload.passport',
        errors
      );

      if (typeof pass.setting_id !== 'string' || pass.setting_id.trim() === '') {
        errors.push({ path: 'payload.passport.setting_id', message: 'setting_id must be a non-empty string' });
      }

      if (
        typeof pass.space_group_number !== 'number' ||
        !Number.isSafeInteger(pass.space_group_number) ||
        pass.space_group_number < 1 ||
        pass.space_group_number > 230
      ) {
        errors.push({
          path: 'payload.passport.space_group_number',
          message: 'space_group_number must be an integer between 1 and 230'
        });
      }

      if (typeof pass.hermann_mauguin !== 'string' || pass.hermann_mauguin.trim() === '') {
        errors.push({ path: 'payload.passport.hermann_mauguin', message: 'hermann_mauguin must be a non-empty string' });
      }

      if (typeof pass.hall_symbol !== 'string' || pass.hall_symbol.trim() === '') {
        errors.push({ path: 'payload.passport.hall_symbol', message: 'hall_symbol must be a non-empty string' });
      }

      if (typeof pass.crystal_system !== 'string' || pass.crystal_system.trim() === '') {
        errors.push({ path: 'payload.passport.crystal_system', message: 'crystal_system must be a non-empty string' });
      }

      if (typeof pass.point_group !== 'string' || pass.point_group.trim() === '') {
        errors.push({ path: 'payload.passport.point_group', message: 'point_group must be a non-empty string' });
      }

      if (typeof pass.laue_class !== 'string' || pass.laue_class.trim() === '') {
        errors.push({ path: 'payload.passport.laue_class', message: 'laue_class must be a non-empty string' });
      }

      if (typeof pass.is_centrosymmetric !== 'boolean') {
        errors.push({ path: 'payload.passport.is_centrosymmetric', message: 'is_centrosymmetric must be boolean' });
      }

      if (typeof pass.is_enantiomorphic !== 'boolean') {
        errors.push({ path: 'payload.passport.is_enantiomorphic', message: 'is_enantiomorphic must be boolean' });
      }

      if (typeof pass.operations_count !== 'number' || pass.operations_count < 1) {
        errors.push({ path: 'payload.passport.operations_count', message: 'operations_count must be an integer >= 1' });
      }

      if (!Array.isArray(pass.operations)) {
        errors.push({ path: 'payload.passport.operations', message: 'operations must be an array' });
      } else {
        if (pass.operations.length !== pass.operations_count) {
          errors.push({
            path: 'payload.passport.operations',
            message: `operations array length (${pass.operations.length}) does not match operations_count (${pass.operations_count})`
          });
        }

        pass.operations.forEach((op: any, i: number) => {
          const opPath = `payload.passport.operations[${i}]`;
          if (!isPlainObject(op)) {
            errors.push({ path: opPath, message: 'Operation must be an object' });
            return;
          }
          checkDisallowedKeys(op, ['index', 'rotation_matrix', 'translation_vector', 'jones_faithful', 'seitz_symbol'], opPath, errors);

          if (typeof op.index !== 'number' || op.index < 0) {
            errors.push({ path: `${opPath}.index`, message: 'index must be a non-negative integer' });
          }

          // rotation_matrix (3x3 array of safe integers in [-1, 1])
          if (!Array.isArray(op.rotation_matrix) || op.rotation_matrix.length !== 3) {
            errors.push({ path: `${opPath}.rotation_matrix`, message: 'rotation_matrix must be a 3x3 array' });
          } else {
            for (let r = 0; r < 3; r++) {
              const row = op.rotation_matrix[r];
              if (!Array.isArray(row) || row.length !== 3) {
                errors.push({ path: `${opPath}.rotation_matrix[${r}]`, message: 'row must contain 3 elements' });
              } else {
                for (let c = 0; c < 3; c++) {
                  const val = row[c];
                  if (!Number.isSafeInteger(val) || val < -1 || val > 1) {
                    errors.push({
                      path: `${opPath}.rotation_matrix[${r}][${c}]`,
                      message: `Matrix entry must be an integer in [-1, 1], got ${val}`
                    });
                  }
                }
              }
            }
          }

          // translation_vector (3 fractions {n, d})
          if (!Array.isArray(op.translation_vector) || op.translation_vector.length !== 3) {
            errors.push({ path: `${opPath}.translation_vector`, message: 'translation_vector must have 3 components' });
          } else {
            for (let c = 0; c < 3; c++) {
              const comp = op.translation_vector[c];
              const compPath = `${opPath}.translation_vector[${c}]`;
              if (!isPlainObject(comp)) {
                errors.push({ path: compPath, message: 'translation component must be an object { n, d }' });
              } else {
                checkDisallowedKeys(comp, ['n', 'd'], compPath, errors);
                if (!Number.isSafeInteger(comp.n)) {
                  errors.push({ path: `${compPath}.n`, message: 'numerator n must be a safe integer' });
                }
                if (!Number.isSafeInteger(comp.d) || comp.d <= 0) {
                  errors.push({ path: `${compPath}.d`, message: 'denominator d must be a positive non-zero integer' });
                }
              }
            }
          }

          if (typeof op.jones_faithful !== 'string' || op.jones_faithful.trim() === '') {
            errors.push({ path: `${opPath}.jones_faithful`, message: 'jones_faithful must be a non-empty string' });
          }
          if (op.seitz_symbol !== undefined && typeof op.seitz_symbol !== 'string') {
            errors.push({ path: `${opPath}.seitz_symbol`, message: 'seitz_symbol must be a string' });
          }
        });
      }
    }

    // 3B. Mathematical Properties
    if (!isPlainObject(p.mathematical_properties)) {
      errors.push({ path: 'payload.mathematical_properties', message: 'mathematical_properties must be an object' });
    } else {
      const mp = p.mathematical_properties;
      checkDisallowedKeys(
        mp,
        ['algebraic_group_order', 'screw_axes', 'glide_planes', 'center_of_inversion_present'],
        'payload.mathematical_properties',
        errors
      );

      if (typeof mp.algebraic_group_order !== 'number' || mp.algebraic_group_order < 1) {
        errors.push({
          path: 'payload.mathematical_properties.algebraic_group_order',
          message: 'algebraic_group_order must be integer >= 1'
        });
      }

      if (!Array.isArray(mp.screw_axes)) {
        errors.push({ path: 'payload.mathematical_properties.screw_axes', message: 'screw_axes must be an array' });
      } else {
        mp.screw_axes.forEach((sa: any, idx: number) => {
          const saPath = `payload.mathematical_properties.screw_axes[${idx}]`;
          if (!isPlainObject(sa)) {
            errors.push({ path: saPath, message: 'screw_axis descriptor must be an object' });
            return;
          }
          checkDisallowedKeys(sa, ['order', 'axis_direction', 'fractional_pitch'], saPath, errors);
          if (![2, 3, 4, 6].includes(sa.order)) {
            errors.push({ path: `${saPath}.order`, message: 'screw order must be 2, 3, 4, or 6' });
          }
          if (!Array.isArray(sa.axis_direction) || sa.axis_direction.length !== 3) {
            errors.push({ path: `${saPath}.axis_direction`, message: 'axis_direction must be 3 integers' });
          }
          if (!isPlainObject(sa.fractional_pitch)) {
            errors.push({ path: `${saPath}.fractional_pitch`, message: 'fractional_pitch must be { n, d }' });
          } else {
            checkDisallowedKeys(sa.fractional_pitch, ['n', 'd'], `${saPath}.fractional_pitch`, errors);
            if (!Number.isSafeInteger(sa.fractional_pitch.n)) {
              errors.push({ path: `${saPath}.fractional_pitch.n`, message: 'n must be integer' });
            }
            if (!Number.isSafeInteger(sa.fractional_pitch.d) || sa.fractional_pitch.d <= 0) {
              errors.push({ path: `${saPath}.fractional_pitch.d`, message: 'd must be positive integer' });
            }
          }
        });
      }

      if (!Array.isArray(mp.glide_planes)) {
        errors.push({ path: 'payload.mathematical_properties.glide_planes', message: 'glide_planes must be an array' });
      }

      if (typeof mp.center_of_inversion_present !== 'boolean') {
        errors.push({
          path: 'payload.mathematical_properties.center_of_inversion_present',
          message: 'center_of_inversion_present must be boolean'
        });
      }
    }

    // 3C. Sender Attestation
    if (!isPlainObject(p.sender_attestation)) {
      errors.push({ path: 'payload.sender_attestation', message: 'sender_attestation must be an object' });
    } else {
      const sa = p.sender_attestation;
      checkDisallowedKeys(
        sa,
        [
          'tested_on_stand',
          'math_engine_version',
          'closure_test_passed',
          'identity_element_verified',
          'inverse_elements_verified',
          'provenance_source',
          'provenance_reference_hash'
        ],
        'payload.sender_attestation',
        errors
      );

      if (typeof sa.tested_on_stand !== 'string' || sa.tested_on_stand.trim() === '') {
        errors.push({ path: 'payload.sender_attestation.tested_on_stand', message: 'tested_on_stand must be a non-empty string' });
      }
      if (typeof sa.math_engine_version !== 'string' || sa.math_engine_version.trim() === '') {
        errors.push({ path: 'payload.sender_attestation.math_engine_version', message: 'math_engine_version must be a non-empty string' });
      }
      if (typeof sa.closure_test_passed !== 'boolean') {
        errors.push({ path: 'payload.sender_attestation.closure_test_passed', message: 'closure_test_passed must be boolean' });
      }
      if (typeof sa.identity_element_verified !== 'boolean') {
        errors.push({ path: 'payload.sender_attestation.identity_element_verified', message: 'identity_element_verified must be boolean' });
      }
      if (typeof sa.inverse_elements_verified !== 'boolean') {
        errors.push({ path: 'payload.sender_attestation.inverse_elements_verified', message: 'inverse_elements_verified must be boolean' });
      }
      if (typeof sa.provenance_source !== 'string' || sa.provenance_source.trim() === '') {
        errors.push({ path: 'payload.sender_attestation.provenance_source', message: 'provenance_source must be a non-empty string' });
      }
      if (typeof sa.provenance_reference_hash !== 'string' || sa.provenance_reference_hash.trim() === '') {
        errors.push({ path: 'payload.sender_attestation.provenance_reference_hash', message: 'provenance_reference_hash must be a non-empty string' });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
