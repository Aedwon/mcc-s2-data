/**
 * MCC Data Entry App - Google Apps Script Backend
 * Handles login, data processing, and analytics for MOBA esports match data
 */

// ============ CONFIGURATION ============
const CONFIG = {
  SHEETS: {
    DB: 'DB',
    ADMIN_USERS: 'Admin_Users',
    HEROES: 'Heroes'
  },
  ROLES: {
    ENCODER: 'Encoder',
    ADMIN: 'Admin'
  }
};

// ============ HERO DATA ============

/**
 * Gets the list of heroes from the Heroes sheet
 * Extracts icon URLs from IMAGE() formulas if present
 * @returns {Array} Array of {code, name, icon} objects, sorted alphabetically
 */
function getHeroesList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const heroSheet = ss.getSheetByName(CONFIG.SHEETS.HEROES);
    
    if (!heroSheet) {
      console.log('Heroes sheet not found');
      return [];
    }
    
    const lastRow = heroSheet.getLastRow();
    if (lastRow <= 1) {
      console.log('Heroes sheet is empty');
      return [];
    }
    
    const range = heroSheet.getRange(2, 1, lastRow - 1, 3);
    const values = range.getValues();
    const formulas = range.getFormulas();
    
    const heroes = values
      .map((row, i) => {
        let iconUrl = '';
        
        // Check if column C has an IMAGE formula - extract URL from it
        const formula = formulas[i][2];
        if (formula && formula.toUpperCase().includes('IMAGE')) {
          // Extract URL from =IMAGE("url") or =IMAGE(url)
          const match = formula.match(/IMAGE\s*\(\s*["']?([^"')]+)["']?/i);
          if (match) {
            iconUrl = match[1];
          }
        } else if (row[2] && typeof row[2] === 'string' && row[2].startsWith('http')) {
          // Direct URL in cell
          iconUrl = row[2];
        }
        
        return {
          code: row[0] ? row[0].toString() : '',
          name: row[1] ? row[1].toString() : '',
          icon: iconUrl
        };
      })
      .filter(hero => hero.name) // Filter out empty rows
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('Loaded heroes:', heroes.length);
    return heroes;
  } catch (error) {
    console.error('getHeroesList error:', error);
    return [];
  }
}

// ============ TRIGGERS & MENU ============

/**
 * Runs when spreadsheet opens - launches login modal and creates menu
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('App Admin')
    .addItem('Launch Interface', 'showLoginModal')
    .addToUi();
  
  // Auto-launch login modal
  showLoginModal();
}

/**
 * Shows the full-screen modal dialog
 * Note: Modal has X button but auto-launches on open, so closing just shows the sheet temporarily
 */
function showLoginModal() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
    .setWidth(1400)
    .setHeight(900)
    .setTitle('MCC Data Entry App');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'MCC Data Entry App');
}

// ============ AUTHENTICATION ============

/**
 * Validates user login credentials
 * @param {string} username 
 * @param {string} password 
 * @returns {Object} {success: boolean, role: string, message: string}
 */
function validateLogin(username, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let adminSheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN_USERS);
    
    // Initialize Admin_Users sheet if it doesn't exist
    if (!adminSheet) {
      adminSheet = ss.insertSheet(CONFIG.SHEETS.ADMIN_USERS);
      adminSheet.appendRow(['Username', 'Password', 'Role']);
      adminSheet.appendRow(['admin', 'admin123', 'Admin']);
      adminSheet.appendRow(['encoder', 'encoder123', 'Encoder']);
      adminSheet.hideSheet();
    }
    
    const data = adminSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username && data[i][1] === password) {
        return {
          success: true,
          role: data[i][2],
          username: username,
          message: 'Login successful'
        };
      }
    }
    
    return { success: false, role: null, message: 'Invalid username or password' };
  } catch (error) {
    return { success: false, role: null, message: 'Error: ' + error.message };
  }
}

/**
 * Unhides backend sheets for admin users
 */
function unlockSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  sheets.forEach(sheet => {
    if (sheet.isSheetHidden()) {
      sheet.showSheet();
    }
  });
  
  return { success: true, message: 'Sheets unlocked' };
}

// ============ DATA FUNCTIONS ============

