# FSS — Project Passport

**Project:** Fedorov Symmetry Stand (FSS V2) — Remix Stand 2  
**Document:** `docs/PROJECT_PASSPORT.md`  
**Classification:** Canonical System Passport & Engineering Charter  
**Target Repository:** `fss-stand-2-remix`  
**Status:** Integrated Research Stand (Stand 2 Remix & FSSPack V1.0 Implemented)  
**Last Updated:** 2026-10-15  

---

## 1. System Mission & Identity

The **Fedorov Symmetry Stand (FSS)** is an open-source, deterministic theoretical research environment engineered for the mathematical verification, analysis, and representation matching of crystallographic space groups.

Rooted in Evgraf S. Fedorov’s classical 1891 geometric derivation of the 230 space groups, FSS does not operate as an empirical physical simulation or a static lookup table. Instead, it provides a computational experimental environment that couples exact rational arithmetic and vector-affine geometry with hypothesis testing, reproducible digital evidence generation, and strict epistemic demarcation.

In FSS V2, the system introduces the **Two-Stand Architectural Model**:
* **Stand 1 (Reference Stand):** An immutable normative repository housing the validated baseline catalog of crystallographic settings, exact affine engines, and reference export pipelines.
* **Stand 2 (Experimental Lab Workspace):** An isolated research sandbox featuring a **Local Vault** and a **Zero-Trust Gatekeeper**, allowing researchers to import, validate, and experiment with extended space group packages without risking pollution or regression of Stand 1.

---

## 2. System Goals

1. **Deterministic Geometric Verification:** Execute affine symmetry operations on canonical polyhedra (such as the regular tetrahedron) in 3D space with configurable metric tolerances $\varepsilon$ and emit bit-identical JSON evidence.
2. **Exact Algebraic Arithmetic:** Eliminate floating-point rounding drift by performing matrix linear algebra, determinants, and Gaussian inversions in $\mathbb{Q}^{n \times n}$ using `BigInt` rationals with Euclidean GCD normalization.
3. **Epistemically Demarcated Classification:** Filter and match space group representations via a two-stage pipeline separating necessary coordinate-independent linear invariants (Stage 1) from strict canonical key matching modulo $\mathbb{Z}^3$ (Stage 2).
4. **Autonomous Matrix Conjugacy Verification (STL V1):** Verify algebraic conjugacy $g' = P^{-1} g P$ for $n \in \{2, 3\}$ under explicit invertible transformations $P \in GL_n(\mathbb{Q})$.
5. **Secure Package Exchange (FSSPack V1.0):** Standardize a portable, cryptographically verified JSON container format complying with **RFC 8785 (JCS)** and SHA-256 hashing for transferring crystallographic group definitions.
6. **Zero-Trust Receiver Auditing (Gatekeeper GK-01 — GK-09):** Ensure that any space group package loaded into the experimental workspace is mathematically sound (unimodularity, identity element, group closure mod $\mathbb{Z}^3$, inverse existence, and enantiomorph chirality protection).
7. **Strict Architectural Isolation:** Guarantee zero mutation of the reference baseline: packages in the Stand 2 Local Vault remain inactive until explicitly activated by user command.

---

## 3. Project Boundaries: Implemented vs Tested vs Documented vs Planned

To preserve scientific and engineering integrity, capabilities are strictly partitioned:

### 3.1. Implemented & Active in Code
* **3D Polyhedral Stand (`core/engine.ts`, `App.tsx`):** Vector-affine transformations on canonical regular tetrahedron with Three.js rendering and digital evidence generation.
* **Affine Dimensionality Analysis (`core/dimension.ts`):** Scale-invariant covariance and eigenvalue analysis determining geometric dimension ($0$D, $1$D, $2$D, $3$D).
* **Two-Stage Classifier (`core/operation_set_profile.ts`, `core/operation_set_match.ts`):** Evaluates space group operations against the 8-setting baseline catalog.
* **REST API (`server.ts`):** `POST /api/classify` with payload size and operation count limits; `POST /api/experiment`.
* **STL V1 (`core/stl/`):** Exact matrix conjugacy verification $g' = P^{-1} g P$ in $\mathbb{Q}^{2 \times 2}$ and $\mathbb{Q}^{3 \times 3}$.
* **Group Closure Engine (`core/group_closure.ts`):** Isolated BFS group closure modulo $\mathbb{Z}^3$ on BigInt rationals.
* **Stand 1 Reference Registry (`core/registry.ts`):** 9 settings defined, with SG 76 ($P4_1$) quarantined as extended.
* **FSSPack V1.0 Container Subsystem (`core/fsspack/`):** Exporter, importer, schema validator, JCS canonicalizer, and Gatekeeper.
* **Stand 2 Workspace (`core/fsspack/stand2_workspace.ts`):** Local Vault with explicit activation state machine.
* **Enantiomorph Discriminator (`core/fsspack/p41_p43_validator.ts`):** Tetragonal screw axis analysis ($P4_1$ vs $P4_3$).

### 3.2. Formally Verified by Automated Tests
* **21 Active Test Suites:** All pass with exit code 0 (`npm run lint` passes with 0 errors; `npm run build` produces a clean bundle).
* **FSSPack & Gatekeeper Tests (`core/fsspack/fsspack.test.ts`):** RFC 8785 compliance, 9 group export/import round-trips, 7 negative security rejections.
* **Stand Isolation Tests (`core/fsspack/stand2_isolation.test.ts`):** Stand 1 immutability, zero auto-activation, isolated Stand 2 classification.
* **Enantiomorphic Discrimination Tests (`core/fsspack/p41_p43.test.ts`):** Chiral boundary protection, origin-shift $z$-invariance.
* **Conjugacy Tests (`core/stl/conjugacy.test.ts`):** 60 assertions covering $D_4$, singular matrices, rational inverses, and dimension bounds.
* **Classifier Soundness Tests (`core/filter_soundness.test.ts`):** T1–T10 + S1–S16 proving zero false negatives across registered catalog settings.

