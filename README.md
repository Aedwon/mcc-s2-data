# MCC Data Entry & Analytics Platform

A purpose built Google Apps Script application designed for high fidelity data entry and real time analytics of MOBA esports matches. This tool replaces manual spreadsheet entry with a robust, full screen web interface backed by a 118 column database schema.

## Key Features

### Advanced Data Entry
*   **Three Step Wizard**: Logical flow separating Match Info, Draft Phase, and Team Performance stats to reduce cognitive load during entry.
*   **Smart Autocomplete**: Dynamic player name suggestions derived from historical database entries to prevent duplicates and naming inconsistencies.
*   **Draft Validation**: Real time checking of hero picks or bans prevents duplicate selections within a single match.
*   **Battle ID Verification**: Automated pre check against the database prevents duplicate match submissions.

### Comprehensive Analytics Dashboard
*   **Real Time Aggregation**: Instant calculation of statistics across all recorded matches without manual formula maintenance.
*   **Stage Filtering**: Ability to filter all analytics metrics by specific tournament stages (e.g. Playoffs, Group Stage) or view aggregate data across all stages.
*   **Player Statistics**: Detailed tracking of Kills, Deaths, Assists, Gold Per Minute (GPM), and Win Rates per player, with search and sort capabilities.
*   **Hero Meta Analysis**: Automated tracking of Pick Rates, Ban Rates, Win Rates, and average KDA for every hero in the pool.
*   **Draft Analytics**: Win rate analysis based on Pick Order (First Pick vs Second Pick) to identify side advantages.

### User Experience Enhancements
*   **Sticky Headers**: Table headers remain fixed at the top of the viewport when scrolling through large datasets, maintaining context for every column.
*   **Visual Data Bars**: Tables include color coded horizontal bars behind percentage values (Win Rate, Pick Rate) for rapid visual scanning of high and low performers.
*   **Toast Notifications**: Non intrusive success and error messages appear at the bottom of the screen, providing feedback without interrupting the user workflow.
*   **Keyboard Navigation**: Full support for Arrow Keys and Enter to navigate and select options within hero dropdown menus.
*   **Dark Mode UI**: High contrast, esports inspired dark theme designed to reduce eye strain and comply with standard web accessibility guidelines.

## Project Structure

*   **Code.gs (Backend)**
    *   Handles server side logic and Google Sheets integration.
    *   Manages secure authentication with role based access control (Admin/Encoder).
    *   Performs complex data aggregation for the analytics dashboard.
    *   Exposes API endpoints for frontend data fetching and submission.

*   **Index.html (Frontend)**
    *   A Single Page Application (SPA) interface.
    *   Built with Bootstrap 5 for responsive layout and custom CSS for theming.
    *   Uses Vanilla JavaScript for state management, DOM manipulation, and server communication.

## Deployment

1.  Create a new Google Spreadsheet to serve as the database.
2.  Navigate to **Extensions > Apps Script** in the top menu.
3.  Copy the contents of `Code.gs` into the script editor's code file.
4.  Create a new HTML file named `Index.html` in the script editor and paste the frontend code.
5.  Deploy the project as a Web App:
    *   **Execute as**: Me
    *   **Who has access**: Anyone (or restricted as needed)

## Database Schema

The application interfaces with a specific 118 column schema structure:
*   **Columns 1 to 5**: Match Metadata (Stage, Match Number, Battle ID, Duration, Winner).
*   **Columns 6 to 25**: Ban and Pick Sequence (Blue/Red teams).
*   **Columns 26 to 115**: Detailed Player Stats (10 players x 9 metrics each).
*   **Columns 116 to 118**: Game Result Metadata (Winner, Duration raw).

## Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| encoder | encoder123 | Encoder |

## License

MIT
