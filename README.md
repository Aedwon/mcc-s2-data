# MCC Data Entry App

A Google Apps Script solution for MOBA esports match data entry with a secure, full-screen dashboard interface.

## Features

- **Login System**: Role-based access (Encoder vs Admin)
- **Analytics Dashboard**: Total games, win rates, average game duration
- **3-Step Data Entry Form**: 
  - Match Info (Stage, Match #, Battle ID, Duration, Winner)
  - Team Draft (Blue/Red Ban/Pick sequence)
  - Player Stats (5 roles × 9 stats per team)
- **118-Column Support**: Matches existing CSV data structure
- **Bootstrap 5 Dark Theme**: Gaming/esports aesthetic

## Deployment

1. Create a new Google Sheet
2. Go to **Extensions → Apps Script**
3. Replace `Code.gs` content with provided file
4. Create new file `Index.html`, paste content
5. Save and refresh the Google Sheet

## Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| encoder | encoder123 | Encoder |

## File Structure

```
├── Code.gs          # Backend: login, analytics, data processing
├── Index.html       # Frontend: Bootstrap 5 dark theme UI
├── context.md       # Project context tracker
├── CHANGELOG.md     # Version history
└── MCC Data Summarizer - DB.csv  # Sample data reference
```

## License

MIT
