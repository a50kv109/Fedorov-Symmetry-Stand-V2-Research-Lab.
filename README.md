# Fedorov Symmetry Stand (FSS V2)

**A Deterministic Theoretical Research Stand for Crystallographic Symmetry Reasoning**  
*Remix Stand 2: Two-Stand Architecture, FSSPack V1.0 Container Standard, and STL V1 Integration*

---

## 1. Overview & Purpose

The **Fedorov Symmetry Stand (FSS)** is an open-source, deterministic theoretical research environment engineered for the mathematical verification, analysis, and representation matching of crystallographic space groups.

Rooted in Evgraf S. Fedorov’s classical 1891 geometric derivation of the 230 space groups, FSS is structured not as an empirical simulator or a static lookup table, but as a computational experimental stand providing:
* A **deterministic vector-affine geometric engine** for evaluating symmetry operations on 3D structures (such as the canonical regular tetrahedron) under strict metric tolerance.
* An **interactive 3D Three.js visualization environment** enabling real-time inspection of symmetry transformations and generated digital evidence.
* A **two-stage in-memory classification subsystem** combining coordinate-independent invariant profiling with strict canonical key matching modulo lattice translations $\mathbb{Z}^3$.
* An **autonomous exact matrix conjugacy lab (STL V1)** verifying $g' = P^{-1} g P$ in $\mathbb{Q}^{n \times n}$ ($n \in \{2, 3\}$) using normalized rational arithmetic on `BigInt`.
* A **Two-Stand Architectural Model** establishing a strict epistemic boundary between **Stand 1** (Reference & Canonical Catalog) and **Stand 2** (Experimental Lab Workspace).
* An open standard **FSSPack V1.0 exchange format** featuring deterministic RFC 8785 (JCS) canonicalization, SHA-256 payload integrity, and a **Gatekeeper (GK-01 — GK-09)** zero-trust inbound validation gate.
* Strict epistemic demarcation distinguishing computed results, digital evidence reports, and formal mathematical proof.

---

## 2. Integrated System Architecture

FSS organizes its capabilities into two complementary stands and four technical tiers:

```
+-------------------------------------------------------------------------------------------------+
|                                     FEDOROV SYMMETRY STAND V2                                   |
+-------------------------------------------------------------------------------------------------+
|                                                                                                 |
|   STAND 1: REFERENCE STAND (Immutable)                 STAND 2: EXPERIMENTAL LAB (Isolated)     |
|   ====================================                 ====================================     |
|   • Standard Catalog (8 settings: P1, P-1,             • Stand2Workspace & Local Vault          |
|     P2, P21, C2, Cc, P21/c, P212121)                   • Zero Auto-Activation Guarantee         |
|   • Complete Registry (9 settings, P41 extended)       • Explicit Setting Activation            |
|   • Vector-Affine 3D Engine & Three.js Viewport        • Isolated Experimental Classifier       |
|   • STL V1 Exact Matrix Conjugacy (BigInt)             • Zero Mutation of Stand 1 Catalog       |
|   • FSSPack Exporter (Exact Rationals, JCS SHA-256)    • Enantiomorph Guard (P41 vs P43)        |
|                                                                                                 |
+------------------------------------------------▲────────────────────────────────────────────────+
                                                 │
                                                 │ .fsspack V1.0 Exchange Container
                                                 │ RFC 8785 (JCS) Canonical JSON
                                                 │ SHA-256 Payload Checksum
                                                 ▼
+-------------------------------------------------------------------------------------------------+
|   GATEKEEPER INBOUND SECURITY GATE (GK-01 — GK-09)                                              |
|   ------------------------------------------------                                              |
|   [GK-01] JSON Schema Draft 2020-12       [GK-06] Group Closure mod Z^3                         |
|   [GK-02] Kernel Version (>=1.0.0)        [GK-07] Inverse Elements mod Z^3                      |
|   [GK-03] RFC 8785 SHA-256 Payload Hash   [GK-08] Chirality & Enantiomorph Protection           |
|   [GK-04] det(W) in {+1, -1} & Orthogonal [GK-09] Workspace Namespace Conflict                 |
|   [GK-05] Identity Element (I, 0)                                                               |
+-------------------------------------------------------------------------------------------------+
```

