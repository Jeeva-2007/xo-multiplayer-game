"use client";

export interface User {
  username: string;
  password: string;
  createdAt: number;
}

export interface DetailedStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
}

export interface UserStats {
  username: string;
  total: DetailedStats;
  ai: DetailedStats;
  online: DetailedStats;
  offline: DetailedStats;
}

export interface OfflineSessionStats {
  player1Wins: number;
  player2Wins: number;
  draws: number;
  totalGames: number;
}

const USERS_KEY = "tictactoe_users";
const CURRENT_USER_KEY = "tictactoe_current_user";
const STATS_KEY = "tictactoe_stats";
const OFFLINE_SESSION_KEY = "tictactoe_offline_session";

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

export function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(username: string, password: string): { success: boolean; message: string } {
  const users = getUsers();
  
  if (username.trim().length < 3) {
    return { success: false, message: "Username must be at least 3 characters" };
  }
  
  if (password.length < 4) {
    return { success: false, message: "Password must be at least 4 characters" };
  }
  
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: "Username already exists" };
  }
  
  const newUser: User = {
    username: username.trim(),
    password,
    createdAt: Date.now()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  initializeStats(username.trim());
  initializeOfflineSession();
  
  return { success: true, message: "Registration successful!" };
}

export function loginUser(username: string, password: string): { success: boolean; message: string } {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!user) {
    return { success: false, message: "User not found" };
  }
  
  if (user.password !== password) {
    return { success: false, message: "Incorrect password" };
  }
  
  if (typeof window !== "undefined") {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ username: user.username, loginTime: Date.now() }));
  }
  
  return { success: true, message: "Login successful!" };
}

export function logoutUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getCurrentUser(): { username: string } | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

function getEmptyDetailedStats(): DetailedStats {
  return { wins: 0, losses: 0, draws: 0, totalGames: 0 };
}

export function initializeStats(username: string): void {
  if (typeof window === "undefined") return;
  
  const statsData = localStorage.getItem(STATS_KEY);
  const allStats: Record<string, UserStats> = statsData ? JSON.parse(statsData) : {};
  
  if (!allStats[username]) {
    allStats[username] = {
      username,
      total: getEmptyDetailedStats(),
      ai: getEmptyDetailedStats(),
      online: getEmptyDetailedStats(),
      offline: getEmptyDetailedStats()
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
  }
}

export function initializeOfflineSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
    player1Wins: 0,
    player2Wins: 0,
    draws: 0,
    totalGames: 0
  }));
}

export function getOfflineSessionStats(): OfflineSessionStats {
  if (typeof window === "undefined") {
    return { player1Wins: 0, player2Wins: 0, draws: 0, totalGames: 0 };
  }
  const data = localStorage.getItem(OFFLINE_SESSION_KEY);
  return data ? JSON.parse(data) : { player1Wins: 0, player2Wins: 0, draws: 0, totalGames: 0 };
}

export function updateOfflineSessionStats(winner: "player1" | "player2" | "draw"): void {
  if (typeof window === "undefined") return;
  
  const stats = getOfflineSessionStats();
  stats.totalGames++;
  
  if (winner === "player1") {
    stats.player1Wins++;
  } else if (winner === "player2") {
    stats.player2Wins++;
  } else {
    stats.draws++;
  }
  
  localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(stats));
}

export function clearOfflineSessionStats(): void {
  if (typeof window === "undefined") return;
  initializeOfflineSession();
}

