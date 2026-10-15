# Fedorov Symmetry Stand (FSS) Documentation

Welcome to the canonical documentation suite of the **Fedorov Symmetry Stand (FSS)** — a deterministic theoretical research environment for crystallographic symmetry analysis.

## Conceptual Framework: The Three Tiers
The documentation reflects the three conceptual tiers of the stand (as an organizing architectural model, not a single monolithic engine):
1. **Crystallographic Reference Catalog:** Passive normative data ([`PROJECT_PASSPORT.md`](PROJECT_PASSPORT.md), [`MATHEMATICAL_MODEL.md`](MATHEMATICAL_MODEL.md)).
2. **Deterministic Computing Core:** Exact rational arithmetic, affine geometry, and standalone algorithms ([`ARCHITECTURE.md`](ARCHITECTURE.md), [`../core/stl/README.md`](../core/stl/README.md)).
3. **Experimental Research Stand:** Interactive geometry, algebraic conjugacy, and classification ([`CLASSIFIER_CONTRACT.md`](CLASSIFIER_CONTRACT.md), [`LIMITATIONS.md`](LIMITATIONS.md)).

## Core Documentation
- [Project Passport](PROJECT_PASSPORT.md) — System mission, conceptual tiers, and epistemic boundaries
- [System Architecture](ARCHITECTURE.md) — Tier topology, directory layout, and data flow pipelines
- [Mathematical Model](MATHEMATICAL_MODEL.md) — Formal equations, rational arithmetic, invariants, and origin shifts
- [Classifier Contract](CLASSIFIER_CONTRACT.md) — Normative classifier verdicts, state transitions, and error handling
- [Known Limitations & Epistemic Boundaries](LIMITATIONS.md) — Prohibited claims, technical gaps, and test breakdown

## Specialized Modules & Specifications
- [STL V1 Module Passport](../core/stl/README.md) — Symmetry Transformation Lab: exact matrix conjugacy ($g' = P^{-1} g P$)

## Engineering & Verification Status
- [Engineering Roadmap](ROADMAP.md) — Phase history (Phases 5A through 5G STL V1, Phase 6 planned)
- [Testing Strategy & Harness Status](TESTING.md) — Test breakdown and execution results
- [Integration History](INTEGRATION_HISTORY.md) — Detailed provenance and assimilation records
- [Current System Status](../STATUS.md) — Component status matrix and execution verification

## Historical Analysis Reports
- [`analysis/`](analysis/) — Archive of Phase 4A–4E and Phase 5B–5E analytical and verification reports

