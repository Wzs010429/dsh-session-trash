# Changelog

All notable changes to this project are documented here.

## 0.13.0 - 2026-08-16

### Added

- Expiry countdowns, status filters, sorting, multi-select restore/export/purge, and richer trash statistics.
- Dependency-free ZIP backup export for individual sessions and cascade batches.
- Optional export-before-permanent-delete policy.
- Metadata-only audit history for delete, restore, export, settings, automatic cleanup, and permanent deletion.
- Storage warning thresholds, largest-session visibility, and safe cleanup actions for expired or stopped sessions.
- Host capability diagnostics with one-click copy from the panel.
- GitHub Actions verification on Node.js 20 and 22.

### Changed

- Settings schema upgraded to v3 while retaining v1/v2 and legacy browser compatibility.
- Failed purge reasons are persisted and crash-interrupted purges remain explicitly retryable.
- The panel is wider and uses responsive native Harness theme tokens for the expanded management controls.

## 0.10.0 - 2026-08-16

- Added shutdown, 7-day, 30-day, and keep-forever retention policies.
- Added runtime expiry sweeps and orphan subagent-summary filtering.

## 0.9.0 - 2026-08-16

- Added optional subagent-descendant cascade deletion and batch undo/restore.
