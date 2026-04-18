export type Gender = 'male' | 'female' | 'unspecified';
export type Language =
  | 'es'
  | 'en'
  | 'pt'
  | 'fr'
  | 'de'
  | 'it'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'ru'
  | 'hi'
  | 'tr'
  | 'nl'
  | 'pl'
  | 'sv'
  | 'da'
  | 'no'
  | 'fi'
  | 'el'
  | 'he'
  | 'th'
  | 'vi'
  | 'id'
  | 'ms'
  | 'tl'
  | 'uk'
  | 'cs'
  | 'ro'
  | 'hu'
  | 'ca'
  | 'hr'
  | 'bg'
  | 'sk'
  | 'sl'
  | 'lt'
  | 'lv'
  | 'et'
  | 'sw'
  | 'bn';
export type LanguageSkill = 'beginner' | 'intermediate' | 'advanced';

export type ShowcaseItemType =
  | 'article'
  | 'book'
  | 'talk'
  | 'media'
  | 'achievement'
  | 'project'
  | 'insight';

export interface ExecutiveShowcaseItem {
  id: string;
  type: ShowcaseItemType;
  title: string;
  description?: string;
  url?: string;
  date?: string; // YYYY-MM-DD
  tag?: string; // publisher, event name, media outlet, etc.
  imageUrl?: string;
}

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
  country?: string;
  countryCurrency?: string;
  birthDate?: string;
  bio?: string;
  provider: 'email' | 'google';
  emailVerified: boolean;
  isBanned: boolean;
  isAdmin: boolean;
  role?: string;
  tosAcceptedAt?: string;
  onboardingCompleted: boolean;
  secondaryLanguages?: string[];
  platformLanguage?: string;
  theme?: string;
  subscriptionStatus?: string;
  trialStartedAt?: string;
  subscriptionExpiresAt?: string;
  academicStatus?: 'estudiante' | 'egresado' | 'titulado';
  subscriptionTier?: 'free' | 'pro' | 'max';
  offersMentoring?: boolean;
  executiveShowcase?: ExecutiveShowcaseItem[];
  mentoringServices?: string[];
  mentoringSubjects?: string[];
  graduationStatusYear?: number;
  titleYear?: number;
  mentoringDescription?: string;
  mentoringPriceType?: 'free' | 'paid';
  mentoringPricePerHour?: number;
  mentoringCurrency?: string;
  professionalTitle?: string;
  rut?: string;
  studyStartDate?: string;
  studyDays?: number;
  createdAt: string;
  lastLogin: string;
}

export interface TutoringRequest {
  id: string;
  studentId: string;
  tutorId: string;
  subject: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  respondedAt?: string;
  studentName?: string;
  studentAvatar?: string;
  studentUsername?: string;
  tutorName?: string;
  tutorAvatar?: string;
  tutorUsername?: string;
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
  uploadError?: string;
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
  type: 'direct' | 'group_study' | 'message_request';
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
  replyToId?: string;
  replyToContent?: string;
  replyToSenderName?: string;
  moderationStatus?: 'approved' | 'pending' | 'rejected';
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

// ─── Calendar ──────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'task' | 'exam' | 'deadline' | 'study_session';
  dueDate: string;
  projectId?: string;
  completed: boolean;
  color: string;
}

// ─── Study Time ────────────────────────────────────────────────

export interface StudyTimeStats {
  totalSeconds: number;
  weekSeconds: number;
  monthSeconds: number;
  todaySeconds: number;
  byProject: Record<string, number>;
}

// ─── Leagues ───────────────────────────────────────────────────

export interface LeagueData {
  tier: string;
  tierName: string;
  tierEmoji: string;
  weeklyXp: number;
  userRank: number;
  daysLeft: number;
  leaderboard: LeagueEntry[];
  promotionZone: number;
  relegationZone: number;
}

export interface LeagueEntry {
  rank: number;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  weeklyXp: number;
}

// ─── Marketplace ───────────────────────────────────────────────

export interface SharedDoc {
  id: string;
  title: string;
  description: string;
  fileType: string;
  university: string;
  career: string;
  courseName: string;
  downloads: number;
  rating: number;
  ratingCount: number;
  author: UserBrief | null;
  createdAt: string;
}
