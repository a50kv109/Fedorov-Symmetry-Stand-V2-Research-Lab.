# FSS — System Architecture

**Project:** Fedorov Symmetry Stand (FSS V2) — Remix Stand 2  
**Document:** `docs/ARCHITECTURE.md`  
**Classification:** Canonical System Architecture & Module Blueprint  
**Status:** Active Two-Stand Architecture (Post-Stand 2 & FSSPack V1.0 Integration)  
**Last Updated:** 2026-10-15  

---

## 1. High-Level System Topology

The Fedorov Symmetry Stand (FSS V2) is structured around two distinct operational environments: the **Reference Stand (Stand 1)** and the **Experimental Lab Workspace (Stand 2)**, supported by a four-tier technical stack.

```
+---------------------------------------------------------------------------------------------------------+
| TIER 1: USER INTERFACE & VISUALIZATION (src/ / App.tsx) [ACTIVE_IN_UI]                                  |
| • React 19 Single Page Application with Tailwind CSS                                                    |
| • Three.js 3D Viewport: Interactive Regular Tetrahedron (components/TetrahedronViewport.tsx)             |
| • Symmetry Experiment Controller: Operation selector, predicate toggle, epsilon tolerance control      |
| • Evidence Inspection Panel: Real-time bit-identical JSON evidence generator                            |
| • Classifier UI: Two-stage space group classification component (components/ClassifierUI.tsx)           |
| • Topological Lattice: 2D harmonic frequency lattice (components/LatticeVisualizer.tsx)                  |
+---------------------------------------------------------------------------------------------------------+
                                                     ▲
                                                     │ HTTP / REST / Vite HMR
                                                     ▼
+---------------------------------------------------------------------------------------------------------+
| TIER 2: SERVER & SERVICE DISPATCHER (server.ts) [PARTIALLY_EXPOSED_API]                                 |
| • Express 5 running on Node.js / tsx (Port 3000)                                                        |
| • POST /api/classify -> Invokes core/operation_set_match.ts (8-setting catalog query)                   |
| • POST /api/experiment -> Invokes core/engine.ts (Deterministic polyhedral symmetry verification)        |
| • GET /api/experiment/canonical -> Serves canonical structures and symmetry operations                  |
| • POST /api/synthesis -> Gemini API client for harmonic protocol text synthesis (if key is set)         |
| • Static file serving for Vite production bundle in dist/                                               |
+---------------------------------------------------------------------------------------------------------+
                                                     │
                                                     ▼ In-Process Method Invocations
+---------------------------------------------------------------------------------------------------------+
| TIER 3: COMPUTING CORE & TWO-STAND SYSTEM (core/) [IMPLEMENTED & TESTED]                                |
|                                                                                                         |
| ┌──────────────────────────────────────────────────┐ ┌────────────────────────────────────────────────┐ │
| │ STAND 1: REFERENCE STAND (Immutable)             │ │ STAND 2: EXPERIMENTAL LAB WORKSPACE (Isolated) │ │
| ├──────────────────────────────────────────────────┤ ├────────────────────────────────────────────────┤ │
| │ • Normative Catalog: 8 settings (core/registry)  │ │ • Stand2Workspace (core/fsspack/stand2_workspace)│ │
| │ • Vector-Affine Engine (core/engine.ts)          │ │ • Local Vault: Isolated in-memory storage      │ │
| │ • Invariant Profiler (core/operation_set_profile)│ │ • Zero Auto-Activation: Explicit user toggle   │ │
| │ • Candidate Matcher (core/operation_set_match.ts)│ │ • Isolated Classifier: No Stand 1 mutation     │ │
| │ • STL V1 Matrix Conjugacy (core/stl/)            │ │ • Chirality Guard: P41 vs P43 discrimination   │ │
| │ • Group Closure Engine (core/group_closure.ts)   │ │ • Gatekeeper Inbound Gate (core/fsspack/gate)  │ │
| │ • FSSPack Exporter (core/fsspack/exporter.ts)    │ │ • FSSPack Importer (core/fsspack/importer.ts)  │ │
| └─────────────────────────┬────────────────────────┘ └────────────────────────▲───────────────────────┘ │
|                           │                                                    │                         │
|                           └───────────────> .fsspack V1.0 Container ───────────┘                         │
|                                             (RFC 8785 JCS, SHA-256)                                     │
+---------------------------------------------------------------------------------------------------------+
                                                     │
                                                     ▼ Static File Access
+---------------------------------------------------------------------------------------------------------+
| TIER 4: CRYSTALLOGRAPHIC BENCHMARKS & STORAGE (data/)                                                   |
| • data/crystallography/gemmi_benchmark_4.json (8 normative benchmark records, SHA-256: f1ee084b...)      |
| • data/packages/P41_SG76.fsspack (Verified reference package, SHA-256: cdda9dc3...)                     |
| • data/packages/P43_SG78.fsspack (Verified reference package, SHA-256: e2fff03c...)                     |
| • schemas/fsspack_v1.schema.json (JSON Schema Draft 2020-12 definition)                                 |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Stand 1 vs Stand 2 Architectural Partitioning

The system enforces a strict architectural partition between the reference baseline and experimental research:

| Characteristic | Stand 1 (Reference Stand) | Stand 2 (Experimental Lab Workspace) |
| :--- | :--- | :--- |
| **Epistemic Role** | Normative, frozen crystallographic truth. | Dynamic hypothesis testing and candidate exploration. |
| **Catalog Scope** | Strictly 8 baseline settings in classifier (`REGISTERED_SETTING_IDS`). Setting 76 ($P4_1$) is extended. | Baseline catalog + user-activated packages from Local Vault. |
| **Mutability** | **100% Immutable**. No runtime package insertion allowed. | **Mutable sandbox**. Packages can be imported, activated, and deactivated. |
| **Package Intake** | Producer: exports `.fsspack` containers. | Consumer: receives `.fsspack` containers via Gatekeeper. |
| **Activation Discipline** | Pre-configured and static. | **Zero Auto-Activation**: Imported packages are stored as `INACTIVE` until explicitly activated. |
| **Contamination Guard** | Protected by deep copying (`JSON.parse(JSON.stringify(getDefaultCatalog()))`). Stand 2 actions NEVER leak into Stand 1. | Fully isolated; modifications are confined to the workspace instance. |

---

## 3. Core Modules & Their Responsibilities

### 3.1. Stand 2 & FSSPack Subsystem (`core/fsspack/`)
* **`types.ts`:** Normative TypeScript definitions for FSSPack V1.0 container, manifest, payload, passport, operator, Gatekeeper audit reports, and error codes (`ERR_SCHEMA_VIOLATION`, `ERR_PAYLOAD_INTEGRITY_COMPROMISED`, `ERR_INVALID_ROTATION_MATRIX`, `ERR_IDENTITY_ELEMENT_MISSING`, `ERR_GROUP_CLOSURE_FAILED`, `ERR_KERNEL_INCOMPATIBLE`, `ERR_CHIRALITY_MISMATCH`, `ERR_SETTING_COLLISION`).
* **`canonical_json.ts`:** Implements **RFC 8785 (JSON Canonicalization Scheme / JCS)**:
  - Lexicographical sorting of JSON object keys by UTF-16 code units.
  - Number normalization (e.g., `-0` converted to `0`).
  - Cryptographic SHA-256 calculation over canonical payload strings.
* **`schema_validator.ts`:** Lightweight, dependency-free JSON Schema Draft 2020-12 validator enforcing exact field types and rejecting extraneous keys (`additionalProperties: false`).
* **`gatekeeper.ts`:** Zero-trust security gate verifying packages through rules **GK-01** to **GK-09**:
  - `GK-01`: Schema conformance.
  - `GK-02`: Kernel compatibility string check (`>=1.0.0`).
  - `GK-03`: SHA-256 payload checksum validation.
  - `GK-04`: Unimodularity ($\det W \in \{+1, -1\}$) and row-orthogonality ($W W^T = I$).
  - `GK-05`: Presence of the exact identity operation $(I, \vec{0})$.
  - `GK-06`: Group closure under composition $(W_1 W_2, W_1 \vec{w}_2 + \vec{w}_1 \bmod \mathbb{Z}^3)$.
  - `GK-07`: Group inverse existence for every operation modulo $\mathbb{Z}^3$.
  - `GK-08`: Chirality verification (preventing substitution between enantiomorphic screw pairs like $P4_1$ and $P4_3$).
  - `GK-09`: Workspace namespace collision check.
* **`exporter.ts`:** Extracts crystallographic settings from `core/registry.ts`, normalizes rational coordinates, canonicalizes the payload via RFC 8785, computes the SHA-256 digest, and emits a compliant `.fsspack` container.
* **`importer.ts`:** Parses `.fsspack` strings, runs Gatekeeper validation, and determines catalog availability (`DEFAULT_CATALOG`, `EXTENDED_ONLY`, `NOT_IN_CATALOG`).
* **`stand2_workspace.ts`:** The `Stand2Workspace` class orchestrating the experimental sandbox:
  - Maintains `vault: Map<string, VaultEntry>`.
  - Maintains `activeCatalog: DetailedSymmetryRecord[]`.
  - Enforces explicit activation state transitions (`importToVault` -> `activateSetting` -> `classifyExperiment` -> `deactivateSetting`).
* **`p41_p43_validator.ts`:** Mathematical analyzer of tetragonal 4-fold screw axes along $[0,0,1]$, proving screw pitch invariance under arbitrary origin shifts and generating reference packages for SG 76 ($P4_1$) and SG 78 ($P4_3$).

### 3.2. Symmetry Transformation Lab V1 (`core/stl/`)
* **`exact_scalar.ts`:** Exact normalized rational arithmetic ($p/q$, $q > 0$, $\gcd(|p|, q) = 1$) on `BigInt`.
* **`exact_matrix.ts`:** Exact matrix addition, multiplication, determinant computation, and Gaussian elimination matrix inversion for dimensions $n \in \{2, 3\}$.
* **`conjugacy.ts`:** Verifies the algebraic conjugacy identity $g' = P^{-1} g P$ for finite matrix lists under an explicit invertible basis transformation $P$. Emits structured `ConjugacyResult` with element-wise evidence.
* **`README.md`:** Normative module passport, interface specification, and negative boundaries.

### 3.3. Deterministic Computing Core (`core/`)
* **`engine.ts`:** Executes affine symmetry experiments on canonical structures with metric tolerance $\varepsilon$, validating predicates `PRESERVES_STRUCTURE` and `INVARIANT_SUBSPACE`.
* **`dimension.ts`:** Scale-invariant affine dimensionality analyzer using covariance matrix eigenvalues across scales from $10^{-3}$ to $10^3$.
* **`operation_set_profile.ts`:** Invariant profiler extracting coordinate-independent algebraic invariants (matrix orders $\{1, 2, 3, 4, 6\}$, trace histograms, determinant ratios, inversion centers).
* **`operation_set_match.ts`:** Two-stage classifier:
  - *Stage 1:* Candidate filter pruning incompatible catalog candidates via linear invariants.
  - *Stage 2:* Strict bijective canonical key matching (`${JSON(W)}|${w mod 1}`) against the 8-setting catalog and origin-shift checking for Group 19.
* **`registry.ts`:** Central registry of space group definitions with 9 settings (Nos. 1, 2, 3, 4, 5, 9, 14, 19, and 76).
* **`group_closure.ts`:** GCL-01 BFS group closure algorithm computing full groups from minimal generator sets modulo $\mathbb{Z}^3$. (Maintained as an isolated research module).

---

## 4. Primary Data Flow Pipelines

### 4.1. FSSPack Inbound Intake & Stand 2 Experimentation Pipeline
```
[External .fsspack File / String]
            │
            ▼