### Architectural Subsystems:
1. **Stand 1 (Reference Stand):**
   - **Vector-Affine Geometric Stand (`core/engine.ts`, `App.tsx`):** Executes affine symmetry transformations on canonical polyhedra in Three.js and emits bit-identical JSON evidence.
   - **Space Group Registry (`core/registry.ts`):** Normative definitions of 9 crystallographic settings, with SG 76 ($P4_1$) explicitly marked as extended.
   - **Two-Stage Classifier Core (`core/operation_set_profile.ts`, `core/operation_set_match.ts`):** Evaluates operations against the 8-setting baseline catalog using algebraic invariant filtering (Stage 1) and bijective canonical key matching (Stage 2).
   - **Symmetry Transformation Lab V1 (`core/stl/`):** Autonomous exact rational linear algebra library verifying matrix conjugacy $g' = P^{-1} g P$ without floating-point approximations.
   - **FSSPack Exporter (`core/fsspack/exporter.ts`):** Packages crystallographic settings into `.fsspack` containers with exact rational fractions and deterministic payload hashes.
2. **Stand 2 (Experimental Lab Workspace):**
   - **Workspace & Local Vault (`core/fsspack/stand2_workspace.ts`):** An isolated operational environment. Packages imported into the Local Vault are maintained in an `INACTIVE` state by default. They are activated into the active classifier only upon explicit request (`activateSetting`).
   - **Gatekeeper Validation Gate (`core/fsspack/gatekeeper.ts`):** Zero-trust receiver enforcing rules GK-01 through GK-09 before any package is accepted into the vault.
   - **Enantiomorphic Pair Analyzer (`core/fsspack/p41_p43_validator.ts`):** Dissects tetragonal 4-fold screw axes along $[0,0,1]$, proving that $(I - W)$ along the axis ensures $z$-invariant translation pitch under arbitrary origin choices, preventing enantiomorph confusion between $P4_1$ (SG 76) and $P4_3$ (SG 78).

---

## 3. Project Boundaries: Factual State Matrix

To prevent misleading claims, the capabilities of the current remix are demarcated into four precise categories:

| Subsystem / Capability | Status | Factual Boundary & Verification Basis |
| :--- | :---: | :--- |
| **Vector-Affine 3D Stand** | `IMPLEMENTED & TESTED` | Active in UI (`App.tsx`). Deterministic regular tetrahedron symmetry verified (31/31 tests PASS). |
| **Affine Dimension Engine** | `IMPLEMENTED & TESTED` | Scale-invariant covariance and eigenvalue analysis for dimensions $0$D–$3$D (64/64 tests PASS). |
| **Two-Stage Space Group Classifier** | `IMPLEMENTED & TESTED` | Evaluates 8 baseline settings. Zero false negatives across registered settings (100% sound in `filter_soundness.test.ts`). |
| **REST API Server** | `IMPLEMENTED & TESTED` | Implemented in `server.ts` (`POST /api/classify`, `POST /api/experiment`). Verified via `tests/api_classify.test.ts` (5/5 PASS). |
| **Classifier UI Component** | `IMPLEMENTED (UNEXPOSED)` | `components/ClassifierUI.tsx` implemented. Navigation switcher in `App.tsx` unexposed (active view defaults to experiment). |
| **STL V1 Matrix Conjugacy** | `IMPLEMENTED & TESTED` | Autonomous rational library in `core/stl/`. Verifies $g' = P^{-1} g P$ for $n \in \{2, 3\}$ (60 assertions, 7/7 PASS). |
| **Group Closure Engine (GCL-01)** | `IMPLEMENTED & TESTED` | BFS closure from generators modulo $\mathbb{Z}^3$ on BigInt (`core/group_closure.ts`). Unwired research module (15/15 PASS). |
| **FSSPack V1.0 Container Standard** | `IMPLEMENTED & TESTED` | RFC 8785 JCS canonicalization, SHA-256 payload integrity, JSON Schema Draft 2020-12 validator (`fsspack.test.ts` PASS). |
| **Gatekeeper (GK-01 — GK-09)** | `IMPLEMENTED & TESTED` | 9-rule zero-trust verification gate rejecting invalid, non-closed, tampered, or chirally mismatched packages (PASS). |
| **Stand 2 Workspace & Local Vault** | `IMPLEMENTED & TESTED` | Deep-cloned isolated workspace. Zero auto-activation in classifier. Stand 1 remains 100% immutable (`stand2_isolation.test.ts` PASS). |
| **Enantiomorph $P4_1$ vs $P4_3$ Guard** | `IMPLEMENTED & TESTED` | Chirality verification, benchmark packages in `data/packages/`, origin-shift $z$-invariance verified (`p41_p43.test.ts` PASS). |
| **Gemmi Benchmark Ingestion** | `DOCUMENTED (STATIC)` | Static reference benchmark `data/crystallography/gemmi_benchmark_4.json` verified. Dynamic Gemmi CLI is not installed in the container. |
| **Full 230 Space Group Catalog** | `PLANNED (PHASE 6)` | Matcher evaluates 8 baseline settings. Full 230 space group expansion is planned for Phase 6. |
| **Continuous Origin Shift Solver** | `PLANNED` | Origin shift equivalence is implemented strictly for the specific shift $\vec{x}_0 = (1/4, 1/4, 1/4)$ in Group 19 ($P2_12_12_1$). |
| **Basis Discovery in $GL_3(\mathbb{Z})$** | `PLANNED` | Input operations must be supplied in conventional setting basis. Automated lattice reduction (Niggli/Delaunay) is planned. |