/**
 * Gets unique stages from the database for filtering
 * @returns {Array} Array of stage names sorted alphabetically
 */
function getStages() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) return [];
    
    const data = dbSheet.getRange(2, 2, dbSheet.getLastRow() - 1, 1).getValues();
    const stages = new Set();
    
    data.forEach(row => {
      if (row[0] && row[0].toString().trim()) {
        stages.add(row[0].toString().trim());
      }
    });
    
    return Array.from(stages).sort();
  } catch (error) {
    console.error('getStages error:', error);
    return [];
  }
}

/**
 * Gets unique player names from the database for autocomplete
 * @returns {Array} Array of player names sorted alphabetically
 */
function getPlayerNames() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) return [];
    
    // Get all data to iterate through player columns
    const data = dbSheet.getDataRange().getValues();
    const players = new Set();
    
    // Player columns
    const blueRoles = ROLE_COLUMNS.blue;
    const redRoles = ROLE_COLUMNS.red;
    
    for (let i = 1; i < data.length; i++) {
      // Check blue team players
      Object.values(blueRoles).forEach(cols => {
        const name = data[i][cols.player];
        if (name && name.toString().trim()) {
          players.add(name.toString().trim());
        }
      });
      
      // Check red team players
      Object.values(redRoles).forEach(cols => {
        const name = data[i][cols.player];
        if (name && name.toString().trim()) {
          players.add(name.toString().trim());
        }
      });
    }
    
    return Array.from(players).sort();
  } catch (error) {
    console.error('getPlayerNames error:', error);
    return [];
  }
}

/**
 * Gets summary statistics for the analytics dashboard
 * @param {string} stageFilter Optional stage to filter by (empty or 'All' = no filter)
 * @returns {Object} Summary data
 */
function getSummaryData(stageFilter) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) {
      return {
        totalGames: 0,
        blueWins: 0,
        redWins: 0,
        blueWinRate: 0,
        redWinRate: 0,
        avgDuration: '0:00'
      };
    }
    
    const data = dbSheet.getDataRange().getValues();
    let totalGames = 0;
    let blueWins = 0;
    let redWins = 0;
    let totalDurationSeconds = 0;
    
    const filterStage = stageFilter && stageFilter !== 'All' ? stageFilter : null;
    
    for (let i = 1; i < data.length; i++) {
      const stage = data[i][1];  // Column 2 - Stage
      
      // Apply stage filter if specified
      if (filterStage && stage !== filterStage) continue;
      
      const winner = data[i][117]; // Column 118 - Winner
      const duration = data[i][116]; // Column 117 - Game Duration
      
      if (winner) {
        totalGames++;
        if (winner.toString().toLowerCase() === 'blue') {
          blueWins++;
        } else if (winner.toString().toLowerCase() === 'red') {
          redWins++;
        }
      }
      
      // Parse duration (format: "MM:SS" or "H:MM:SS")
      if (duration) {
        const durationStr = duration.toString();
        const parts = durationStr.split(':');
        if (parts.length === 2) {
          totalDurationSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else if (parts.length === 3) {
          totalDurationSeconds += parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
      }
    }
    
    const avgSeconds = totalGames > 0 ? Math.round(totalDurationSeconds / totalGames) : 0;
    const avgMinutes = Math.floor(avgSeconds / 60);
    const avgSecs = avgSeconds % 60;
    
    return {
      totalGames: totalGames,
      blueWins: blueWins,
      redWins: redWins,
      blueWinRate: totalGames > 0 ? Math.round((blueWins / totalGames) * 100) : 0,
      redWinRate: totalGames > 0 ? Math.round((redWins / totalGames) * 100) : 0,
      avgDuration: avgMinutes + ':' + (avgSecs < 10 ? '0' : '') + avgSecs
    };
  } catch (error) {
    console.error('getSummaryData error:', error);
    return { error: error.message };
  }
}

/**
 * Gets the last N matches for display
 * @param {number} count Number of matches to retrieve
 * @returns {Array} Array of match objects
 */
