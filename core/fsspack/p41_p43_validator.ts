import { DetailedSymmetryRecord } from '../registry';
import { ExactRational } from '../schema/crystallographic_exchange';
import { FSSPackContainer } from './types';
import { exportToFSSPack } from './exporter';

export interface ScrewAnalysisResult {
  isTetragonal4Fold: boolean;
  screwPitchZ: ExactRational | null;
  chirality: 'RIGHT_HANDED_P41' | 'LEFT_HANDED_P43' | 'ACHIRAL_OR_OTHER';
  spaceGroupCandidate: number | null; // 76, 78, or null
  isCentrosymmetric: boolean;
  reasons: string[];
}

/**
 * Standard reference record for Space Group 76 (P 41).
 */
export const REFERENCE_P41_RECORD: DetailedSymmetryRecord = {
  groupNumber: 76,
  settingId: 'P41',
  hmSymbol: 'P 41',
  hallSymbol: 'P 4w',
  provenance: 'Gemmi/ITA 2024.1 (MPL-2.0)',
  provenanceDetails: {
    source: 'Gemmi / International Tables for Crystallography Volume A',
    commitOrVersion: '5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e',
    tablePath: 'gemmi/include/gemmi/symmetry.hpp:spacegroup_tables::main',
    license: 'MPL-2.0',
    attribution: 'International Tables for Crystallography (ITA)',
    normalizationMethod: 'Exact rational extraction'
  },
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 4 }]
    },
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }]
    },
    {
      W: [[0, 1, 0], [-1, 0, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 3, denominator: 4 }]
    }
  ]
};

/**
 * Standard reference record for Space Group 78 (P 43).
 * Enantiomorphic counterpart of P41.
 */
export const REFERENCE_P43_RECORD: DetailedSymmetryRecord = {
  groupNumber: 78,
  settingId: 'P43',
  hmSymbol: 'P 43',
  hallSymbol: 'P 4cw',
  provenance: 'Gemmi/ITA 2024.1 (MPL-2.0)',
  provenanceDetails: {
    source: 'Gemmi / International Tables for Crystallography Volume A',
    commitOrVersion: '5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e',
    tablePath: 'gemmi/include/gemmi/symmetry.hpp:spacegroup_tables::main',
    license: 'MPL-2.0',
    attribution: 'International Tables for Crystallography (ITA)',
    normalizationMethod: 'Exact rational extraction'
  },
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 3, denominator: 4 }]
    },
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }]
    },
    {
      W: [[0, 1, 0], [-1, 0, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 4 }]
    }
  ]
};

/**
 * Analyzes screw axis characteristics along z [0,0,1] to differentiate P41 from P43.
 */
export function analyzeTetragonalScrewAxis(
  operations: Array<{
    W: number[][];
    w: Array<{ numerator: number; denominator: number } | { n: number; d: number }>;
  }>
): ScrewAnalysisResult {
  const reasons: string[] = [];

  // Check centrosymmetry
  const hasInversion = operations.some(op => {
    const W = op.W;
    return (
      W[0][0] === -1 && W[0][1] === 0 && W[0][2] === 0 &&
      W[1][0] === 0 && W[1][1] === -1 && W[1][2] === 0 &&
      W[2][0] === 0 && W[2][1] === 0 && W[2][2] === -1
    );
  });

  if (hasInversion) {
    reasons.push('Group possesses an inversion center (centrosymmetric); cannot be P41 or P43');
    return {
      isTetragonal4Fold: false,
      screwPitchZ: null,
      chirality: 'ACHIRAL_OR_OTHER',
      spaceGroupCandidate: null,
      isCentrosymmetric: true,
      reasons
    };
  }

  // Find C4+ generator: W = [[0, -1, 0], [1, 0, 0], [0, 0, 1]]
  const c4p = operations.find(op => {
    const W = op.W;
    return (
      W[0][0] === 0 && W[0][1] === -1 && W[0][2] === 0 &&
      W[1][0] === 1 && W[1][1] === 0 && W[1][2] === 0 &&
      W[2][0] === 0 && W[2][1] === 0 && W[2][2] === 1
    );
  });

  if (!c4p) {
    reasons.push('No counter-clockwise 4-fold rotation matrix along [0, 0, 1] found');
    return {
      isTetragonal4Fold: false,
      screwPitchZ: null,
      chirality: 'ACHIRAL_OR_OTHER',
      spaceGroupCandidate: null,
      isCentrosymmetric: false,
      reasons
    };
  }

  const wzRaw: any = c4p.w[2];
  const num = wzRaw.numerator !== undefined ? wzRaw.numerator : wzRaw.n;
  const den = wzRaw.denominator !== undefined ? wzRaw.denominator : wzRaw.d;
  const wz = new ExactRational(num, den).mod1();

  if (wz.n === 1 && wz.d === 4) {
    reasons.push('Intrinsic screw pitch along [0,0,1] is +1/4; matches right-handed P41 (SG 76)');
    return {
      isTetragonal4Fold: true,
      screwPitchZ: wz,
      chirality: 'RIGHT_HANDED_P41',
      spaceGroupCandidate: 76,
      isCentrosymmetric: false,
      reasons
    };
  }

  if (wz.n === 3 && wz.d === 4) {
    reasons.push('Intrinsic screw pitch along [0,0,1] is +3/4; matches left-handed P43 (SG 78)');
    return {
      isTetragonal4Fold: true,
      screwPitchZ: wz,
      chirality: 'LEFT_HANDED_P43',
      spaceGroupCandidate: 78,
      isCentrosymmetric: false,
      reasons
    };
  }

  reasons.push(`Unknown screw pitch ${wz.toString()} along [0,0,1]`);
  return {
    isTetragonal4Fold: true,
    screwPitchZ: wz,
    chirality: 'ACHIRAL_OR_OTHER',
    spaceGroupCandidate: null,
    isCentrosymmetric: false,
    reasons
  };
}

/**
 * Creates a verified FSSPackContainer for SG 76 (P41).
 */
export function createP41FSSPack(): FSSPackContainer {
  return exportToFSSPack(REFERENCE_P41_RECORD, {
    exportedByStand: 'STAND-1-ACCEPTANCE-V9',
    packageId: 'fsspack-sg76-p41-v1.0.0',
    provenanceSource: 'Gemmi/ITA 2024.1 (MPL-2.0)',
    provenanceHash: '5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e'
  });
}

/**
 * Creates a verified FSSPackContainer for SG 78 (P43).
 */
export function createP43FSSPack(): FSSPackContainer {
  return exportToFSSPack(REFERENCE_P43_RECORD, {
    exportedByStand: 'STAND-1-ACCEPTANCE-V9',
    packageId: 'fsspack-sg78-p43-v1.0.0',
    provenanceSource: 'Gemmi/ITA 2024.1 (MPL-2.0)',
    provenanceHash: '5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e'
  });
}