---

## 4. Key Epistemic Principles & Prohibited Claims

1. ❌ **Do not claim FSS classifies all 230 space groups:** Stand 1 classifier catalog contains strictly **8 settings**. Setting 76 ($P4_1$) is registered in `core/registry.ts`, but excluded from `REGISTERED_SETTING_IDS` and returns `NO_CANDIDATES` in Stand 1.
2. ❌ **Do not claim tests passing equals universal mathematical proof:** Automated test suites establish absence of regression over finite tested inputs; they do not constitute an unbounded formal proof.
3. ❌ **Do not claim Gatekeeper proves isomorphism:** Gatekeeper verifies unimodularity, group axioms mod $\mathbb{Z}^3$, and checksums for the provided package; it does not solve general crystallographic isomorphism under arbitrary basis changes.
4. ❌ **Do not claim automatic activation:** Importing an `.fsspack` package into Stand 2 Local Vault never mutates Stand 1 and never activates the setting in the classifier without explicit `activateSetting()` invocation.
5. ❌ **Do not claim STL V1 discovers basis matrix $P$:** Matrix $P$ must be explicitly provided by the caller ($\det P \neq 0$).

---

## 5. Environment & Getting Started

### Prerequisites:
* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **npm:** v9.0.0 or higher

### Installation:
```bash
# Clone the repository
git clone https://github.com/<organization>/fss-stand-2-remix.git
cd fss-stand-2-remix

# Install dependencies
npm install
```

### Environment Configuration:
```bash
cp .env.example .env
```
*(Note: `GEMINI_API_KEY` is optional; used solely for harmonic text synthesis via `/api/synthesis` if configured)*

---

## 6. Running, Building & Verification

### Running the Application:
```bash
# Start development server (Express + Vite on Port 3000)
npm run dev

# Run static TypeScript type check (zero errors)
npm run lint

# Build production bundle (Vite)
npm run build

# Start production server
npm start
```

### Running Test Suites:

```bash
# 1. FSSPack V1.0 Container, RFC 8785 JCS, and Gatekeeper Tests
npx tsx core/fsspack/fsspack.test.ts

# 2. Stand 1 vs Stand 2 Isolation & Local Vault Tests
npx tsx core/fsspack/stand2_isolation.test.ts

# 3. Enantiomorphic Pair P41 (SG 76) vs P43 (SG 78) Discrimination Tests
npx tsx core/fsspack/p41_p43.test.ts

# 4. STL V1 Autonomous Matrix Conjugacy Test Suite (60 assertions)
npx tsx core/stl/conjugacy.test.ts

# 5. EXP-09 Space Group Invariant Profiler & Candidate Matcher Tests
npx tsx core/operation_set_profile.test.ts
npx tsx core/filter_soundness.test.ts

# 6. Geometric Symmetry Stand & Affine Dimensionality Tests
npx tsx core/dimension.test.ts
npx tsx core/engine.test.ts

# 7. Isolated Group Closure Module Tests (T1–T15)
npx tsx core/group_closure.test.ts

# 8. REST API Endpoint Boundary Tests
npx tsx tests/api_classify.test.ts
npx tsx core/tests/phase_5d_api.test.ts
```

*Verification Record:* All test suites pass cleanly with exit code 0. TypeScript typecheck (`npm run lint`) reports 0 errors. Production bundle build (`npm run build`) builds cleanly.

---

## 7. Directory Structure

