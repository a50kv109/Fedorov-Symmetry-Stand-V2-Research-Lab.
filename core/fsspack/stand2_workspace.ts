import { DetailedSymmetryRecord } from '../registry';
import {
  classifyOperationSet,
  getDefaultCatalog,
  TwoStageMatchReport
} from '../operation_set_match';
import { InputSymmetryOperation } from '../operation_set_profile';
import {
  FSSPackContainer,
  CatalogAvailabilityStatus,
  GatekeeperAuditReport
} from './types';
import { importFSSPack, FSSPackImportResult } from './importer';

export interface VaultEntry {
  settingId: string;
  spaceGroupNumber: number;
  catalogStatus: CatalogAvailabilityStatus;
  record: DetailedSymmetryRecord;
  container: FSSPackContainer;
  importedAtUtc: string;
  isActiveInClassifier: boolean;
  auditReport: GatekeeperAuditReport;
}

export interface VaultSummaryItem {
  settingId: string;
  spaceGroupNumber: number;
  hmSymbol: string;
  isActive: boolean;
  catalogStatus: CatalogAvailabilityStatus;
  importedAtUtc: string;
}

/**
 * Stand 2 — Experimental Lab Workspace.
 * 
 * Operates in complete isolation from Stand 1:
 * - Imported .fsspack packages are stored in the Local Vault in an INACTIVE state.
 * - Activation in the experimental classifier requires an explicit user/agent action.
 * - Zero mutation of Stand 1 registry or standard catalog.
 */
export class Stand2Workspace {
  private vault: Map<string, VaultEntry> = new Map();
  private baseCatalog: DetailedSymmetryRecord[];

  /**
   * @param includeStand1Default If true (default), copies Stand 1's 8 baseline records
   * into Stand 2's active catalog as the foundation for comparative experiments.
   * Modifying Stand 2 NEVER mutates Stand 1.
   */
  constructor(includeStand1Default: boolean = true) {
    // Deep clone to guarantee total memory separation
    this.baseCatalog = includeStand1Default
      ? JSON.parse(JSON.stringify(getDefaultCatalog()))
      : [];
  }

  /**
   * Imports an .fsspack package into the Stand 2 Local Vault.
   * The package is validated by Gatekeeper.
   * If valid, it is stored in the vault, but NOT activated in the classifier.
   */
  importToVault(input: string | unknown): FSSPackImportResult {
    // Gatekeeper conflict check against vault
    const existingIds = new Set(this.vault.keys());
    const result = importFSSPack(input, {
      existingSettingIds: existingIds,
      disallowIdConflict: false // Allow re-import/update in vault with audit
    });

    if (!result.success || !result.record || !result.container || !result.settingId) {
      return result;
    }

    const entry: VaultEntry = {
      settingId: result.settingId,
      spaceGroupNumber: result.spaceGroupNumber!,
      catalogStatus: result.catalogStatus!,
      record: result.record,
      container: result.container,
      importedAtUtc: new Date().toISOString(),
      isActiveInClassifier: false, // MANDATORY: Not active upon import!
      auditReport: result.auditReport
    };

    this.vault.set(result.settingId, entry);
    return result;
  }

  /**
   * Explicitly activates an imported setting in the Stand 2 experimental classifier.
   */
  activateSetting(settingId: string): boolean {
    const entry = this.vault.get(settingId);
    if (!entry) {
      throw new Error(`Cannot activate setting '${settingId}': not present in Stand 2 Local Vault`);
    }
    entry.isActiveInClassifier = true;
    return true;
  }

  /**
   * Deactivates a setting in the Stand 2 experimental classifier.
   */
  deactivateSetting(settingId: string): boolean {
    const entry = this.vault.get(settingId);
    if (!entry) {
      return false;
    }
    entry.isActiveInClassifier = false;
    return true;
  }

  /**
   * Returns the current active catalog for Stand 2 experiments:
   * Base catalog (Stand 1 baseline) + explicitly activated vault entries.
   */
  getActiveCatalog(): DetailedSymmetryRecord[] {
    const active: DetailedSymmetryRecord[] = JSON.parse(JSON.stringify(this.baseCatalog));
    for (const entry of this.vault.values()) {
      if (entry.isActiveInClassifier) {
        // Prevent duplicate if already in base
        if (!active.some(r => r.settingId === entry.settingId)) {
          active.push(JSON.parse(JSON.stringify(entry.record)));
        }
      }
    }
    return active;
  }

  /**
   * Runs the two-stage classifier strictly within Stand 2's active experimental catalog.
   */
  classifyExperiment(queryOperations: InputSymmetryOperation[]): TwoStageMatchReport {
    const activeCatalog = this.getActiveCatalog();
    return classifyOperationSet(queryOperations, activeCatalog);
  }

  /**
   * Lists summary of all entries in Stand 2 Local Vault.
   */
  getVaultSummary(): VaultSummaryItem[] {
    const list: VaultSummaryItem[] = [];
    for (const entry of this.vault.values()) {
      list.push({
        settingId: entry.settingId,
        spaceGroupNumber: entry.spaceGroupNumber,
        hmSymbol: entry.record.hmSymbol,
        isActive: entry.isActiveInClassifier,
        catalogStatus: entry.catalogStatus,
        importedAtUtc: entry.importedAtUtc
      });
    }
    return list;
  }

  /**
   * Retrieves full vault entry.
   */
  getVaultEntry(settingId: string): VaultEntry | undefined {
    return this.vault.get(settingId);
  }

  /**
   * Number of items currently stored in the Local Vault.
   */
  get vaultSize(): number {
    return this.vault.size;
  }

  /**
   * Clears the Local Vault.
   */
  clearVault(): void {
    this.vault.clear();
  }
}
