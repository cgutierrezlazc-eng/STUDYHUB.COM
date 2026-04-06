// Dynamic API base: production uses env var, dev uses localhost
function getApiBase(): string {
  // Allow override via localStorage (for dev/testing)
  const override = localStorage.getItem('conniku_api_base');
  if (override) return override;

  // In production native builds, use the configured server URL
  const saved = localStorage.getItem('conniku_server_url');
  if (saved) return saved;

  // Production: detect by hostname (not localhost = deployed)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return import.meta.env.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com';
  }

  return 'http://localhost:8899';
}

const API_BASE = getApiBase();

function getToken(): string | null {
  return localStorage.getItem('conniku_token');
}

async function request(endpoint: string, options?: RequestInit) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `API Error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ─── Auth ──────────────────────────────────────────────────
  register: (data: any) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  googleAuth: (credential: string) =>
    request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),

  getMe: () => request('/auth/me'),

  updateMe: (data: any) =>
    request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

  changeUsername: (username: string) =>
    request('/auth/me/username', { method: 'PUT', body: JSON.stringify({ username }) }),

  checkUsername: (q: string) =>
    request(`/auth/check-username?q=${encodeURIComponent(q)}`),

  verifyEmail: (code: string) =>
    request('/auth/verify-email', { method: 'POST', body: JSON.stringify({ code }) }),

  completeOnboarding: () =>
    request('/auth/complete-onboarding', { method: 'POST' }),

  // ─── Mentoring Requests ─────────────────────────────────────
  sendMentoringRequest: (data: { tutor_id: string; subject: string; message?: string }) =>
    request('/auth/tutoring-request', { method: 'POST', body: JSON.stringify(data) }),

  getMyMentoringRequests: () =>
    request('/auth/tutoring-requests'),

  respondMentoringRequest: (requestId: string, action: 'accepted' | 'rejected') =>
    request(`/auth/tutoring-request/${requestId}/respond`, { method: 'POST', body: JSON.stringify({ action }) }),

  searchTutors: (params?: { subject?: string; price_type?: string }) => {
    const qs = new URLSearchParams()
    if (params?.subject) qs.set('subject', params.subject)
    if (params?.price_type) qs.set('price_type', params.price_type)
    const q = qs.toString()
    return request(`/auth/tutors${q ? '?' + q : ''}`)
  },

  // ─── Projects ──────────────────────────────────────────────
  getProjects: () => request('/projects'),
  createProject: (data: { name: string; description: string; color: string }) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),
  updateProject: (id: string, data: { name?: string; description?: string; color?: string }) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ─── Documents ─────────────────────────────────────────────
  uploadDocument: async (projectId: string, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload Error: ${res.status}`);
    return res.json();
  },

  uploadDocumentFromPath: (projectId: string, filePath: string) =>
    request(`/projects/${projectId}/documents/path`, {
      method: 'POST',
      body: JSON.stringify({ path: filePath }),
    }),

  // ─── Chat ──────────────────────────────────────────────────
  chat: async (projectId: string, message: string, language: string = 'es', gender: string = 'unspecified', languageSkill: string = 'intermediate', socratic: boolean = false) => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, language, gender, language_skill: languageSkill, socratic }),
    });
    if (!res.ok) throw new Error(`Chat Error: ${res.status}`);
    return res.json();
  },

  // ─── Study Tools ───────────────────────────────────────────
  generateGuide: (projectId: string) =>
    request(`/projects/${projectId}/guide`, { method: 'POST' }),

  generateQuiz: (projectId: string, numQuestions: number = 10, difficulty: string = 'medium', weakTopics: string[] = []) =>
    request(`/projects/${projectId}/quiz`, {
      method: 'POST',
      body: JSON.stringify({ num_questions: numQuestions, difficulty, weak_topics: weakTopics }),
    }),

  generateStudyPlan: (projectId: string) =>
    request(`/projects/${projectId}/study-plan`, { method: 'POST' }),
  getStudyPlan: (projectId: string) =>
    request(`/projects/${projectId}/study-plan`),

  generateFlashcards: (projectId: string) =>
    request(`/projects/${projectId}/flashcards`, { method: 'POST' }),

  // ─── Summary & Advanced AI ────────────────────────────────
  generateSummary: (projectId: string, detailLevel: string = 'comprehensive', exportFormat: string = '') =>
    request(`/projects/${projectId}/summary`, {
      method: 'POST',
      body: JSON.stringify({ detail_level: detailLevel, export_format: exportFormat }),
    }),

  exportSummaryDocx: async (projectId: string, summaryData: any, title: string = 'Resumen de Estudio') => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/summary/export-docx`, {
      method: 'POST', headers, body: JSON.stringify({ ...summaryData, title }),
    });
    if (!res.ok) throw new Error('Export Error');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title}.docx`; a.click();
    URL.revokeObjectURL(url);
  },

  exportSummaryPdf: async (projectId: string, summaryData: any, title: string = 'Resumen de Estudio') => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/summary/export-pdf`, {
      method: 'POST', headers, body: JSON.stringify({ ...summaryData, title }),
    });
    if (!res.ok) throw new Error('Export Error');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title}.pdf`; a.click();
    URL.revokeObjectURL(url);
  },

  exportChatPdf: async (projectId: string, messages: any[], title: string = 'Chat de Estudio') => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/chat/export-pdf`, {
      method: 'POST', headers, body: JSON.stringify({ content: '', messages, title }),
    });
    if (!res.ok) throw new Error('Export Error');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title}.pdf`; a.click();
    URL.revokeObjectURL(url);
  },

  generateConceptMap: (projectId: string) =>
    request(`/projects/${projectId}/concept-map`, { method: 'POST' }),

  explainWithVisuals: (projectId: string, topic: string) =>
    request(`/projects/${projectId}/explain-visual`, {
      method: 'POST',
      body: JSON.stringify({ topic }),
    }),

  // ─── Math ──────────────────────────────────────────────────
  solvemath: (expression: string, step_by_step: boolean = true) =>
    request('/math/solve', {
      method: 'POST',
      body: JSON.stringify({ expression, step_by_step }),
    }),

  scanAndSolve: (imageBase64: string, language?: string) =>
    request('/math/scan', { method: 'POST', body: JSON.stringify({ image_base64: imageBase64, language: language || 'es' }) }),

  // ─── Messaging ─────────────────────────────────────────────
  searchUsers: (q: string) =>
    request(`/messaging/users/search?q=${encodeURIComponent(q)}`),

  getConversations: () =>
    request('/messaging/conversations'),

  getUnreadMessageCount: () =>
    request('/messaging/unread-count'),

  createConversation: (data: { type: string; name?: string; description?: string; participant_ids: string[] }) =>
    request('/messaging/conversations', { method: 'POST', body: JSON.stringify(data) }),

  acceptMessageRequest: (convId: string) =>
    request(`/messaging/conversations/${convId}/accept`, { method: 'POST' }),

  rejectMessageRequest: (convId: string) =>
    request(`/messaging/conversations/${convId}/reject`, { method: 'POST' }),

  getConversation: (id: string) =>
    request(`/messaging/conversations/${id}`),

  getMessages: (convId: string, before?: string) =>
    request(`/messaging/conversations/${convId}/messages${before ? `?before=${before}` : ''}`),

  sendMessage: (convId: string, data: { content: string; message_type?: string; document_name?: string; document_path?: string }) =>
    request(`/messaging/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  editMessage: (convId: string, msgId: string, content: string) =>
    request(`/messaging/conversations/${convId}/messages/${msgId}`, { method: 'PUT', body: JSON.stringify({ content }) }),

  deleteMessage: (convId: string, msgId: string) =>
    request(`/messaging/conversations/${convId}/messages/${msgId}`, { method: 'DELETE' }),

  addParticipant: (convId: string, userId: string) =>
    request(`/messaging/conversations/${convId}/participants?user_id=${userId}`, { method: 'POST' }),

  removeParticipant: (convId: string, userId: string) =>
    request(`/messaging/conversations/${convId}/participants/${userId}`, { method: 'DELETE' }),

  getFolders: () => request('/messaging/folders'),
  createFolder: (name: string) =>
    request('/messaging/folders', { method: 'POST', body: JSON.stringify({ name }) }),
  renameFolder: (id: string, name: string) =>
    request(`/messaging/folders/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteFolder: (id: string) =>
    request(`/messaging/folders/${id}`, { method: 'DELETE' }),
  addToFolder: (folderId: string, conversationId: string) =>
    request(`/messaging/folders/${folderId}/conversations`, { method: 'POST', body: JSON.stringify({ conversation_id: conversationId }) }),

  // ─── Admin ─────────────────────────────────────────────────
  adminGetUsers: (page: number = 1, search?: string, filter?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (filter) params.set('filter', filter);
    return request(`/admin/users?${params}`);
  },

  adminGetUser: (id: string) => request(`/admin/users/${id}`),
  adminBanUser: (id: string, reason: string) =>
    request(`/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ reason }) }),
  adminUnbanUser: (id: string) =>
    request(`/admin/users/${id}/unban`, { method: 'POST' }),
  adminDeleteUser: (id: string) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),
  adminGetFlaggedMessages: (page: number = 1) =>
    request(`/admin/messages/flagged?page=${page}`),
  adminDeleteMessage: (id: string) =>
    request(`/admin/messages/${id}`, { method: 'DELETE' }),
  adminGetStats: () => request('/admin/stats'),
  adminGetModerationLogs: (page: number = 1) =>
    request(`/admin/moderation-logs?page=${page}`),

  adminGetReports: (page: number = 1, status?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    return request(`/admin/reports?${params}`);
  },
  adminReviewReport: (reportId: string) =>
    request(`/admin/reports/${reportId}/review`, { method: 'POST' }),
  adminDismissReport: (reportId: string) =>
    request(`/admin/reports/${reportId}/dismiss`, { method: 'POST' }),

  adminGetBlockedUsers: (page: number = 1) =>
    request(`/admin/blocked-users?page=${page}`),
  adminForceUnblock: (blockId: string) =>
    request(`/admin/blocked-users/${blockId}`, { method: 'DELETE' }),

  adminMakeAdmin: (userId: string) =>
    request(`/admin/users/${userId}/make-admin`, { method: 'POST' }),
  adminRemoveAdmin: (userId: string) =>
    request(`/admin/users/${userId}/remove-admin`, { method: 'POST' }),

  adminGrantPremium: (userId: string) =>
    request(`/admin/users/${userId}/grant-premium`, { method: 'POST' }),
  adminRevokePremium: (userId: string) =>
    request(`/admin/users/${userId}/revoke-premium`, { method: 'POST' }),
  adminGetPayments: (page: number = 1) =>
    request(`/admin/payments?page=${page}`),
  adminGetFinancialSummary: () =>
    request('/admin/financial-summary'),

  // ─── Password Change ──────────────────────────────────────
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),

  deleteAccount: () =>
    request('/auth/me', { method: 'DELETE' }),

  // ─── Password Recovery ──────────────────────────────────────
  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (email: string, code: string, new_password: string) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, new_password }) }),

  // ─── Social / Friends ─────────────────────────────────────
  getFriends: () => request('/social/friends'),
  getUserFriends: (userId: string) => request(`/social/users/${userId}/friends`),
  getFriendRequests: () => request('/social/friend-requests'),
  getSentFriendRequests: () => request('/social/friend-requests/sent'),
  sendFriendRequest: (addresseeId: string) =>
    request('/social/friend-request', { method: 'POST', body: JSON.stringify({ addressee_id: addresseeId }) }),
  acceptFriendRequest: (requestId: string) =>
    request(`/social/friend-request/${requestId}/accept`, { method: 'POST' }),
  rejectFriendRequest: (requestId: string) =>
    request(`/social/friend-request/${requestId}/reject`, { method: 'POST' }),
  unfriend: (userId: string) =>
    request(`/social/friend/${userId}`, { method: 'DELETE' }),
  searchSocialUsers: (q: string) =>
    request(`/social/users/search?q=${encodeURIComponent(q)}`),
  getUserProfile: (userId: string) =>
    request(`/social/users/${userId}/profile`),
  getFeed: (page: number = 1) =>
    request(`/social/feed?page=${page}`),
  getActivityFeed: (page: number = 1) =>
    request(`/social/activity-feed?page=${page}`),

  // ─── Wall Posts ───────────────────────────────────────────
  getWallPosts: (userId: string, page: number = 1) =>
    request(`/social/wall/${userId}/posts?page=${page}`),
  createWallPost: (wallOwnerId: string, content: string, imageUrl?: string, visibility?: string, visibleTo?: string[], visibilityListId?: string) =>
    request(`/social/wall/${wallOwnerId}/posts`, {
      method: 'POST', body: JSON.stringify({ content, image_url: imageUrl, visibility: visibility || 'friends', visible_to: visibleTo || [], visibility_list_id: visibilityListId || null }),
    }),

  createMilestonePost: (data: { type: string; content: string; visibility?: string }) =>
    request('/social/milestone', { method: 'POST', body: JSON.stringify(data) }),
  deleteWallPost: (postId: string) =>
    request(`/social/posts/${postId}`, { method: 'DELETE' }),
  toggleLike: (postId: string) =>
    request(`/social/posts/${postId}/like`, { method: 'POST' }),
  reactToPost: (postId: string, reactionType: string) =>
    request(`/social/posts/${postId}/react`, { method: 'POST', body: JSON.stringify({ reaction_type: reactionType }) }),
  getComments: (postId: string) =>
    request(`/social/posts/${postId}/comments`),
  addComment: (postId: string, content: string) =>
    request(`/social/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  // ─── Block / Report / Suggestions ─────────────────────────
  blockUser: (userId: string) =>
    request(`/social/users/${userId}/block`, { method: 'POST' }),
  unblockUser: (userId: string) =>
    request(`/social/users/${userId}/unblock`, { method: 'POST' }),
  getBlockedUsers: () =>
    request('/social/blocked-users'),
  reportUser: (userId: string, reason: string) =>
    request(`/social/users/${userId}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getFriendSuggestions: () =>
    request('/social/friend-suggestions'),

  // ─── Friend Lists ─────────────────────────────────────────
  getFriendLists: () =>
    request('/social/friend-lists'),
  createFriendList: (name: string) =>
    request('/social/friend-lists', { method: 'POST', body: JSON.stringify({ name }) }),
  addToFriendList: (listId: string, friendId: string) =>
    request(`/social/friend-lists/${listId}/members`, { method: 'POST', body: JSON.stringify({ friendId }) }),
  removeFromFriendList: (listId: string, friendId: string) =>
    request(`/social/friend-lists/${listId}/members/${friendId}`, { method: 'DELETE' }),
  deleteFriendList: (listId: string) =>
    request(`/social/friend-lists/${listId}`, { method: 'DELETE' }),

  // ─── News & Announcements ─────────────────────────────────
  getUniversityNews: () =>
    request('/news/university'),

  getAnnouncements: () =>
    request('/news/announcements'),

  createAnnouncement: (data: { content: string; target: string; image_url?: string }) =>
    request('/news/announcements', { method: 'POST', body: JSON.stringify(data) }),

  // ─── Word Export ──────────────────────────────────────────
  exportDocx: async (projectId: string, content: string, title: string = 'Conniku Document') => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/chat/export-docx`, {
      method: 'POST', headers, body: JSON.stringify({ content, title }),
    });
    if (!res.ok) throw new Error('Export Error');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title}.docx`; a.click();
    URL.revokeObjectURL(url);
  },

  // ─── Video / YouTube ──────────────────────────────────────
  addYoutubeVideo: (projectId: string, url: string, title?: string) =>
    request(`/projects/${projectId}/video/youtube`, { method: 'POST', body: JSON.stringify({ url, title }) }),

  uploadVideo: async (projectId: string, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/video/upload`, {
      method: 'POST', headers, body: formData,
    });
    if (!res.ok) throw new Error('Upload Error');
    return res.json();
  },

  getVideos: (projectId: string) =>
    request(`/projects/${projectId}/videos`),

  getTranscription: (projectId: string, videoId: string) =>
    request(`/projects/${projectId}/video/${videoId}/transcription`),

  // ─── Text Analysis (Originality) ──────────────────────────
  analyzeOriginality: (text: string) =>
    request('/tools/analyze-originality', { method: 'POST', body: JSON.stringify({ text }) }),

  // ─── Gamification ─────────────────────────────────────────
  getGamificationStats: () => request('/gamification/stats'),
  getLeaderboard: () => request('/gamification/leaderboard'),

  // ─── Study Time ───────────────────────────────────────────
  logStudySession: (data: { duration_seconds: number; project_id?: string; activity_type?: string }) =>
    request('/gamification/study-session', { method: 'POST', body: JSON.stringify(data) }),

  getStudyTime: () => request('/gamification/study-time'),

  // ─── Leagues ──────────────────────────────────────────────
  getLeague: () => request('/gamification/league'),

  // ─── Calendar ─────────────────────────────────────────────
  getCalendarEvents: () => request('/calendar/events'),
  createCalendarEvent: (data: { title: string; description?: string; event_type?: string; due_date: string; project_id?: string; color?: string }) =>
    request('/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
  updateCalendarEvent: (id: string, data: { title?: string; description?: string; due_date?: string; completed?: boolean; color?: string }) =>
    request(`/calendar/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCalendarEvent: (id: string) =>
    request(`/calendar/events/${id}`, { method: 'DELETE' }),

  // ─── Marketplace ──────────────────────────────────────────
  getMarketplaceDocuments: (search?: string, university?: string, career?: string, page?: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (university) params.set('university', university);
    if (career) params.set('career', career);
    if (page) params.set('page', String(page));
    return request(`/marketplace/documents?${params}`);
  },
  shareDocument: (data: { title: string; description?: string; course_name?: string; file_path: string }) =>
    request('/marketplace/documents', { method: 'POST', body: JSON.stringify(data) }),
  rateDocument: (docId: string, rating: number) =>
    request(`/marketplace/documents/${docId}/rate`, { method: 'POST', body: JSON.stringify({ rating }) }),
  downloadDocument: (docId: string) =>
    request(`/marketplace/documents/${docId}/download`, { method: 'POST' }),

  // ─── Upload to Study ─────────────────────────────────────
  uploadToStudy: (projectId: string) =>
    request(`/projects/${projectId}/upload-to-study`, { method: 'POST' }),

  // ─── Notifications ────────────────────────────────────────
  getNotifications: (page: number = 1) => request(`/notifications/in-app?page=${page}`),
  getUnreadNotificationCount: () => request('/notifications/in-app/unread-count'),
  markNotificationRead: (id: string) => request(`/notifications/in-app/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/in-app/read-all', { method: 'POST' }),
  deleteNotification: (id: string) => request(`/notifications/in-app/${id}`, { method: 'DELETE' }),

  // ─── Communities ──────────────────────────────────────────
  getCommunities: (search?: string, category?: string, university?: string, my?: boolean, page?: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (university) params.set('university', university);
    if (my) params.set('my', 'true');
    if (page) params.set('page', String(page));
    return request(`/communities?${params}`);
  },
  createCommunity: (data: { name: string; description?: string; type?: string; category?: string; university?: string; rules?: string; avatar?: string }) =>
    request('/communities', { method: 'POST', body: JSON.stringify(data) }),
  getCommunity: (id: string) => request(`/communities/${id}`),
  updateCommunity: (id: string, data: any) =>
    request(`/communities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCommunity: (id: string) =>
    request(`/communities/${id}`, { method: 'DELETE' }),
  joinCommunity: (id: string) =>
    request(`/communities/${id}/join`, { method: 'POST' }),
  leaveCommunity: (id: string) =>
    request(`/communities/${id}/leave`, { method: 'POST' }),
  getCommunityMembers: (id: string) => request(`/communities/${id}/members`),
  changeMemberRole: (communityId: string, userId: string, role: string) =>
    request(`/communities/${communityId}/members/${userId}/role`, { method: 'POST', body: JSON.stringify({ role }) }),
  removeMember: (communityId: string, userId: string) =>
    request(`/communities/${communityId}/members/${userId}/remove`, { method: 'POST' }),
  getCommunityPosts: (id: string, page?: number) =>
    request(`/communities/${id}/posts${page ? `?page=${page}` : ''}`),
  createCommunityPost: (id: string, content: string, imageUrl?: string) =>
    request(`/communities/${id}/posts`, { method: 'POST', body: JSON.stringify({ content, image_url: imageUrl }) }),
  likeCommunityPost: (postId: string, reactionType?: string) =>
    request(`/communities/posts/${postId}/like`, { method: 'POST', body: JSON.stringify({ reaction_type: reactionType || 'like' }) }),
  getCommunityPostComments: (postId: string) =>
    request(`/communities/posts/${postId}/comments`),
  addCommunityPostComment: (postId: string, content: string) =>
    request(`/communities/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  pinCommunityPost: (postId: string) =>
    request(`/communities/posts/${postId}/pin`, { method: 'POST' }),
  deleteCommunityPost: (postId: string) =>
    request(`/communities/posts/${postId}`, { method: 'DELETE' }),
  getCommunitySuggestions: () => request('/communities/suggestions'),

  // ─── Polls ────────────────────────────────────────────────
  createPoll: (data: { question: string; options: string[]; is_anonymous?: boolean; expires_in_hours?: number; wall_post_id?: string }) =>
    request('/social/polls', { method: 'POST', body: JSON.stringify(data) }),
  votePoll: (pollId: string, optionId: string) =>
    request(`/social/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ option_id: optionId }) }),
  getPoll: (pollId: string) => request(`/social/polls/${pollId}`),

  // ─── Hashtags ─────────────────────────────────────────────
  getTrendingHashtags: () => request('/social/hashtags/trending'),
  getHashtagPosts: (tag: string, page?: number) =>
    request(`/social/hashtags/${tag}/posts${page ? `?page=${page}` : ''}`),
  autocompleteUsers: (q: string) => request(`/social/users/autocomplete?q=${encodeURIComponent(q)}`),

  // ─── Translation ──────────────────────────────────────────
  translateText: (text: string, targetLanguage: string, sourceLanguage?: string) =>
    request('/translate', { method: 'POST', body: JSON.stringify({ text, target_language: targetLanguage, source_language: sourceLanguage || '' }) }),

  // ─── Jobs / Career ────────────────────────────────────────
  getCareerStatus: () => request('/jobs/career-status'),
  updateCareerStatus: (data: { status: string; is_open_to_opportunities: boolean; resume_url?: string; headline?: string; preferred_job_types?: string[]; preferred_locations?: string[] }) =>
    request('/jobs/career-status', { method: 'PUT', body: JSON.stringify(data) }),
  createMilestone: (data: { milestone_type: string; title: string; description?: string; auto_post?: boolean }) =>
    request('/jobs/milestones', { method: 'POST', body: JSON.stringify(data) }),
  getMilestones: (userId?: string) =>
    request(`/jobs/milestones${userId ? `?user_id=${userId}` : ''}`),
  getJobListings: (search?: string, jobType?: string, careerField?: string, isRemote?: boolean, page?: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (jobType) params.set('job_type', jobType);
    if (careerField) params.set('career_field', careerField);
    if (isRemote) params.set('is_remote', 'true');
    if (page) params.set('page', String(page));
    return request(`/jobs/listings?${params}`);
  },
  createJobListing: (data: any) =>
    request('/jobs/listings', { method: 'POST', body: JSON.stringify(data) }),
  getJobListing: (id: string) => request(`/jobs/listings/${id}`),
  updateJobListing: (id: string, data: any) =>
    request(`/jobs/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJobListing: (id: string) =>
    request(`/jobs/listings/${id}`, { method: 'DELETE' }),
  applyToJob: (jobId: string, data: { resume_url?: string; cover_letter?: string }) =>
    request(`/jobs/listings/${jobId}/apply`, { method: 'POST', body: JSON.stringify(data) }),
  getJobApplications: (jobId: string) => request(`/jobs/listings/${jobId}/applications`),
  updateApplicationStatus: (appId: string, status: string, notes?: string) =>
    request(`/jobs/applications/${appId}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
  browseCandidates: (search?: string, career?: string, page?: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (career) params.set('career', career);
    if (page) params.set('page', String(page));
    return request(`/jobs/candidates?${params}`);
  },
  getMyJobListings: () => request('/jobs/my-listings'),
  getMyApplications: () => request('/jobs/my-applications'),

  // ─── Courses ──────────────────────────────────────────────
  getCourses: (category?: string) =>
    request(`/courses${category ? `?category=${category}` : ''}`),
  getCourse: (id: string) => request(`/courses/${id}`),
  generateCourseContent: (id: string) =>
    request(`/courses/${id}/generate`, { method: 'POST' }),
  completeLesson: (courseId: string, lessonId: string) =>
    request(`/courses/${courseId}/lessons/${lessonId}/complete`, { method: 'POST' }),
  submitCourseQuiz: (courseId: string, answers: Record<string, number>) =>
    request(`/courses/${courseId}/quiz/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  // ─── Exercises (never repeat) ───────────────────────────
  getExercises: (courseId: string, count: number = 5) =>
    request(`/courses/${courseId}/exercises`, { method: 'POST', body: JSON.stringify({ count }) }),
  submitExercises: (courseId: string, answers: Record<string, number>, questions: any[]) =>
    request(`/courses/${courseId}/exercises/submit`, { method: 'POST', body: JSON.stringify({ answers, questions }) }),

  getMyCertificates: () => request('/courses/certificates/my'),
  getUserCertificates: (userId: string) => request(`/courses/certificates/${userId}`),

  // Admin course management (manual, no AI)
  adminCreateCourse: (data: any) =>
    request('/courses/admin/create', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateCourse: (courseId: string, data: any) =>
    request(`/courses/admin/${courseId}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteCourse: (courseId: string) =>
    request(`/courses/admin/${courseId}`, { method: 'DELETE' }),

  // ─── CEO Course Certification ─────────────────────────────
  adminGetProgressOverview: () => request('/courses/admin/progress-overview'),
  adminCertifyUser: (userId: string, courseIds: string[], scoreOverride?: number) =>
    request('/courses/admin/certify', { method: 'POST', body: JSON.stringify({ user_id: userId, course_ids: courseIds, score_override: scoreOverride || 100 }) }),
  adminRevokeCertificate: (userId: string, courseId: string) =>
    request(`/courses/admin/revoke-certificate?user_id=${userId}&course_id=${courseId}`, { method: 'POST' }),

  // ─── Certificates (verified) ──────────────────────────────
  generateCertificate: (courseId: string, data: any) =>
    request(`/certificates/generate/${courseId}`, { method: 'POST', body: JSON.stringify(data) }),
  getMyVerifiedCertificates: () => request('/certificates/my'),
  downloadCertificate: (certId: string) => `${API_BASE}/certificates/download/${certId}`,
  verifyCertificate: async (code: string) => {
    const res = await fetch(`${API_BASE}/certificates/verify/${code}`);
    return res.json();
  },

  // ─── Student CV ───────────────────────────────────────────
  getMyCV: () => request('/courses/cv'),
  updateCV: (data: any) =>
    request('/courses/cv', { method: 'PUT', body: JSON.stringify(data) }),
  getUserCV: (userId: string) => request(`/courses/cv/${userId}`),
  getPublicCVs: (search?: string) => request(`/courses/cv-public/all${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  // ─── Recruiter ────────────────────────────────────────────
  registerRecruiter: (data: any) =>
    request('/jobs/recruiter/register', { method: 'POST', body: JSON.stringify(data) }),
  getRecruiterProfile: () => request('/jobs/recruiter/profile'),
  updateRecruiterProfile: (data: any) =>
    request('/jobs/recruiter/profile', { method: 'PUT', body: JSON.stringify(data) }),
  searchCandidatesAsRecruiter: (search?: string, career?: string, university?: string, page?: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (career) params.set('career', career);
    if (university) params.set('university', university);
    if (page) params.set('page', String(page));
    return request(`/jobs/recruiter/search-candidates?${params}`);
  },

  // ─── Tutoring ─────────────────────────────────────────────
  createTutoringListing: (data: any) =>
    request('/jobs/tutoring/listings', { method: 'POST', body: JSON.stringify(data) }),
  getTutoringListings: (subject?: string, category?: string, modality?: string, isFree?: boolean, page?: number) => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (category) params.set('category', category);
    if (modality) params.set('modality', modality);
    if (isFree) params.set('is_free', 'true');
    if (page) params.set('page', String(page));
    return request(`/jobs/tutoring/listings?${params}`);
  },
  getTutoringListing: (id: string) => request(`/jobs/tutoring/listings/${id}`),
  updateTutoringListing: (id: string, data: any) =>
    request(`/jobs/tutoring/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTutoringListing: (id: string) =>
    request(`/jobs/tutoring/listings/${id}`, { method: 'DELETE' }),
  requestTutoring: (listingId: string, data: { message?: string; scheduled_at?: string }) =>
    request(`/jobs/tutoring/listings/${listingId}/request`, { method: 'POST', body: JSON.stringify(data) }),
  getMyTutoringListings: () => request('/jobs/tutoring/my-listings'),
  getTutoringRequests: () => request('/jobs/tutoring/requests'),
  updateTutoringRequestStatus: (requestId: string, status: string, rating?: number, review?: string) =>
    request(`/jobs/tutoring/requests/${requestId}/status`, { method: 'PUT', body: JSON.stringify({ status, rating, review }) }),

  // ─── Events ───────────────────────────────────────────────
  createEvent: (data: any) =>
    request('/events', { method: 'POST', body: JSON.stringify(data) }),
  getEvents: (my?: boolean, page?: number) => {
    const params = new URLSearchParams();
    if (my) params.set('my', 'true');
    if (page) params.set('page', String(page));
    return request(`/events?${params}`);
  },
  getEvent: (id: string) => request(`/events/${id}`),
  rsvpEvent: (eventId: string, status: string) =>
    request(`/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
  deleteEvent: (id: string) =>
    request(`/events/${id}`, { method: 'DELETE' }),

  // ─── Skills & Endorsements ────────────────────────────────
  addSkill: (userId: string, skillName: string) =>
    request(`/social/users/${userId}/skills`, { method: 'POST', body: JSON.stringify({ skill_name: skillName }) }),
  removeSkill: (skillId: string) =>
    request(`/social/skills/${skillId}`, { method: 'DELETE' }),
  getUserSkills: (userId: string) => request(`/social/users/${userId}/skills`),
  endorseSkill: (skillId: string) =>
    request(`/social/skills/${skillId}/endorse`, { method: 'POST' }),

  // ─── Bookmarks ────────────────────────────────────────────
  toggleBookmark: (postId: string) =>
    request(`/social/posts/${postId}/bookmark`, { method: 'POST' }),
  getBookmarks: (page?: number) =>
    request(`/social/bookmarks${page ? `?page=${page}` : ''}`),

  // ─── Mentorship ───────────────────────────────────────────
  becomeMentor: (data: { subjects: string[]; availability?: string; bio?: string; max_mentees?: number }) =>
    request('/mentorship/become-mentor', { method: 'POST', body: JSON.stringify(data) }),
  getMentors: (subject?: string, university?: string, page?: number) => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (university) params.set('university', university);
    if (page) params.set('page', String(page));
    return request(`/mentorship/mentors?${params}`);
  },
  requestMentorship: (data: { mentor_id: string; subject?: string; message?: string }) =>
    request('/mentorship/request', { method: 'POST', body: JSON.stringify(data) }),
  acceptMentorship: (relationId: string) =>
    request(`/mentorship/${relationId}/accept`, { method: 'POST' }),
  completeMentorship: (relationId: string, rating?: number, review?: string) =>
    request(`/mentorship/${relationId}/complete`, { method: 'POST', body: JSON.stringify({ rating, review }) }),
  getMyMentors: () => request('/mentorship/my-mentors'),
  getMyMentees: () => request('/mentorship/my-mentees'),
  getMentorProfile: () => request('/mentorship/profile'),

  // ─── Share / Repost ───────────────────────────────────────
  sharePost: (postId: string, comment?: string) =>
    request(`/social/posts/${postId}/share`, { method: 'POST', body: JSON.stringify({ comment }) }),

  // ─── Payments / Stripe ────────────────────────────────────
  createCheckoutSession: (plan: 'monthly' | 'yearly') =>
    request('/payments/create-checkout-session', { method: 'POST', body: JSON.stringify({ plan }) }),
  createPortalSession: () =>
    request('/payments/create-portal-session', { method: 'POST' }),
  getSubscriptionStatus: () => request('/payments/subscription-status'),
  getStripeHealth: () => request('/payments/health'),

  // ─── Mercado Pago ─────────────────────────────────────────
  getMpHealth: () => request('/payments/mp/health'),
  getMpPlans: () => request('/payments/mp/plans'),
  createMpSubscription: (plan: string) =>
    request('/payments/mp/create-subscription', { method: 'POST', body: JSON.stringify({ plan }) }),
  createMpCheckout: (plan: string) =>
    request('/payments/mp/create-checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
  getMpSubscriptionStatus: () => request('/payments/mp/subscription-status'),
  cancelMpSubscription: () =>
    request('/payments/mp/cancel-subscription', { method: 'POST' }),

  // ─── PayPal ──────────────────────────────────────────────
  getPaypalHealth: () => request('/payments/paypal/health'),
  getPaypalPlans: () => request('/payments/paypal/plans'),
  createPaypalOrder: (plan_id: string) =>
    request('/payments/paypal/create-order', { method: 'POST', body: JSON.stringify({ plan_id }) }),
  capturePaypalOrder: (order_id: string) =>
    request(`/payments/paypal/capture-order/${order_id}`, { method: 'POST' }),
  createPaypalSubscription: (plan_id: string) =>
    request('/payments/paypal/create-subscription', { method: 'POST', body: JSON.stringify({ plan_id }) }),
  cancelPaypalSubscription: (subscription_id: string) =>
    request('/payments/paypal/cancel-subscription', { method: 'POST', body: JSON.stringify({ subscription_id }) }),

  // ─── Study Rooms ──────────────────────────────────────────
  createStudyRoom: (data: { name: string; description?: string; room_type?: string; subject?: string; max_participants?: number; pomodoro_work_min?: number; pomodoro_break_min?: number }) =>
    request('/study-rooms', { method: 'POST', body: JSON.stringify(data) }),
  getStudyRooms: () => request('/study-rooms'),
  joinStudyRoom: (roomId: string) =>
    request(`/study-rooms/${roomId}/join`, { method: 'POST' }),
  leaveStudyRoom: (roomId: string, studyMinutes?: number) =>
    request(`/study-rooms/${roomId}/leave`, { method: 'POST', body: JSON.stringify({ study_minutes: studyMinutes || 0 }) }),
  closeStudyRoom: (roomId: string) =>
    request(`/study-rooms/${roomId}`, { method: 'DELETE' }),

  // ─── Audio to Notes ───────────────────────────────────────
  audioToNotes: async (projectId: string, audioFile: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', audioFile);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/audio-to-notes`, {
      method: 'POST', headers, body: formData,
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return res.json();
  },

  // ─── Quiz System (diagnostic + scheduled + alerts) ────────
  generateDiagnostic: (projectId: string, subjectName: string, durationWeeks: number, startDate?: string) =>
    request(`/quiz-system/diagnostic/${projectId}`, { method: 'POST', body: JSON.stringify({ subject_name: subjectName, duration_weeks: durationWeeks, start_date: startDate }) }),
  submitDiagnostic: (projectId: string, answers: Record<string, number>, questions: any[]) =>
    request(`/quiz-system/diagnostic/${projectId}/submit`, { method: 'POST', body: JSON.stringify({ answers, questions }) }),
  getScheduledQuizzes: (projectId: string) =>
    request(`/quiz-system/scheduled/${projectId}`),
  generateScheduledQuiz: (quizId: string) =>
    request(`/quiz-system/scheduled/${quizId}/generate`, { method: 'POST' }),
  submitScheduledQuiz: (quizId: string, answers: Record<string, number>, questions: any[]) =>
    request(`/quiz-system/scheduled/${quizId}/submit`, { method: 'POST', body: JSON.stringify({ answers, questions }) }),
  getSubjectAverage: (projectId: string) =>
    request(`/quiz-system/average/${projectId}`),
  checkQuizAlerts: () =>
    request('/quiz-system/check-alerts', { method: 'POST' }),

  // ─── Pomodoro ─────────────────────────────────────────────
  completePomodoroSession: (durationMinutes: number, subjectId?: string) =>
    request('/pomodoro/complete', { method: 'POST', body: JSON.stringify({ duration_minutes: durationMinutes, subject_id: subjectId }) }),
  getPomodoroStats: () => request('/pomodoro/stats'),

  // ─── Wellness / Mood ──────────────────────────────────────
  checkInMood: (mood: number, energy: number, note?: string) =>
    request('/wellness/mood', { method: 'POST', body: JSON.stringify({ mood, energy, note }) }),
  getMoodHistory: (days?: number) => request(`/wellness/mood/history${days ? `?days=${days}` : ''}`),
  getMoodStats: () => request('/wellness/mood/stats'),

  // ─── Referrals ────────────────────────────────────────────
  getMyReferralCode: () => request('/referrals/my-code'),
  getReferralLeaderboard: () => request('/referrals/leaderboard'),

  // ─── Exam Predictor ───────────────────────────────────────
  predictExam: (projectId: string) =>
    request(`/exam-predictor/predict/${projectId}`, { method: 'POST' }),

  // ─── Study Goals ──────────────────────────────────────────
  setStudyGoal: (goalHours: number) =>
    request('/auth/me', { method: 'PUT', body: JSON.stringify({ weekly_study_goal_hours: goalHours }) }),

  // ─── Finance / Multi-currency ─────────────────────────────
  getFinancePrices: (countryCode?: string) =>
    request(`/finance/prices/${countryCode || 'CL'}`),
  getCountries: () => request('/finance/countries'),
  getAdminFinanceDashboard: () => request('/finance/admin/dashboard'),
  checkExpiredSubscriptions: () =>
    request('/finance/check-expired-subscriptions', { method: 'POST' }),

  // ─── F129 SII ─────────────────────────────────────────────
  generateF129: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return request(`/finance/admin/f129/generate?${params}`);
  },
  submitF129: (data: any) =>
    request('/finance/admin/f129/submit', { method: 'POST', body: JSON.stringify(data) }),

  // ─── Rewards ──────────────────────────────────────────────
  checkRewards: () => request('/rewards/check', { method: 'POST' }),
  getAvailableRewards: () => request('/rewards/available'),

  // ─── CEO Reports ──────────────────────────────────────────
  getCeoWeeklyReport: () => request('/finance/admin/weekly-report'),
  getReferralFraudReport: () => request('/referrals/admin/fraud-report'),
  getComplianceStatus: () => request('/finance/compliance-status'),

  // ─── CEO Email Management ─────────────────────────────────
  getCeoEmailInbox: (page?: number, emailType?: string) =>
    request(`/email/ceo/inbox?page=${page || 1}${emailType ? `&email_type=${emailType}` : ''}`),
  getCeoEmailDetail: (emailId: string) => request(`/email/ceo/email/${emailId}`),
  ceoSendEmail: (to: string, subject: string, body: string, ctaText?: string, ctaUrl?: string) =>
    request('/email/ceo/send', { method: 'POST', body: JSON.stringify({ to_email: to, subject, body, cta_text: ctaText || '', cta_url: ctaUrl || '' }) }),
  getCeoEmailStats: () => request('/email/ceo/stats'),
  ceoBroadcastEmail: (subject: string, body: string, filter?: string, ctaText?: string, ctaUrl?: string) =>
    request('/email/ceo/broadcast', { method: 'POST', body: JSON.stringify({ subject, body, filter: filter || 'all', ctaText: ctaText || '', ctaUrl: ctaUrl || '' }) }),
  ceoDeleteEmail: (emailId: string) =>
    request(`/email/ceo/email/${emailId}`, { method: 'DELETE' }),
  ceoDeleteEmailsBulk: (ids: string[]) =>
    request('/email/ceo/emails/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) }),

  // ─── Document Download ────────────────────────────────────
  downloadProjectDocument: (projectId: string, docName: string) =>
    request(`/projects/${projectId}/documents/${encodeURIComponent(docName)}/download`),

  // ─── Attendance ───────────────────────────────────────────
  logAttendance: (projectId: string, data: { title?: string; duration_minutes?: number; recorded?: boolean; transcribed?: boolean }) =>
    request(`/projects/${projectId}/attendance`, { method: 'POST', body: JSON.stringify(data) }),
  getAttendance: (projectId: string) => request(`/projects/${projectId}/attendance`),

  // ─── Exam Night Mode ──────────────────────────────────────
  generateExamNightPlan: (projectId: string, hours: number) =>
    request(`/projects/${projectId}/exam-night-mode`, { method: 'POST', body: JSON.stringify({ hours }) }),

  // ─── Subscription Upgrade ─────────────────────────────────
  calculateUpgradeProration: (targetTier: string) =>
    request('/payments/upgrade-prorate', { method: 'POST', body: JSON.stringify({ target_tier: targetTier }) }),
  executeUpgrade: () =>
    request('/payments/execute-upgrade', { method: 'POST', body: JSON.stringify({}) }),

  // ─── Contact ──────────────────────────────────────────────
  sendContactMessage: (data: { name: string; email: string; subject?: string; message: string }) =>
    request('/email/contact', { method: 'POST', body: JSON.stringify(data) }),
  sendContactFromProfile: (subject: string, message: string) =>
    request('/email/contact/from-profile', { method: 'POST', body: JSON.stringify({ subject, message }) }),

  // ─── Academic Search ──────────────────────────────────────
  searchWeb: (query: string, page?: number) =>
    request(`/search/web?q=${encodeURIComponent(query)}${page ? `&page=${page}` : ''}`),
  getAiSearchSummary: (query: string, results: any[]) =>
    request('/search/ai-summary', { method: 'POST', body: JSON.stringify({ query, results }) }),
  downloadToConniku: (url: string, filename?: string) =>
    request('/search/download-to-conniku', { method: 'POST', body: JSON.stringify({ url, filename }) }),
  getMyDownloads: () => request('/search/downloads'),
  getDownloadFile: (downloadId: string) => request(`/search/downloads/${downloadId}/file`),
  deleteDownload: (downloadId: string) =>
    request(`/search/downloads/${downloadId}`, { method: 'DELETE' }),

  // ─── CV Upload ─────────────────────────────────────────────
  uploadCV: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = getToken()
    const res = await fetch(`${API_BASE}/cv/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Error uploading CV')
    }
    return res.json()
  },

  // ─── Cover Photo ──────────────────────────────────────────
  updateCoverPhoto: async (data: FormData) => {
    const token = getToken()
    const res = await fetch(`${API_BASE}/auth/profile/cover`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data,
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.detail || 'Error al actualizar portada')
    }
    return res.json()
  },

  // ─── Conferences ──────────────────────────────────────────
  createConference: (data: any) =>
    request('/conferences/create', { method: 'POST', body: JSON.stringify(data) }),
  getConferences: (status?: string) =>
    request(`/conferences/${status ? `?status=${status}` : ''}`),
  getConference: (id: string) => request(`/conferences/${id}`),
  joinConference: (id: string) =>
    request(`/conferences/${id}/join`, { method: 'POST' }),
  leaveConference: (id: string) =>
    request(`/conferences/${id}/leave`, { method: 'POST' }),
  endConference: (id: string) =>
    request(`/conferences/${id}/end`, { method: 'POST' }),
  getConferenceTranscription: (id: string) =>
    request(`/conferences/${id}/transcription`),
  deleteConference: (id: string) =>
    request(`/conferences/${id}`, { method: 'DELETE' }),

  // ─── Health ────────────────────────────────────────────────
  health: () => request('/health'),
};

// ─── Push Notifications ─────────────────────────────────────────

export async function getVapidKey(): Promise<string> {
  const res = await fetch(`${API_BASE}/push/vapid-key`)
  const data = await res.json()
  return data.publicKey || ''
}

export async function subscribeToPush(subscription: PushSubscriptionJSON, deviceName: string) {
  const token = localStorage.getItem('conniku_token')
  return fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      device_name: deviceName,
    }),
  })
}

export async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  try {
    // Use the main SW (already registered in main.tsx) instead of separate push SW
    const registration = await navigator.serviceWorker.ready
    const vapidKey = await getVapidKey()
    if (!vapidKey) return

    const existing = await registration.pushManager.getSubscription()
    if (existing) return // Already subscribed

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })

    const deviceName = _getDeviceName()
    await subscribeToPush(subscription.toJSON(), deviceName)
  } catch (e) {
    console.log('[Push] Setup error:', e)
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function _getDeviceName(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'Safari en iPhone'
  if (/iPad/.test(ua)) return 'Safari en iPad'
  if (/Android/.test(ua)) return 'Chrome en Android'
  if (/Mac/.test(ua)) return 'Navegador en Mac'
  if (/Windows/.test(ua)) return 'Navegador en Windows'
  if (/Linux/.test(ua)) return 'Navegador en Linux'
  return 'Navegador'
}
