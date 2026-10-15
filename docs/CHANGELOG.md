# FSS Integrated Research Stand — Changelog

All notable changes to the **Fedorov Symmetry Stand (FSS)** across Stand 1 and Stand 2 are documented in this file.

---

## [FSS V2 / Two-Stand Architecture & FSSPack V1.0] — 2026-10-15

### Added
* **Two-Stand Architectural Model:** Formal separation between **Stand 1** (Reference & Canonical Catalog, immutable) and **Stand 2** (Experimental Lab Workspace with isolated Local Vault).
* **FSSPack V1.0 Container Standard:**
  - Standard JSON container definition for crystallographic space group data exchange (`core/fsspack/types.ts`).
  - Canonical JSON serialization complying with **RFC 8785 (JCS)** with lexicographical UTF-16 code unit key sorting and numerical normalization (`core/fsspack/canonical_json.ts`).
  - Cryptographic data integrity verification via SHA-256 payload checksums.
  - Formal JSON Schema Draft 2020-12 specification (`schemas/fsspack_v1.schema.json`, `docs/specs/fsspack_v1.schema.json`, `docs/specs/FSSPACK_SPECIFICATION.md`).
  - Structural schema validator with strict prohibition of unmapped properties (`core/fsspack/schema_validator.ts`).
* **Gatekeeper Zero-Trust Inbound Gate (`core/fsspack/gatekeeper.ts`):**
  - Implementations for validation rules **GK-01** through **GK-09**:
    1. `GK-01`: Schema conformance.
    2. `GK-02`: Kernel version compatibility (`>=1.0.0`).
    3. `GK-03`: Payload integrity via RFC 8785 canonical SHA-256 verification.
    4. `GK-04`: Unimodularity ($\det W \in \{+1, -1\}$) and row-orthogonality.
    5. `GK-05`: Presence of identity operation $(I, \vec{0})$.
    6. `GK-06`: Group closure under composition modulo lattice translations $\mathbb{Z}^3$.
    7. `GK-07`: Existence of group inverses for all operations modulo $\mathbb{Z}^3$.
    8. `GK-08`: Enantiomorph chirality preservation and protection against false substitution.
    9. `GK-09`: Workspace namespace conflict detection.
* **Stand 2 Workspace & Local Vault (`core/fsspack/stand2_workspace.ts`):**
  - In-memory workspace holding isolated copies of reference groups and a Local Vault.
  - Zero auto-activation discipline: newly imported packages are stored in an `INACTIVE` state and are never visible to the experimental classifier without an explicit `activateSetting()` invocation.
  - Independent experimental classification (`classifyExperiment`) with zero side effects or mutations on Stand 1.
* **Crystallographic Exporter & Importer:**
  - `core/fsspack/exporter.ts`: Exports registry settings to `.fsspack` containers with normalized exact rationals and computed payload hashes.
  - `core/fsspack/importer.ts`: Deserializes and audits packages, tagging records as `DEFAULT_CATALOG`, `EXTENDED_ONLY`, or `NOT_IN_CATALOG`.
* **Enantiomorphic Discrimination Analysis (`core/fsspack/p41_p43_validator.ts`):**
  - Mathematical evaluation of 4-fold screw axes along $[0,0,1]$.
  - Proved algebraic invariance of screw pitch under origin shifts (since $(I - W)$ has row $[0,0,0]$ along the screw axis).
  - Verified benchmark packages: `data/packages/P41_SG76.fsspack` and `data/packages/P43_SG78.fsspack`.
* **Automated Test Suites:**
  - `core/fsspack/fsspack.test.ts`: RFC 8785 JCS serialization, export/import round-trips for all 9 groups, and 7 negative Gatekeeper rejections (100% PASS).
  - `core/fsspack/stand2_isolation.test.ts`: Complete Stand 1 immutability verification, Local Vault non-activation, activation, isolated classification, and deactivation (100% PASS).
  - `core/fsspack/p41_p43.test.ts`: Discrimination of $P4_1$ (SG 76) vs $P4_3$ (SG 78), chirality protection, and origin-shift invariance (100% PASS).

### Preserved (Unchanged)
* Stand 1 standard catalog in `core/operation_set_match.ts` remains strictly 8 settings.
* Stand 1 registry in `core/registry.ts` remains strictly 9 settings with $P4_1$ quarantined as extended.
* Deterministic geometric engine (`core/engine.ts`), 3D tetrahedron stand (`App.tsx`), and REST API (`server.ts`) remain 100% intact.