function getLastMatches(count) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) {
      return [];
    }
    
    const data = dbSheet.getDataRange().getValues();
    const matches = [];
    
    // Start from the end, go backwards
    const startRow = Math.max(1, data.length - count);
    
    for (let i = data.length - 1; i >= startRow; i--) {
      matches.push({
        rowNum: data[i][0],       // Column 1 - #
        stage: data[i][1],        // Column 2 - Stage
        match: data[i][2],        // Column 3 - Match
        battleId: data[i][3],     // Column 4 - Battle ID
        blueTeam: data[i][4],     // Column 5 - Blue Team
        redTeam: data[i][60],     // Column 61 - Red Team
        winner: data[i][117],     // Column 118 - Winner
        duration: data[i][116]    // Column 117 - Game Duration
      });
    }
    
    return matches;
  } catch (error) {
    console.error('getLastMatches error:', error);
    return [];
  }
}

/**
 * Gets the next row number for new entries
 * @returns {number} Next available row number
 */
function getNextRowNumber() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) {
      return 1;
    }
    
    const lastRow = dbSheet.getLastRow();
    const lastNum = dbSheet.getRange(lastRow, 1).getValue();
    
    return (parseInt(lastNum) || 0) + 1;
  } catch (error) {
    return 1;
  }
}

/**
 * Checks if a Battle ID already exists in the database
 * @param {string} battleId The Battle ID to check
 * @returns {Object} {exists: boolean, message: string}
 */
function checkBattleIdExists(battleId) {
  try {
    if (!battleId || battleId.trim() === '' || battleId.toLowerCase() === 'n/a' || battleId.toLowerCase() === 'default') {
      return { exists: false, message: 'OK' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) {
      return { exists: false, message: 'OK' };
    }
    
    const data = dbSheet.getRange(2, 4, dbSheet.getLastRow() - 1, 1).getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === battleId.trim()) {
        return { exists: true, message: 'Battle ID "' + battleId + '" already exists in row ' + (i + 2) };
      }
    }
    
    return { exists: false, message: 'OK' };
  } catch (error) {
    return { exists: false, message: 'Error checking: ' + error.message };
  }
}

// ============ ADVANCED ANALYTICS ============

/**
 * Column mapping for player data extraction
 * Blue team roles start at column 16 (index 15)
 * Red team roles start at column 71 (index 70)
 */
const ROLE_COLUMNS = {
  blue: {
    gold:     { player: 15, hero: 16, kills: 17, deaths: 18, assists: 19, gold: 20 },
    jungler:  { player: 24, hero: 25, kills: 26, deaths: 27, assists: 28, gold: 29 },
    exp:      { player: 33, hero: 34, kills: 35, deaths: 36, assists: 37, gold: 38 },
    mid:      { player: 42, hero: 43, kills: 44, deaths: 45, assists: 46, gold: 47 },
    roamer:   { player: 51, hero: 52, kills: 53, deaths: 54, assists: 55, gold: 56 }
  },
  red: {
    gold:     { player: 70, hero: 71, kills: 72, deaths: 73, assists: 74, gold: 75 },
    jungler:  { player: 79, hero: 80, kills: 81, deaths: 82, assists: 83, gold: 84 },
    exp:      { player: 88, hero: 89, kills: 90, deaths: 91, assists: 92, gold: 93 },
    mid:      { player: 97, hero: 98, kills: 99, deaths: 100, assists: 101, gold: 102 },
    roamer:   { player: 106, hero: 107, kills: 108, deaths: 109, assists: 110, gold: 111 }
  }
};

// Pick columns: Blue 8-14 (indices 7-13), Red 63-69 (indices 62-68)
const PICK_COLUMNS = {
  blue: [8, 9, 10, 13, 14], // Pick1,2,3,4,5 indices
  red: [63, 64, 65, 68, 69]
};

// Ban columns: Blue 5-7,11-12, Red 60-62,66-67
const BAN_COLUMNS = {
  blue: [5, 6, 7, 11, 12], // Ban1,2,3,4,5 indices
  red: [60, 61, 62, 66, 67]
};

/**
 * Gets player statistics: KDA, winrate, GPM
 * @param {string} stageFilter Optional stage to filter by
 * @returns {Array} Array of {player, games, avgKDA, winRate, avgGPM}
 */