### 3.3. Documented Specifications
* **Mathematical Formalisms (`docs/MATHEMATICAL_MODEL.md`):** Equations for affine operations, exact rationals, invariant profiles, and origin shifts.
* **Classifier Normative Contract (`docs/CLASSIFIER_CONTRACT.md`):** State transitions and verdicts (`EXACT_MATCH`, `CANDIDATE_LIST`, `NO_CANDIDATES`, `OPERATION_MISMATCH`, `SETTING_MISMATCH`, `INVALID_INPUT`).
* **FSSPack Specification (`docs/specs/FSSPACK_SPECIFICATION.md`):** Container layout, JSON Schema, and RFC 8785 JCS hashing.
* **Historical Assimilation Reports (`docs/analysis/`):** Full record of Phase 4A–4E, Phase 5B–5E, and Two-Stand implementation reports.

### 3.4. Planned Capabilities (Future Phases)
* **Full 230 Space Group Expansion (Phase 6):** Ingestion of the full International Tables for Crystallography (ITA) Volume A catalog.
* **Automated Lattice Reduction:** Ingestion of arbitrary coordinate frames via Delaunay/Niggli reduction ($GL_3(\mathbb{Z})$).
* **Continuous Origin Shift Solver:** Rational linear programming for identifying continuous origin shifts beyond SG 19.
* **UI Vault Manager:** Interactive graphical interface in React for uploading `.fsspack` files into Stand 2 Local Vault.
* **External Gemmi Integration:** Dynamic execution of Gemmi CLI when system dependencies are provisioned in runtime containers.

---

## 4. Epistemic Demarcation & Negative Boundaries

To prevent overclaiming, FSS enforces three inviolable principles:

1. **Computed Result $\neq$ Formal Mathematical Proof:**  
   Passing an automated unit test or running an experiment demonstrates that the implementation produces expected results for the specific finite inputs tested. It does **not** constitute a formal, computer-verified proof (e.g., Coq, Lean) of universal mathematical theorems over infinite domains.
2. **Gatekeeper Verification $\neq$ Group Isomorphism:**  
   Gatekeeper checks verify that a given finite matrix set satisfies group axioms modulo $\mathbb{Z}^3$, is unimodular, and matches the declared chiral screw pitch. It does **not** prove that the group is isomorphic to arbitrary crystallographic representations in non-conventional coordinate systems.
3. **Local Vault Import $\neq$ Automatic Activation:**  
   Importing an `.fsspack` package into Stand 2 stores the package in the Local Vault in an `INACTIVE` state. The experimental classifier will not evaluate or match against the imported setting until explicit activation (`activateSetting`) is invoked. Stand 1 is completely immutable and is never mutated by Stand 2 activities.

---

## 5. System Composition Matrix

| Tier / Subsystem | Path / Entry Point | Runtime Scope | Primary Responsibilities |
| :--- | :--- | :---: | :--- |
| **Tier 1: UI & Visualization** | `App.tsx`, `components/` | Client (Browser) | 3D Three.js tetrahedron viewport, experiment controls, JSON evidence viewer. |
| **Tier 2: Server Dispatcher** | `server.ts` | Node.js (Port 3000) | Express REST endpoints (`/api/classify`, `/api/experiment`), body size limits, static serving. |
| **Tier 3: Computing Core** | `core/` | In-Memory (Node / Browser) | Vector-affine engine, dimension analysis, invariant profiler, candidate matcher. |
| **Tier 3A: STL V1** | `core/stl/` | In-Memory Library | Exact rational linear algebra, BigInt Euclidean GCD, conjugacy verification $g' = P^{-1} g P$. |
| **Tier 3B: GCL-01** | `core/group_closure.ts` | In-Memory (Isolated) | BFS group closure from affine generators modulo $\mathbb{Z}^3$. |
| **Tier 3C: Stand 1 Registry** | `core/registry.ts` | In-Memory Reference | Normative definitions of 9 space group settings (8 standard + $P4_1$ extended). |
| **Tier 3D: Stand 2 Workspace** | `core/fsspack/stand2_workspace.ts` | In-Memory Sandbox | Isolated workspace, Local Vault, zero auto-activation, isolated experimental classification. |
| **Tier 3E: Gatekeeper** | `core/fsspack/gatekeeper.ts` | In-Memory Security Gate | Inbound zero-trust package validation (rules GK-01 through GK-09). |
| **Tier 3F: FSSPack Tools** | `core/fsspack/` | In-Memory Tools | RFC 8785 JCS canonicalizer, SHA-256 hashing, exporter, importer, schema validator. |
| **Tier 4: Benchmark & Packages**| `data/` | Static Filesystem | Gemmi benchmark, reference `.fsspack` packages (`P41_SG76`, `P43_SG78`). |

---

## 6. Current Status & Verification Record

* **Remix Status:** Production-Ready Experimental Stand (Stand 2 Remix & FSSPack V1.0).
* **Static Type Analysis (`lint`):** PASS (0 errors, verified via `npm run lint` / `tsc --noEmit`).
* **Production Build (`build`):** PASS (clean Vite bundle emitted in ~8.8s via `npm run build`).
* **Test Suite Verification:** 21 active test files pass 100% cleanly with exit code 0.
* **Publication Readiness:** Clean repository structure, zero exposed secrets or API keys, strict relative imports, complete documentation suite.