---

## [Phase 5G] — 2026-10-13: STL V1 Module Assimilation

### Added
* Assimilated **Symmetry Transformation Lab V1 (STL V1)** into `core/stl/` as an autonomous exact algebraic library:
  - `core/stl/exact_scalar.ts`: Normalized rational arithmetic on `BigInt` with Euclidean GCD reduction.
  - `core/stl/exact_matrix.ts`: Exact matrix addition, multiplication, determinants, and Gaussian inversion for dimensions $n \in \{2, 3\}$.
  - `core/stl/conjugacy.ts`: Deterministic verification of $g' = P^{-1} g P$ under user-provided invertible matrix $P$.
  - `core/stl/index.ts`: Typed public interface.
  - `core/stl/README.md`: Module passport, exact arithmetic contract, and negative boundaries.
  - `core/stl/conjugacy.test.ts`: 7 test scenarios (T1–T7, 60 assertions, 100% PASS).

---

## [Phase 5F] — 2026-10-12: Group Closure Engine (GCL-01)

### Added
* Deterministic group closure engine `core/group_closure.ts` using BFS composition modulo $\mathbb{Z}^3$ on BigInt rationals.
* Isolated unit test suite `core/group_closure.test.ts` (15/15 tests PASS).
* Maintained strictly as an isolated research module (unwired from UI, API, and matcher).

---

## [Phase 5E / 5D] — 2026-10-12: REST API & UI Exposure

### Added
* `POST /api/classify` endpoint in `server.ts` with body size checks (100KB limit), 50 operation cap, and strict validation.
* `components/ClassifierUI.tsx` React component for space group classification inspection.
* Integration test suite `tests/api_classify.test.ts` and in-memory boundary test `core/tests/phase_5d_api.test.ts` (100% PASS).

---

## [Phase 5B / 5C] — 2026-10-11: Legacy Test Debt Reconciliation & Packaging Repair

### Changed
* Updated legacy test assertions expecting 4 records to the 8-setting benchmark catalog in `core/property_evidence.test.ts` and `core/schema/crystallographic_extractor.test.ts`.
* Updated `package.json` `"start"` script to `"tsx server.ts"` with Node `>=18` engine specification.
* Hardened epistemic boundaries against overclaiming universal mathematical proof or general basis discovery.

---

## [Phase 5A] — 2026-10-11: GitHub Repository Publication Preparation

### Added
* Canonical documentation suite in `docs/`:
  - `docs/PROJECT_PASSPORT.md`: System mission, conceptual tiers, and epistemic boundaries.
  - `docs/ARCHITECTURE.md`: Component topology and data flow pipelines.
  - `docs/MATHEMATICAL_MODEL.md`: Symmetry operations, BigInt rational arithmetic, invariants, and dimensionality.
  - `docs/CLASSIFIER_CONTRACT.md`: Normative classifier verdicts and decision rules.
  - `docs/INTEGRATION_HISTORY.md`: History of baseline and GROK assimilation.
  - `docs/TESTING.md`: Test execution manual and harness audit.
  - `docs/LIMITATIONS.md`: Negative boundaries and prohibited claims.
  - `docs/ROADMAP.md`: Multi-phase engineering roadmap.
* Root repository files: `README.md`, `CONTRIBUTING.md`, `.env.example`.

---

## [Phase 4A–4E] — 2026-10-11: Two-Stage Space Group Classifier Assimilation

### Added
* `core/operation_set_profile.ts`: Invariant extraction engine for matrix orders, traces, determinants, and inversion center.
* `core/operation_set_match.ts`: Two-stage classifier (`filterCandidates` + `matchStrict`) for 8 catalog settings and origin-shifted Group 19.
* `core/filter_soundness.test.ts`: Soundness test suite with zero false negatives across catalog settings.

---

## [Baseline M-6A.1C] — 2026-10-09: Initial Studio FSS Stand

### Added
* Deterministic vector-affine geometric engine (`core/engine.ts`).
* Scale-invariant affine dimensionality analyzer (`core/dimension.ts`).
* Interactive 3D Three.js regular tetrahedron viewport (`components/TetrahedronViewport.tsx`).
* Express server (`server.ts`) and React 19 application (`App.tsx`).
