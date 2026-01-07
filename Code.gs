/**
 * MCC Data Entry App - Google Apps Script Backend
 * Handles login, data processing, and analytics for MOBA esports match data
 */

// ============ CONFIGURATION ============
const CONFIG = {
  SHEETS: {
    DB: 'DB',
    ADMIN_USERS: 'Admin_Users'
  },
  ROLES: {
    ENCODER: 'Encoder',
    ADMIN: 'Admin'
  }
};

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
 * Shows the full-screen sidebar (no X button to close)
 */
function showLoginModal() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('MCC Data Entry App');
  
  SpreadsheetApp.getUi().showSidebar(html);
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
 * Gets summary statistics for the analytics dashboard
 * @returns {Object} Summary data
 */
function getSummaryData() {
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
    
    // Winner is in column 118 (index 117)
    // Duration is in column 117 (index 116)
    for (let i = 1; i < data.length; i++) {
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
