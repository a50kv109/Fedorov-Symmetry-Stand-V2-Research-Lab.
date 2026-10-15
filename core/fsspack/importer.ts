import { DetailedSymmetryRecord, SymmetryCatalog } from '../registry';
import { REGISTERED_SETTING_IDS } from '../operation_set_match';
import {
  FSSPackContainer,
  GatekeeperAuditReport,
  CatalogAvailabilityStatus
} from './types';
import { auditFSSPack, GatekeeperOptions } from './gatekeeper';

export interface ImportOptions extends GatekeeperOptions {
  allowExtendedOnly?: boolean;
}

export interface FSSPackImportResult {
  success: boolean;
  settingId?: string;
  spaceGroupNumber?: number;
  catalogStatus?: CatalogAvailabilityStatus;
  record?: DetailedSymmetryRecord;
  container?: FSSPackContainer;
  auditReport: GatekeeperAuditReport;
  error?: string;
}

/**
 * Determines classifier availability status in Stand 1.
 * This indicates accessibility to the classifier, not mathematical validity.
 */
export function determineCatalogStatus(settingId: string): CatalogAvailabilityStatus {
  if ((REGISTERED_SETTING_IDS as readonly string[]).includes(settingId)) {
    return 'DEFAULT_CATALOG';
  }
  if (SymmetryCatalog.findBySettingId(settingId)) {
    return 'EXTENDED_ONLY';
  }
  return 'NOT_IN_CATALOG';
}

/**
 * Safely imports an .fsspack string or object through Gatekeeper verification.
 * Does NOT mutate Stand 1 catalog or registry!
 */
export function importFSSPack(
  input: string | unknown,
  options: ImportOptions = {}
): FSSPackImportResult {
  let container: any;

  if (typeof input === 'string') {
    try {
      container = JSON.parse(input);
    } catch (err: any) {
      const auditReport: GatekeeperAuditReport = {
        overallPassed: false,
        checks: [
          {
            checkId: 'GK-00',
            description: 'JSON Syntax Parsing',
            passed: false,
            errorCode: 'ERR_PARSE_FAILURE',
            details: err?.message || 'Invalid JSON syntax'
          }
        ],
        errors: [{ code: 'ERR_PARSE_FAILURE', message: `JSON parse error: ${err?.message}` }]
      };
      return {
        success: false,
        auditReport,
        error: `JSON parse error: ${err?.message}`
      };
    }
  } else {
    container = input;
  }

  // Run Gatekeeper audit
  const auditReport = auditFSSPack(container, options);

  if (!auditReport.overallPassed) {
    const primaryError = auditReport.errors[0]?.message || 'Gatekeeper verification failed';
    return {
      success: false,
      auditReport,
      error: primaryError
    };
  }

  const pack = container as FSSPackContainer;
  const pass = pack.payload.passport;
  const att = pack.payload.sender_attestation;

  // Convert to FSS DetailedSymmetryRecord
  const record: DetailedSymmetryRecord = {
    groupNumber: pass.space_group_number,
    settingId: pass.setting_id,
    hmSymbol: pass.hermann_mauguin,
    hallSymbol: pass.hall_symbol,
    provenance: att.provenance_source,
    provenanceDetails: {
      source: att.provenance_source,
      commitOrVersion: att.provenance_reference_hash,
      tablePath: `fsspack:${pack.manifest.package_id}`,
      license: 'MPL-2.0',
      attribution: 'International Tables for Crystallography (ITA)',
      normalizationMethod: 'FSSPack V1.0 exact rational deserialization'
    },
    operations: pass.operations.map(op => ({
      W: op.rotation_matrix.map(row => [...row]),
      w: [
        { numerator: op.translation_vector[0].n, denominator: op.translation_vector[0].d },
        { numerator: op.translation_vector[1].n, denominator: op.translation_vector[1].d },
        { numerator: op.translation_vector[2].n, denominator: op.translation_vector[2].d }
      ]
    }))
  };

  const catalogStatus = determineCatalogStatus(pass.setting_id);

  return {
    success: true,
    settingId: pass.setting_id,
    spaceGroupNumber: pass.space_group_number,
    catalogStatus,
    record,
    container: pack,
    auditReport
  };
}