function getPlayerStats(stageFilter) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) return [];
    
    const data = dbSheet.getDataRange().getValues();
    const playerMap = {};
    const filterStage = stageFilter && stageFilter !== 'All' ? stageFilter : null;
    
    for (let i = 1; i < data.length; i++) {
      const stage = data[i][1];
      if (filterStage && stage !== filterStage) continue;

      const winner = data[i][117] ? data[i][117].toString().toLowerCase() : '';
      const duration = parseDuration(data[i][116]);
      
      // Process each team and role
      ['blue', 'red'].forEach(team => {
        const teamWon = winner === team;
        Object.keys(ROLE_COLUMNS[team]).forEach(role => {
          const cols = ROLE_COLUMNS[team][role];
          const playerName = data[i][cols.player];
          
          if (playerName && playerName.toString().trim()) {
            const key = playerName.toString().trim();
            if (!playerMap[key]) {
              playerMap[key] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, gold: 0, duration: 0 };
            }
            
            playerMap[key].games++;
            if (teamWon) playerMap[key].wins++;
            playerMap[key].kills += parseInt(data[i][cols.kills]) || 0;
            playerMap[key].deaths += parseInt(data[i][cols.deaths]) || 0;
            playerMap[key].assists += parseInt(data[i][cols.assists]) || 0;
            playerMap[key].gold += parseInt(data[i][cols.gold]) || 0;
            playerMap[key].duration += duration;
          }
        });
      });
    }
    
    return Object.entries(playerMap)
      .map(([player, stats]) => ({
        player,
        games: stats.games,
        avgKDA: stats.deaths > 0 
          ? ((stats.kills + stats.assists) / stats.deaths).toFixed(2)
          : (stats.kills + stats.assists).toFixed(2),
        kills: stats.kills,
        deaths: stats.deaths,
        assists: stats.assists,
        winRate: stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0,
        avgGPM: stats.duration > 0 ? Math.round(stats.gold / (stats.duration / 60)) : 0
      }))
      .sort((a, b) => b.games - a.games);
  } catch (error) {
    console.error('getPlayerStats error:', error);
    return [];
  }
}

/**
 * Gets hero statistics: pick/ban rates, winrates, KDA
 * @param {string} stageFilter Optional stage to filter by
 * @returns {Object} {heroes: Array, mostPicked: Array, mostBanned: Array}
 */
function getHeroStats(stageFilter) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) return { heroes: [], mostPicked: [], mostBanned: [] };
    
    const data = dbSheet.getDataRange().getValues();
    const heroMap = {};
    const banCount = {};
    let totalGames = 0;
    const filterStage = stageFilter && stageFilter !== 'All' ? stageFilter : null;
    
    for (let i = 1; i < data.length; i++) {
      const stage = data[i][1];
      if (filterStage && stage !== filterStage) continue;
      
      totalGames++;
      const winner = data[i][117] ? data[i][117].toString().toLowerCase() : '';
      
      // Count bans
      ['blue', 'red'].forEach(team => {
        BAN_COLUMNS[team].forEach(col => {
          const hero = data[i][col];
          if (hero && hero.toString().trim()) {
            const key = hero.toString().trim();
            banCount[key] = (banCount[key] || 0) + 1;
          }
        });
      });
      
      // Process picks and player stats
      ['blue', 'red'].forEach(team => {
        const teamWon = winner === team;
        Object.keys(ROLE_COLUMNS[team]).forEach(role => {
          const cols = ROLE_COLUMNS[team][role];
          const heroName = data[i][cols.hero];
          
          if (heroName && heroName.toString().trim()) {
            const key = heroName.toString().trim();
            if (!heroMap[key]) {
              heroMap[key] = { picks: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
            }
            
            heroMap[key].picks++;
            if (teamWon) heroMap[key].wins++;
            heroMap[key].kills += parseInt(data[i][cols.kills]) || 0;
            heroMap[key].deaths += parseInt(data[i][cols.deaths]) || 0;
            heroMap[key].assists += parseInt(data[i][cols.assists]) || 0;
          }
        });
      });
    }
    
    const heroes = Object.entries(heroMap)
      .map(([hero, stats]) => ({
        hero,
        picks: stats.picks,
        bans: banCount[hero] || 0,
        pickRate: totalGames > 0 ? Math.round((stats.picks / totalGames) * 100) : 0,
        banRate: totalGames > 0 ? Math.round(((banCount[hero] || 0) / totalGames) * 100) : 0,
        winRate: stats.picks > 0 ? Math.round((stats.wins / stats.picks) * 100) : 0,
        avgKDA: stats.deaths > 0 
          ? ((stats.kills + stats.assists) / stats.deaths).toFixed(2)
          : (stats.kills + stats.assists).toFixed(2)
      }))
      .sort((a, b) => b.picks - a.picks);
    
    const mostPicked = [...heroes].slice(0, 10);
    const mostBanned = Object.entries(banCount)
      .map(([hero, bans]) => ({ hero, bans, banRate: Math.round((bans / totalGames) * 100) }))
      .sort((a, b) => b.bans - a.bans)
      .slice(0, 10);
    
    return { heroes, mostPicked, mostBanned };
  } catch (error) {
    console.error('getHeroStats error:', error);
    return { heroes: [], mostPicked: [], mostBanned: [] };
  }
}