```
.
├── App.tsx                     # React 19 Interactive Stand application
├── server.ts                   # Express server & API endpoints (/api/classify, /api/experiment)
├── package.json                # Project dependencies and run scripts
├── index.html                  # Web entry point
├── components/                 # React UI components
│   ├── ClassifierUI.tsx        # Two-stage classification UI component
│   ├── LatticeVisualizer.tsx   # 2D topological frequency lattice
│   └── TetrahedronViewport.tsx # Interactive 3D Three.js regular tetrahedron viewport
├── core/                       # Deterministic mathematical computing core
│   ├── canonical.ts            # Canonical polyhedra & affine transformations
│   ├── dimension.ts            # 3D affine dimensionality analysis
│   ├── engine.ts               # Geometric symmetry verification executor
│   ├── group_closure.ts        # GCL-01: Group closure engine (ISOLATED_MODULE_TESTED)
│   ├── operation_set_profile.ts# Algebraic invariant profiler (EXP-09)
│   ├── operation_set_match.ts  # Two-stage candidate matcher (8 baseline settings)
│   ├── registry.ts             # 9-setting space group registry (includes SG 76)
│   ├── fsspack/                # Stand 2 & FSSPack V1.0 subsystem
│   │   ├── types.ts            # Normative FSSPack V1.0 interfaces & error codes
│   │   ├── canonical_json.ts   # RFC 8785 (JCS) deterministic canonicalizer & SHA-256
│   │   ├── schema_validator.ts # JSON Schema Draft 2020-12 validator
│   │   ├── gatekeeper.ts       # Zero-trust inbound security gate (GK-01 — GK-09)
│   │   ├── exporter.ts         # Setting-to-FSSPack packager
│   │   ├── importer.ts         # FSSPack importer with catalog availability tagging
│   │   ├── stand2_workspace.ts # Stand 2 Experimental Lab & Local Vault
│   │   ├── p41_p43_validator.ts# Screw axis analyzer & enantiomorph discriminator
│   │   └── index.ts            # Public typed module entry point
│   ├── schema/                 # Exact rational arithmetic & exchange
│   └── stl/                    # STL V1: Symmetry Transformation Lab
│       ├── exact_scalar.ts     # Normalized rational arithmetic on BigInt
│       ├── exact_matrix.ts     # Exact matrix linear algebra & inversion (n in {2, 3})
│       ├── conjugacy.ts        # Deterministic verification of g' = P^-1 g P
│       ├── index.ts            # STL typed interface
│       └── README.md           # STL module passport and specification
├── data/                       # Crystallographic benchmarks & packages
│   ├── crystallography/        # Gemmi reference benchmark
│   └── packages/               # Verified .fsspack packages (P41_SG76, P43_SG78)
├── schemas/                    # JSON Schema specifications
│   └── fsspack_v1.schema.json  # FSSPack V1.0 normative schema
└── docs/                       # Canonical documentation suite
    ├── PROJECT_PASSPORT.md     # System mission, boundaries, and status
    ├── ARCHITECTURE.md         # Component topology & Two-Stand data pipelines
    ├── CHANGELOG.md            # Detailed version & integration history
    ├── TESTING.md              # Complete test manual & execution verification
    ├── LIMITATIONS.md          # Prohibited claims & negative boundaries
    ├── MATHEMATICAL_MODEL.md   # Mathematical equations & formalisms
    ├── CLASSIFIER_CONTRACT.md  # Normative classifier verdicts & state machine
    ├── REPOSITORY_PREPARATION_REPORT.md # Pre-publication audit & readiness report
    ├── design/                 # Architectural proposals (TWO_STAND_ARCH.md)
    └── specs/                  # FSSPACK_SPECIFICATION.md & JSON schema
```

---

## 8. Documentation Index

1. [docs/PROJECT_PASSPORT.md](docs/PROJECT_PASSPORT.md) — System passport, scope boundaries, and component composition
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Two-Stand architecture, tier topology, and Gatekeeper pipeline
3. [docs/CHANGELOG.md](docs/CHANGELOG.md) — Chronological history of all phases and modifications
4. [docs/TESTING.md](docs/TESTING.md) — Complete inventory of 21 test suites and verified execution records
5. [docs/LIMITATIONS.md](docs/LIMITATIONS.md) — Prohibited claims, negative boundaries, and technical constraints
6. [docs/REPOSITORY_PREPARATION_REPORT.md](docs/REPOSITORY_PREPARATION_REPORT.md) — Repository cleanup and GitHub readiness report
7. [docs/specs/FSSPACK_SPECIFICATION.md](docs/specs/FSSPACK_SPECIFICATION.md) — FSSPack V1.0 container exchange standard
8. [core/stl/README.md](core/stl/README.md) — STL V1 Module Passport and exact rational conjugacy contract
