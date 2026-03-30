export type Gender = 'male' | 'female' | 'unspecified';
export type Language = 'es' | 'en' | 'pt' | 'fr';
export type LanguageSkill = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: string;
  email: string;
  password?: string;
  username: string;
  userNumber: number;
  firstName: string;
  lastName: string;
  avatar?: string;
  gender: Gender;
  language: Language;
  languageSkill: LanguageSkill;
  university: string;
  career: string;
  semester: number;
  phone?: string;
  birthDate?: string;
  bio?: string;
  provider: 'email' | 'google';
  emailVerified: boolean;
  isBanned: boolean;
  isAdmin: boolean;
  role?: string;
  tosAcceptedAt?: string;
  onboardingCompleted: boolean;
  theme?: string;
  subscriptionStatus?: string;
  trialStartedAt?: string;
  subscriptionExpiresAt?: string;
  createdAt: string;
  lastLogin: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'csv' | 'image' | 'other';
  path: string;
  size: number;
  uploadedAt: string;
  processed: boolean;
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  projectId: string;
}

export interface StudyGuide {
  id: string;
  projectId: string;
  title: string;
  content: string;
  sections: StudySection[];
  createdAt: string;
}

export interface StudySection {
  title: string;
  content: string;
  keyPoints: string[];
  formulas?: string[];
}

export interface Quiz {
  id: string;
  projectId: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  nextReview: string;
  interval: number;
  ease: number;
}

export interface Notification {
  id: string;
  type: 'new_assignment' | 'deadline' | 'new_material' | 'grade' | 'reminder';
  title: string;
  message: string;
  projectId?: string;
  read: boolean;
  createdAt: string;
}

// ─── Messaging Types ───────────────────────────────────────────

export interface UserBrief {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  userNumber: number;
  role?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group_study';
  name: string;
  description: string;
  avatar: string;
  participants: UserBrief[];
  lastMessage: ConversationMessage | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: UserBrief | null;
  content: string;
  messageType: 'text' | 'document' | 'system';
  documentName?: string;
  documentPath?: string;
  isDeleted: boolean;
  isFlagged: boolean;
  createdAt: string;
  editedAt?: string;
}

export interface ConversationFolder {
  id: string;
  name: string;
  conversationIds: string[];
}

// ─── Admin Types ───────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  unverifiedUsers: number;
  totalMessages: number;
  flaggedMessages: number;
  totalConversations: number;
  totalFriendships: number;
  totalWallPosts: number;
  totalReports: number;
  pendingReports: number;
  totalBlocks: number;
}

// ─── Gamification Types ─────────────────────────────────────────

export interface GamificationStats {
  xp: number;
  level: number;
  streakDays: number;
  badges: Badge[];
  nextLevelXp: number;
  leaderboard: LeaderboardEntry[];
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  xp: number;
  level: number;
}