/**
 * Gets draft analytics: first/second pick winrates
 * @param {string} stageFilter Optional stage to filter by
 * @returns {Object} {firstPickWinRate, secondPickWinRate, totalGames}
 */
function getDraftAnalytics(stageFilter) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    if (!dbSheet || dbSheet.getLastRow() <= 1) {
      return { firstPickWinRate: 0, secondPickWinRate: 0, totalGames: 0, blueWins: 0, redWins: 0 };
    }
    
    const data = dbSheet.getDataRange().getValues();
    let totalGames = 0, blueWins = 0, redWins = 0;
    const filterStage = stageFilter && stageFilter !== 'All' ? stageFilter : null;
    
    for (let i = 1; i < data.length; i++) {
      const stage = data[i][1];
      if (filterStage && stage !== filterStage) continue;

      const winner = data[i][117] ? data[i][117].toString().toLowerCase() : '';
      if (winner === 'blue' || winner === 'red') {
        totalGames++;
        if (winner === 'blue') blueWins++;
        if (winner === 'red') redWins++;
      }
    }
    
    // In MLBB draft: Blue = First Pick, Red = Second Pick
    return {
      firstPickWinRate: totalGames > 0 ? Math.round((blueWins / totalGames) * 100) : 0,
      secondPickWinRate: totalGames > 0 ? Math.round((redWins / totalGames) * 100) : 0,
      totalGames,
      blueWins,
      redWins
    };
  } catch (error) {
    console.error('getDraftAnalytics error:', error);
    return { firstPickWinRate: 0, secondPickWinRate: 0, totalGames: 0 };
  }
}

/**
 * Helper function to parse duration string to seconds
 */
function parseDuration(duration) {
  if (!duration) return 0;
  const str = duration.toString();
  const parts = str.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

// ============ FORM PROCESSING ============

/**
 * Processes and saves form data to the DB sheet
 * @param {Object} formData Form data from the frontend
 * @param {string} encoderUsername Username of the encoder
 * @returns {Object} Result object
 */
function processForm(formData, encoderUsername) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let dbSheet = ss.getSheetByName(CONFIG.SHEETS.DB);
    
    // Create DB sheet with headers if it doesn't exist
    if (!dbSheet) {
      dbSheet = ss.insertSheet(CONFIG.SHEETS.DB);
      dbSheet.appendRow(getColumnHeaders());
    }
    
    // Auto-determine the row number
    const autoRowNum = getNextRowNumber();
    formData.matchInfo.rowNum = autoRowNum;
    
    // Build the row array matching the 118-column structure
    const row = buildRowFromFormData(formData);
    
    // Append the row
    dbSheet.appendRow(row);
    
    // Log the submission
    console.log('Match submitted by:', encoderUsername, 'at', new Date());
    
    return { 
      success: true, 
      message: 'Match saved successfully!',
      rowNumber: autoRowNum
    };
  } catch (error) {
    console.error('processForm error:', error);
    return { success: false, message: 'Error saving match: ' + error.message };
  }
}

/**
 * Builds a row array from form data matching the 118-column structure
 * @param {Object} formData 
 * @returns {Array} Row data
 */
