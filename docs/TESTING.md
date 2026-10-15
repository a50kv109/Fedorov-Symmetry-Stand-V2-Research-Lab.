# FSS — Testing & Verification Guide

**Project:** Fedorov Symmetry Stand (FSS V2) — Remix Stand 2  
**Document:** `docs/TESTING.md`  
**Classification:** Canonical Testing & Verification Manual  
**Status:** Validated Execution Report (100% Passing Test Suites)  
**Last Updated:** 2026-10-15  

---

## 1. Quick Verification Commands

All tests and validation scripts execute directly in Node.js using `tsx` or standard npm scripts without external databases.

```bash
# 1. Static Type Checking (0 errors)
npm run lint

# 2. Production Build Verification (Clean bundle emitted)
npm run build

# 3. FSSPack V1.0 Container & Gatekeeper Inbound Gate Tests
npx tsx core/fsspack/fsspack.test.ts

# 4. Stand 1 vs Stand 2 Architectural Isolation Tests
npx tsx core/fsspack/stand2_isolation.test.ts

# 5. Enantiomorphic Pair P41 (SG 76) vs P43 (SG 78) Discrimination Tests
npx tsx core/fsspack/p41_p43.test.ts

# 6. STL V1 Autonomous Exact Matrix Conjugacy Test Suite (60 assertions)
npx tsx core/stl/conjugacy.test.ts

# 7. Two-Stage Space Group Invariant Profiler & Candidate Matcher Tests
npx tsx core/operation_set_profile.test.ts
npx tsx core/filter_soundness.test.ts

# 8. Affine Dimensionality & Polyhedral Geometric Engine Tests
npx tsx core/dimension.test.ts
npx tsx core/engine.test.ts

# 9. Group Closure Engine (GCL-01, Isolated Module)
npx tsx core/group_closure.test.ts

# 10. REST API Endpoint Boundary Tests
npx tsx tests/api_classify.test.ts
npx tsx core/tests/phase_5d_api.test.ts
```

---

## 2. Comprehensive Test Suite Audit & Execution Status

A complete audit of all test files across the repository was executed directly in the runtime environment on 2026-10-15.

### Summary:
* **Active Passing Test Suites:** 21 test files (100% PASS, 0 failures).
* **Failing Test Suites:** 0 files.
* **Linter (`npm run lint` / `tsc --noEmit`):** PASS (0 errors).
* **Build (`npm run build` / `vite build`):** PASS (clean production bundle emitted in ~8.8s).

---

### Detailed Test Execution Matrix:

| # | Test File | Target Module | Scope & Coverage | Exit Code | Verified Status |
|:--|:---|:---|:---|:---:|:---:|
| 1 | `core/fsspack/fsspack.test.ts` | `core/fsspack/` | RFC 8785 (JCS) canonicalization, SHA-256 payload integrity, export/import of all 9 settings, 7 Gatekeeper negative rejection rules. | **0** | **PASS** |
| 2 | `core/fsspack/stand2_isolation.test.ts` | `core/fsspack/stand2_workspace.ts` | Stand 1 baseline immutability, Local Vault storage, zero auto-activation, isolated experimental classification, deactivation. | **0** | **PASS** |
| 3 | `core/fsspack/p41_p43.test.ts` | `core/fsspack/p41_p43_validator.ts` | Tetragonal screw axes along $[0,0,1]$, $P4_1$ vs $P4_3$ chirality protection, enantiomorph discrimination, $z$-invariance under origin shift. | **0** | **PASS** |
| 4 | `core/stl/conjugacy.test.ts` | `core/stl/conjugacy.ts` | STL V1 exact rational linear algebra on BigInt, $g' = P^{-1} g P$, $D_4$ fixtures, singular $P$, dimension policy ($n \in \{2, 3\}$), 60 assertions. | **0** | **PASS** |
| 5 | `core/filter_soundness.test.ts` | `core/operation_set_match.ts` | Candidate filter soundness (T1–T10) + 16 extended scenarios (S1–S16) across all 8 catalog settings. Zero false negatives. | **0** | **PASS** |
| 6 | `core/operation_set_profile.test.ts` | `core/operation_set_profile.ts` | Invariant extraction (T1–T10): matrix orders $\{1, 2, 3, 4, 6\}$, trace histograms, determinant ratios, inversion centers. | **0** | **PASS** |
| 7 | `core/dimension.test.ts` | `core/dimension.ts` | 64 affine dimensionality tests: 3D regular tetrahedron, planar 2D, collinear 1D, point 0D, scale invariance ($10^{-3}$ to $10^3$). | **0** | **PASS** |
| 8 | `core/engine.test.ts` | `core/engine.ts` | 31 geometric engine tests: regular tetrahedron symmetry operations ($C_3$, reflections), metric tolerance $\varepsilon$, evidence integrity. | **0** | **PASS** |
| 9 | `core/group_closure.test.ts` | `core/group_closure.ts` | 15 group closure tests on BigInt rationals (GCL-01): cyclic, dihedral, screw axes, det constraints, inverse verification. | **0** | **PASS** |
| 10 | `core/registry.test.ts` | `core/registry.ts` | Space group catalog initialization, lookup by settingId, lookup by groupNumber, operation completeness across 9 settings. | **0** | **PASS** |
| 11 | `core/reference_loader.test.ts` | `core/reference_loader.ts` | Gemmi benchmark SHA-256 (`f1ee084b...`), origin shift $\vec{x}_0 = (1/4, 1/4, 1/4)$, 8-record catalog comparison. | **0** | **PASS** |
| 12 | `core/group_properties.test.ts` | `core/group_properties.ts` | Matrix orders, inversion midpoints, unreduced translation sums vs mod 1, 100-run bit-identical determinism. | **0** | **PASS** |
| 13 | `core/property_evidence.test.ts` | `core/property_evidence.ts` | Evidence-backed property reporting over benchmark records (8/8 reports, robust setting lookups). | **0** | **PASS** |
| 14 | `core/passport_verification.test.ts` | `core/passport_verification.ts` | Verification of mathematical passports against space group definitions. | **0** | **PASS** |
| 15 | `core/schema/crystallographic_exchange.test.ts` | `core/schema/crystallographic_exchange.ts` | BigInt `ExactRational`, Euclidean GCD, canonical operation key generation, record schema validation. | **0** | **PASS** |
| 16 | `core/schema/crystallographic_extractor.test.ts` | `core/schema/crystallographic_extractor.ts` | Extractor & artifact validation against manifest SHA-256 (8/8 records validated). | **0** | **PASS** |
| 17 | `core/tests/SG-002.test.ts` | `core/registry.ts` | Specific symmetry checks for Space Group No. 2 ($P\bar{1}$): inversion center fixed point equation. | **0** | **PASS** |
| 18 | `core/symmetry_adapter.test.ts` | `core/symmetry_adapter.ts` | Type conversions between internal rational representations and exchange formats. | **0** | **PASS** |
| 19 | `core/generator.test.ts` | `core/generator.ts` | Group generators for cyclic and dihedral subgroups. | **0** | **PASS** |
| 20 | `core/importer.test.ts` | `core/importer.ts` | Crystallographic CIF/JSON data import parser. | **0** | **PASS** |
| 21 | `tests/api_classify.test.ts` | `server.ts` / Matcher | End-to-end API contract tests: valid input, malformed syntax, negative denominator rejection, payload size limit, operation limit. | **0** | **PASS** |

*Note on historical test harness `core/tests/http_api_classify.test.ts`:* This file contains assertions that pass (T1–T5), but because it directly imports `server.ts` which binds an HTTP socket, running it with `tsx` without an explicit `process.exit(0)` causes the Node.js event loop to stay open. The test was superseded by `tests/api_classify.test.ts` and `core/tests/phase_5d_api.test.ts`, both of which execute and exit with code 0 cleanly.

---

## 3. Static Type Analysis & Build Logs

### Static Type Checking:
```bash
$ npm run lint
> fedorov--harmonic-synthesis@0.0.0 lint
> tsc --noEmit
# Exit Code: 0 (Zero type errors detected across entire repository)
```

### Production Build:
```bash
$ npm run build
> fedorov--harmonic-synthesis@0.0.0 build
> vite build
vite v6.4.4 building for production...
transforming...
✓ 1708 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                    1.36 kB │ gzip:   0.67 kB
dist/assets/index-D6eoqDWG.js  1,036.42 kB │ gzip: 279.48 kB
✓ built in 8.85s
# Exit Code: 0 (Clean production bundle emitted)
```

---

## 4. Status of External Tools & Dependencies

* **Gemmi Benchmark Ingestion:**  
  The benchmark artifact `data/crystallography/gemmi_benchmark_4.json` (canonical SHA-256 `f1ee084b...`) is statically committed and verified by `core/reference_loader.test.ts` and `core/schema/crystallographic_extractor.test.ts`.  
  *Operational Note:* The Python `gemmi` package and CLI tool are not installed in the standard runtime container. Dynamic extraction scripts (`scripts/extract_gemmi_data.py`) are documented for offline maintenance, but live execution in CI requires installing the `gemmi` Python package.
* **OpenSSL / Node `crypto`:**  
  All SHA-256 checksums in `core/fsspack/canonical_json.ts` and `core/schema/crystallographic_extractor.ts` use standard Node.js built-in `crypto` (`createHash('sha256')`). No external binary dependencies are required.