export function getUserStats(username: string): UserStats {
  if (typeof window === "undefined") {
    return {
      username,
      total: getEmptyDetailedStats(),
      ai: getEmptyDetailedStats(),
      online: getEmptyDetailedStats(),
      offline: getEmptyDetailedStats()
    };
  }
  
  const statsData = localStorage.getItem(STATS_KEY);
  const allStats: Record<string, UserStats> = statsData ? JSON.parse(statsData) : {};
  
  const existingStats = allStats[username];
  
  if (!existingStats) {
    return {
      username,
      total: getEmptyDetailedStats(),
      ai: getEmptyDetailedStats(),
      online: getEmptyDetailedStats(),
      offline: getEmptyDetailedStats()
    };
  }
  
  // Check if stats are in old format (no total/ai/online/offline properties)
  if (!existingStats.total || !existingStats.ai) {
    // Migrate old format to new format
    const migratedStats: UserStats = {
      username,
      total: {
        wins: existingStats.wins || 0,
        losses: existingStats.losses || 0,
        draws: existingStats.draws || 0,
        totalGames: existingStats.totalGames || 0
      },
      ai: {
        wins: existingStats.wins || 0,
        losses: existingStats.losses || 0,
        draws: existingStats.draws || 0,
        totalGames: existingStats.totalGames || 0
      },
      online: getEmptyDetailedStats(),
      offline: getEmptyDetailedStats()
    };
    
    // Save migrated stats
    allStats[username] = migratedStats;
    localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
    
    return migratedStats;
  }
  
  return existingStats;
}

export function updateStats(username: string, result: "win" | "lose" | "draw", gameMode: "ai" | "online" | "offline"): void {
  if (typeof window === "undefined") return;
  
  const statsData = localStorage.getItem(STATS_KEY);
  const allStats: Record<string, UserStats> = statsData ? JSON.parse(statsData) : {};
  
  if (!allStats[username]) {
    allStats[username] = {
      username,
      total: getEmptyDetailedStats(),
      ai: getEmptyDetailedStats(),
      online: getEmptyDetailedStats(),
      offline: getEmptyDetailedStats()
    };
  }
  
  const updateDetailedStats = (stats: DetailedStats) => {
    stats.totalGames++;
    if (result === "win") stats.wins++;
    else if (result === "lose") stats.losses++;
    else stats.draws++;
  };
  
  updateDetailedStats(allStats[username].total);
  updateDetailedStats(allStats[username][gameMode]);
  
  localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
}

export function getAllStats(): UserStats[] {
  if (typeof window === "undefined") return [];
  
  const statsData = localStorage.getItem(STATS_KEY);
  const allStatsRaw: Record<string, any> = statsData ? JSON.parse(statsData) : {};
  
  // Migrate old format to new format if needed
  const allStats: Record<string, UserStats> = {};
  for (const [username, stats] of Object.entries(allStatsRaw)) {
    if (stats.total && stats.ai) {
      allStats[username] = stats;
    } else {
      // Old format - migrate
      allStats[username] = {
        username,
        total: {
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          draws: stats.draws || 0,
          totalGames: stats.totalGames || 0
        },
        ai: {
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          draws: stats.draws || 0,
          totalGames: stats.totalGames || 0
        },
        online: getEmptyDetailedStats(),
        offline: getEmptyDetailedStats()
      };
    }
  }
  
  // Save migrated data
  localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
  
  return Object.values(allStats).sort((a, b) => b.total.totalGames - a.total.totalGames);
}

// AI first move preference
const AI_FIRST_KEY = "tictactoe_ai_first";

export function getAiFirstPreference(): boolean {
  if (typeof window === "undefined") return false;
  const value = localStorage.getItem(AI_FIRST_KEY);
  return value === "true";
}

export function setAiFirstPreference(aiFirst: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AI_FIRST_KEY, aiFirst.toString());
}

export function toggleAiFirstPreference(): boolean {
  const current = getAiFirstPreference();
  setAiFirstPreference(!current);
  return !current;
}

// Offline first player preference
const OFFLINE_FIRST_KEY = "tictactoe_offline_first";
const OFFLINE_LAST_RESULT_KEY = "tictactoe_offline_last_result";

export function getOfflineFirstPreference(): boolean {
  if (typeof window === "undefined") return false;
  const value = localStorage.getItem(OFFLINE_FIRST_KEY);
  return value === "true";
}

export function setOfflineFirstPreference(player1First: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OFFLINE_FIRST_KEY, player1First.toString());
}

export function getOfflineLastResult(): "player1" | "player2" | "draw" | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(OFFLINE_LAST_RESULT_KEY);
  if (value === "player1" || value === "player2" || value === "draw") return value;
  return null;
}

export function setOfflineLastResult(result: "player1" | "player2" | "draw"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OFFLINE_LAST_RESULT_KEY, result);
}