function buildRowFromFormData(formData) {
  const row = [];
  const mi = formData.matchInfo;
  const blue = formData.blueTeam;
  const red = formData.redTeam;
  
  // Columns 1-4: Match Info
  row.push(mi.rowNum);      // 1: #
  row.push(mi.stage);       // 2: Stage
  row.push(mi.match);       // 3: Match
  row.push(mi.battleId);    // 4: Battle ID
  
  // Columns 5-15: Blue Team Draft
  row.push(blue.teamName);  // 5: Blue Team
  row.push(blue.ban1);      // 6: Ban 1
  row.push(blue.ban2);      // 7: Ban 2
  row.push(blue.ban3);      // 8: Ban 3
  row.push(blue.pick1);     // 9: Pick 1
  row.push(blue.pick2);     // 10: Pick 2
  row.push(blue.pick3);     // 11: Pick 3
  row.push(blue.ban4);      // 12: Ban 4
  row.push(blue.ban5);      // 13: Ban 5
  row.push(blue.pick4);     // 14: Pick 4
  row.push(blue.pick5);     // 15: Pick 5
  
  // Columns 16-60: Blue Team Player Stats (5 roles x 9 stats each = 45)
  const blueRoles = ['gold', 'jungler', 'exp', 'mid', 'roamer'];
  blueRoles.forEach(role => {
    const player = blue.players[role];
    row.push(player.name);      // Player
    row.push(player.hero);      // Hero
    row.push(player.kills);     // Kills
    row.push(player.deaths);    // Deaths
    row.push(player.assists);   // Assists
    row.push(player.gold);      // Gold
    row.push(player.damage);    // Damage
    row.push(player.turret);    // Turret
    row.push(player.dmgTaken);  // Dmg Taken
  });
  
  // Columns 61-71: Red Team Draft
  row.push(red.teamName);   // 61: Red Team
  row.push(red.ban1);       // 62: Ban 1
  row.push(red.ban2);       // 63: Ban 2
  row.push(red.ban3);       // 64: Ban 3
  row.push(red.pick1);      // 65: Pick 1
  row.push(red.pick2);      // 66: Pick 2
  row.push(red.pick3);      // 67: Pick 3
  row.push(red.ban4);       // 68: Ban 4
  row.push(red.ban5);       // 69: Ban 5
  row.push(red.pick4);      // 70: Pick 4
  row.push(red.pick5);      // 71: Pick 5
  
  // Columns 72-116: Red Team Player Stats (5 roles x 9 stats each = 45)
  const redRoles = ['gold', 'jungler', 'exp', 'mid', 'roamer'];
  redRoles.forEach(role => {
    const player = red.players[role];
    row.push(player.name);
    row.push(player.hero);
    row.push(player.kills);
    row.push(player.deaths);
    row.push(player.assists);
    row.push(player.gold);
    row.push(player.damage);
    row.push(player.turret);
    row.push(player.dmgTaken);
  });
  
  // Columns 117-118: Game Duration & Winner
  row.push(mi.duration);    // 117: Game Duration
  row.push(mi.winner);      // 118: Winner
  
  return row;
}

/**
 * Returns column headers matching the CSV structure
 * @returns {Array} Header row
 */
function getColumnHeaders() {
  const headers = [
    '#', 'Stage', 'Match', 'Battle ID',
    'Blue Team', 'Ban 1', 'Ban 2', 'Ban 3', 'Pick 1', 'Pick 2', 'Pick 3', 'Ban 4', 'Ban 5', 'Pick 4', 'Pick 5'
  ];
  
  // Blue team player headers
  const roles = ['Gold', 'Jungler', 'EXP Laner', 'Mid Laner', 'Roamer'];
  const stats = ['Player', 'Hero', 'Kills', 'Deaths', 'Assists', 'Gold', 'Damage', 'Turret', 'Dmg Taken'];
  
  roles.forEach(role => {
    stats.forEach(stat => {
      headers.push(role + ' ' + stat);
    });
  });
  
  // Red team headers
  headers.push('Red Team', 'Ban 1', 'Ban 2', 'Ban 3', 'Pick 1', 'Pick 2', 'Pick 3', 'Ban 4', 'Ban 5', 'Pick 4', 'Pick 5');
  
  // Red team player headers
  roles.forEach(role => {
    stats.forEach(stat => {
      headers.push(role + ' ' + stat);
    });
  });
  
  // Final columns
  headers.push('Game Duration', 'Winner');
  
  return headers;
}
