# MOBA Esports Data Entry App - Context Tracker

## Project Goal
Create a robust Google Apps Script solution to transform a Google Sheet into a secure "Data Entry App" for MOBA esports match data.

## CSV Analysis (MCC Data Summarizer - DB.csv)
- **Total Columns:** 118
- **Draft Order:** Ban 1-3 → Pick 1-3 → Ban 4-5 → Pick 4-5
- **Roles:** Gold, Jungler, EXP Laner, Mid Laner, Roamer
- **Per-Role Stats (9 cols):** Player, Hero, K, D, A, Gold, Dmg, Turret, Dmg Taken

## Core Requirements

### 1. Login System
- Hidden `Admin_Users` sheet with Username, Password, Role (Encoder/Admin)
- Auto-launch full-screen modal on sheet open
- Encoder → Data Entry Dashboard | Admin → Admin Dashboard

### 2. Encoder Interface
**Analytics Dashboard:** Total Games, Win Rate, Last 5 matches
**Data Entry Form (3 Steps):**
- Step 1: Match Info (#, Stage, Match, Battle ID, Duration, Winner)
- Step 2: Team Draft (Blue/Red Ban/Pick sequence)
- Step 3: Player Stats (Accordion per role)

### 3. Technical
- Bootstrap 5 dark theme
- `google.script.run` for client-server communication

## Progress Log
- **Session Start:** Planning phase initiated
- **CSV Analyzed:** 118 columns confirmed, column mapping documented