[JSON Schema Validation (Draft 2020-12)] ─── (Fail: ERR_SCHEMA_VIOLATION)
            │ (Pass)
            ▼
[Gatekeeper Verification (GK-01 — GK-09)] ── (Fail: ERR_PAYLOAD_INTEGRITY, etc.)
  • Checksum: RFC 8785 JCS + SHA-256
  • Math: det(W) in {+1, -1}, Orthogonality
  • Group: Identity, Closure mod Z^3, Inverses
  • Enantiomorph: Chirality verification
            │ (Pass: GatekeeperAuditReport)
            ▼
[Stand 2 Local Vault Storage]
  • State: INACTIVE in Classifier
  • Baseline Stand 1 Catalog: 100% Intact
            │
            ▼ (Explicit User Action: stand2.activateSetting(id))
[Stand 2 Active Experimental Catalog Updated]
            │
            ▼
[stand2.classifyExperiment(queryOps)]
            │
            ▼
[TwoStageMatchReport Emitted] (e.g., EXACT_MATCH on SG 76)
            │
            ▼ (Explicit User Action: stand2.deactivateSetting(id))
[Active Catalog Restored to Baseline 8 Groups]
```

### 4.2. Space Group Classification Pipeline
```
[Query Operations: (W, w)]
            │
            ▼
