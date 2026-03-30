// Dynamic API base: production uses env var, dev uses localhost
function getApiBase(): string {
  // Allow override via localStorage (for dev/testing)
  const override = localStorage.getItem('studyhub_api_base');
  if (override) return override;

  // In production native builds, use the configured server URL
  const saved = localStorage.getItem('studyhub_server_url');
  if (saved) return saved;

  // Production: detect by hostname (not localhost = deployed)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return import.meta.env.VITE_API_URL || 'https://studyhub-api.onrender.com';
  }

  return 'http://localhost:8899';
}

const API_BASE = getApiBase();

function getToken(): string | null {
  return localStorage.getItem('studyhub_token');
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

  // ─── Projects ──────────────────────────────────────────────
  getProjects: () => request('/projects'),
  createProject: (data: { name: string; description: string; color: string }) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

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
  chat: async (projectId: string, message: string, language: string = 'es', gender: string = 'unspecified', languageSkill: string = 'intermediate') => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, language, gender, language_skill: languageSkill }),
    });
    if (!res.ok) throw new Error(`Chat Error: ${res.status}`);
    return res.json();
  },

  // ─── Study Tools ───────────────────────────────────────────
  generateGuide: (projectId: string) =>
    request(`/projects/${projectId}/guide`, { method: 'POST' }),

  generateQuiz: (projectId: string, numQuestions: number = 10) =>
    request(`/projects/${projectId}/quiz`, {
      method: 'POST',
      body: JSON.stringify({ num_questions: numQuestions }),
    }),

  generateFlashcards: (projectId: string) =>
    request(`/projects/${projectId}/flashcards`, { method: 'POST' }),

  // ─── Math ──────────────────────────────────────────────────
  solvemath: (expression: string, step_by_step: boolean = true) =>
    request('/math/solve', {
      method: 'POST',
      body: JSON.stringify({ expression, step_by_step }),
    }),

  // ─── Messaging ─────────────────────────────────────────────
  searchUsers: (q: string) =>
    request(`/messaging/users/search?q=${encodeURIComponent(q)}`),

  getConversations: () =>
    request('/messaging/conversations'),

  createConversation: (data: { type: string; name?: string; description?: string; participant_ids: string[] }) =>
    request('/messaging/conversations', { method: 'POST', body: JSON.stringify(data) }),

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

  // ─── Password Recovery ──────────────────────────────────────
  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (email: string, code: string, new_password: string) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, new_password }) }),

  // ─── Social / Friends ─────────────────────────────────────
  getFriends: () => request('/social/friends'),
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
  createWallPost: (wallOwnerId: string, content: string, imageUrl?: string) =>
    request(`/social/wall/${wallOwnerId}/posts`, {
      method: 'POST', body: JSON.stringify({ content, image_url: imageUrl }),
    }),
  deleteWallPost: (postId: string) =>
    request(`/social/posts/${postId}`, { method: 'DELETE' }),
  toggleLike: (postId: string) =>
    request(`/social/posts/${postId}/like`, { method: 'POST' }),
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

  // ─── Word Export ──────────────────────────────────────────
  exportDocx: async (projectId: string, content: string, title: string = 'StudyHub Document') => {
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

  // ─── Health ────────────────────────────────────────────────
  health: () => request('/health'),
};
