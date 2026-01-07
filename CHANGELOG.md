# Changelog

All notable changes to the MOBA Esports Data Entry App will be documented in this file.

## [1.1.0] - 2026-01-07

### Changed
- **Sidebar mode**: Changed from modal to sidebar (no X close button) to prevent encoders from exiting
- **Auto row number**: Row # is now auto-determined on save, removed manual input
- **Battle ID validation**: Checks for duplicate Battle IDs before proceeding to step 2

---

## [1.0.0] - 2026-01-07

### Added
- `Code.gs` - Backend Google Apps Script
  - Login system with Admin/Encoder roles
  - Auto-launch modal on sheet open
  - Analytics: Total games, win rates, avg duration
  - 118-column data processing matching CSV structure
- `Index.html` - Frontend Interface
  - Bootstrap 5 dark gaming theme
  - 3-step data entry form (Match Info → Team Draft → Player Stats)
  - Accordion sections for 5 roles per team
  - Real-time analytics dashboard
- `context.md` - Session context tracker
- `CHANGELOG.md` - This file

---

## Version History Format

### [Version] - YYYY-MM-DD
**Added** - New features  
**Changed** - Changes in existing functionality  
**Fixed** - Bug fixes  
**Removed** - Removed features  