[Invariant Profiler (EXP-09)]
  • Order histogram, trace spectrum, det ratio, inversion presence
            │
            ▼
[Stage 1: Candidate Filter]
  • Compares query profile with pre-indexed catalog profiles
  • Prunes impossible candidates (Zero false negatives)
            │
            ▼ Candidates Remaining?
       ┌────┴───────────────────────────────┐
    (None)                               (>= 1)
       │                                    │
       ▼                                    ▼
[NO_CANDIDATES]                      [Stage 2: Strict Candidate Matcher]
                                       • Canonical key matching: W + (w mod 1)
                                       • Evaluates origin shifts (e.g. Group 19)
                                            │
                                            ▼
                               [EXACT_MATCH / CANDIDATE_LIST /
                                OPERATION_MISMATCH / SETTING_MISMATCH]
```

### 4.3. Polyhedral Geometric Evidence Pipeline
```
[User Action in App.tsx / Three.js UI]
  • Select Structure (Canonical Tetrahedron)
  • Select Operation (C3_120, ReflectionXY, etc.)
  • Set Tolerance Epsilon (e.g., 1e-5)
            │
            ▼
[core/engine.ts: runSymmetryExperiment()]
  • Affine transformation: v' = Wv + w
  • Point-to-point Euclidean distance check: ||v' - u|| < eps
  • Bijective vertex permutation mapping
            │
            ▼
[Structured Evidence Report Emitted]
  • isSymmetry: boolean
  • permutation: number[]
  • maxDistanceDeviation: number
  • Bit-identical JSON payload copied to clipboard or inspected
```

---

## 5. Architectural Memory Separation & Isolation Guarantees

To ensure that experimental activities never degrade the reference catalog:

1. **Memory Isolation:**  
   When `Stand2Workspace` is instantiated with `includeStand1Default = true`, it creates an isolated deep clone of `getDefaultCatalog()` using `JSON.parse(JSON.stringify(...))`. No shared references exist between Stand 1's static catalog and Stand 2's workspace memory.
2. **Local Vault State Machine:**  
   Every entry in `Stand2Workspace.vault` has a boolean flag `isActiveInClassifier` initialized to `false`. The active experimental catalog is constructed dynamically from `baseCatalog` and active vault entries only when requested.
3. **No Global State Mutation:**  
   Stand 2 methods operate strictly on instance state. Stand 1 functions (`classifyOperationSet`, `getDefaultCatalog`, `SymmetryCatalog`) contain no mutable global state and are immune to side effects from Stand 2 operations.
