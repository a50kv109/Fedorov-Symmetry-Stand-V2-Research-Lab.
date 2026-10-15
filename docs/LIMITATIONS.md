# FSS — Known Limitations & Prohibited Claims

**Project:** Fedorov Symmetry Stand (FSS V2) — Remix Stand 2  
**Document:** `docs/LIMITATIONS.md`  
**Classification:** Canonical Constraints Specification & Negative Boundaries  
**Status:** Active Epistemic Guide (Stand 2 Remix & FSSPack V1.0)  
**Last Updated:** 2026-10-15  

---

## 1. Prohibited Mathematical & Epistemic Claims

To maintain scientific rigor and prevent unwarranted assertions, all developers, documentation authors, and API consumers must adhere to the following negative boundaries. The following assertions are **strictly prohibited or false** in the current system:

1. ❌ **PROHIBITED: "FSS classifies all 230 space groups."**  
   * **Reality:** The Stand 1 baseline classifier catalog evaluates exactly **8 space group settings** (Nos. 1, 2, 3, 4, 5, 9, 14, 19). While 9 settings are declared in `core/registry.ts` (including SG 76 / $P4_1$), $P4_1$ is explicitly omitted from `REGISTERED_SETTING_IDS` and from `gemmi_benchmark_4.json`. Queries outside the 8 catalog settings return `NO_CANDIDATES`, `OPERATION_MISMATCH`, or `SETTING_MISMATCH`; they never return `EXACT_MATCH` in Stand 1.
2. ❌ **PROHIBITED: "Setting 76 ($P4_1$) is classified by default because it is present in registry.ts."**  
   * **Reality:** SG 76 is a registered data structure in `core/registry.ts`, but the two-stage classifier `core/operation_set_match.ts` filters candidates strictly against the 8-setting catalog. Input operations matching $P4_1$ return `NO_CANDIDATES` in Stand 1. $P4_1$ can only be classified in **Stand 2** after being explicitly imported into the Local Vault and activated via `stand2.activateSetting('P41')`.
3. ❌ **PROHIBITED: "Importing an .fsspack package automatically makes it available to the classifier."**  
   * **Reality:** The Stand 2 Local Vault operates under a strict **Zero Auto-Activation** discipline. Newly imported packages reside in an `INACTIVE` state. The experimental classifier will ignore them until `activateSetting()` is explicitly invoked by the user or client.
4. ❌ **PROHIBITED: "Stand 2 experiments can modify or extend Stand 1."**  
   * **Reality:** Stand 1 is **100% immutable**. Stand 2 operates on an isolated in-memory deep copy of the baseline catalog (`JSON.parse(JSON.stringify(getDefaultCatalog()))`). Importing, activating, or deleting packages in Stand 2 has zero side effects on Stand 1.
5. ❌ **PROHIBITED: "Gatekeeper verification proves that a space group is crystallographically isomorphic."**  
   * **Reality:** The Gatekeeper (GK-01 — GK-09) strictly verifies container schema, payload checksum (RFC 8785 SHA-256), matrix unimodularity ($\det W \in \{+1, -1\}$), orthogonality, identity element presence, group closure modulo $\mathbb{Z}^3$, and inverse existence for the specific provided operations. It does *not* prove general isomorphism under arbitrary change of basis ($GL_3(\mathbb{Z})$).
6. ❌ **PROHIBITED: "Matching the invariant profile proves that the input is space group X."**  
   * **Reality:** The invariant profile matches necessary linear invariants (matrix orders, traces, determinants, inversion presence). Distinct groups sharing identical linear invariants (e.g., $P2$ and $P2_1$) have identical profiles. Only Stage 2 strict canonical key matching can distinguish them.
7. ❌ **PROHIBITED: "FSS supports arbitrary or continuous origin shifts."**  
   * **Reality:** In Stand 1, FSS evaluates origin shift equivalence **exclusively** for the specific standard shift $\vec{x}_0 = (1/4, 1/4, 1/4)$ in Space Group 19 ($P2_12_12_1$). An input with an arbitrary continuous or non-standard origin shift evaluates to `OPERATION_MISMATCH`. (In Stand 2, screw axis $z$-invariance is mathematically evaluated for $P4_1$ and $P4_3$, but general continuous origin shift solving is not implemented).
8. ❌ **PROHIBITED: "The classifier automatically computes group closure from sparse generators."**  
   * **Reality:** The classifier compares the query multiset against the complete registered list of operations. An incomplete generator set returns `OPERATION_MISMATCH`. While an isolated research module `core/group_closure.ts` exists (`ISOLATED_MODULE_TESTED`), it is intentionally not wired to the classifier.
9. ❌ **PROHIBITED: "Passing test suites constitutes a universal mathematical proof of soundness."**  
   * **Reality:** Passing automated unit tests validates the implementation over tested finite inputs and registered catalog settings. It is not an unbounded formal proof over infinite mathematical domains.
