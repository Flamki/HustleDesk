# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

### Added
- GitHub Actions CI workflow for type-check and production build.
- Professional documentation set (architecture, API, deployment, security, runbook).
- Vercel env template and import script.
- Upstash-backed global rate limiting on expensive endpoints.

### Changed
- Build and bundle performance optimizations for faster startup.
- Public site API caching behavior.

## [0.1.0] - 2026-02-17

### Added
- Initial public release with core product modules:
  - Auth and profile bootstrap
  - Jobs, dashboard, analytics and clients
  - Time tracking and share links
  - Marketing campaigns and website builders (portfolio + link in bio)
  - Public site rendering and events
  - Stripe billing and invoices