10. ❌ **PROHIBITED: "FSS recognizes space groups under arbitrary change of basis ($GL_3(\mathbb{Z})$)."**  
    * **Reality:** General affine basis change (e.g., lattice reduction via Niggli or Delaunay) is not implemented in the classifier. Operations must be provided in the conventional coordinate orientation of the registered setting.
11. ❌ **PROHIBITED: "STL V1 conjugacy verification proves that a matrix set forms a mathematical group."**  
    * **Reality:** Status `CONJUGACY_VERIFIED` in `core/stl/` confirms strictly the algebraic identity $g' = P^{-1} g P$ for the supplied matrix list. It does *not* verify closure under multiplication, existence of inverses, identity element existence, or group associativity.
12. ❌ **PROHIBITED: "STL V1 automatically discovers the basis transformation matrix $P$."**  
    * **Reality:** Matrix $P$ must be explicitly provided by the caller and must be invertible ($\det P \neq 0$). Automated discovery of $P$ between arbitrary matrix representations is `NOT_IMPLEMENTED`.
13. ❌ **PROHIBITED: "STL V1 or FSSPack operates on arbitrary matrix dimensions."**  
    * **Reality:** STL V1 strictly enforces `MatrixDim = 2 | 3`. FSSPack V1.0 strictly enforces 3D crystallographic space group operations ($3 \times 3$ matrices and 3-component translation vectors).
14. ❌ **PROHIBITED: "Gemmi CLI is available for live execution in the current environment."**  
    * **Reality:** The Python `gemmi` package is not installed in the execution container. Ingestion is verified against the static benchmark file `data/crystallography/gemmi_benchmark_4.json`.

---

## 2. Technical Gaps & Implementation Status Matrix

| Capability / Subsystem | Implementation Status | Current Behavior / Impact | Target Resolution |
|:---|:---:|:---|:---|
| **Full 230 Space Group Catalog** | `NOT_IMPLEMENTED` (8/230 in Stand 1) | Queries outside 8 catalog settings return `NO_CANDIDATES` in Stand 1. | Ingest full ITA Volume A data tables (Phase 6). |
| **SG 76 ($P4_1$) in Stand 1** | `REGISTERED_EXCLUDED_FROM_CLASSIFIER` | SG 76 exists in `core/registry.ts`, but absent from `REGISTERED_SETTING_IDS`; returns `NO_CANDIDATES`. | Reconcile benchmark artifact and add to `REGISTERED_SETTING_IDS`. |
| **Stand 2 Vault UI** | `NOT_IMPLEMENTED` | Stand 2 workspace and Local Vault are fully implemented in code (`core/fsspack/stand2_workspace.ts`), but lack a web GUI. | Build React component for uploading and managing `.fsspack` packages in Stand 2. |
| **Classifier UI Tab Exposure** | `PARTIALLY_EXPOSED_API` | `/api/classify` implemented in `server.ts`; `ClassifierUI` exists; UI navigation switcher in `App.tsx` unexposed. | Add tab-based navigation switcher in `App.tsx`. |
| **Dynamic Group Closure** | `ISOLATED_MODULE_TESTED` (GCL-01) | T1–T15 pass in `core/group_closure.test.ts`. Module is unwired from matcher and API. | Architectural decision on matcher pipeline integration. |
| **Continuous Origin Shift Solver** | `NOT_IMPLEMENTED` (1 discrete shift) | Non-standard origin choices cannot be mapped automatically. | Rational linear programming solver for origin shifts. |
| **Lattice Reduction ($GL_3(\mathbb{Z})$)** | `NOT_IMPLEMENTED` | Non-conventional cell orientations evaluate to `OPERATION_MISMATCH`. | Implement Delaunay/Gruber lattice reduction. |
| **Gemmi Python CLI Tooling** | `STATIC_BENCHMARK_ONLY` | Dynamic Python scripts cannot run without `pip install gemmi`. | Package container with Python 3 + Gemmi CLI for offline catalog generation. |

---

## 3. Discrepancy & Epistemic Audit: Space Group 76 ($P4_1$)

The status of Space Group 76 ($P4_1$) serves as a case study in system boundaries:

1. **In Stand 1:**
   - Defined under `groupNumber: 76`, `settingId: "P41"` in `core/registry.ts` with 4 operations ($C_4$ screw rotations with translations $w_z \in \{0, 1/4, 1/2, 3/4\}$).
   - Omitted from `REGISTERED_SETTING_IDS` in `core/operation_set_match.ts`.
   - Any query presenting $P4_1$ operations to Stand 1 evaluates to `NO_CANDIDATES`.
2. **In Stand 2:**
   - Evaluated as an external candidate packaged via `data/packages/P41_SG76.fsspack`.
   - Gatekeeper verifies unimodularity, group closure mod $\mathbb{Z}^3$, identity, and screw pitch.
   - Upon explicit activation (`stand2.activateSetting('P41')`), Stand 2's classifier evaluates $P4_1$ operations to `EXACT_MATCH`.
   - Discrimination against left-handed enantiomorph $P4_3$ (SG 78) is algebraically verified.
   - Stand 1 remains completely unmodified throughout this process.
