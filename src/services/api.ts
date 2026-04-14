// Dynamic API base: production uses env var, dev uses localhost
export function getApiBase(): string {
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

const TOKEN_KEY = 'conniku_token';
const REFRESH_TOKEN_KEY = 'conniku_refresh_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Flag to avoid concurrent refresh loops
let _isRefreshing = false;
let _refreshSubscribers: Array<(token: string | null) => void> = [];

function _onRefreshed(token: string | null) {
  _refreshSubscribers.forEach(cb => cb(token));
  _refreshSubscribers = [];
}

async function _tryRefreshToken(): Promise<string | null> {
  const refreshTok = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshTok) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTok }),
    });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    }
    const data = await res.json();
    const newToken = data.access_token as string;
    localStorage.setItem(TOKEN_KEY, newToken);
    return newToken;
  } catch {
    return null;
  }
}

async function request(endpoint: string, options?: RequestInit) {
  const token = getToken();
  // Don't set Content-Type for FormData — let the browser set it with the multipart boundary
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  // On 401, attempt a single token refresh then retry
  if (res.status === 401 && endpoint !== '/auth/refresh') {
    let newToken: string | null = null;

    if (_isRefreshing) {
      // Queue until the ongoing refresh resolves
      newToken = await new Promise<string | null>(resolve => {
        _refreshSubscribers.push(resolve);
      });
    } else {
      _isRefreshing = true;
      newToken = await _tryRefreshToken();
      _isRefreshing = false;
      _onRefreshed(newToken);
    }

    if (newToken) {
      const retryHeaders: Record<string, string> = isFormData
        ? { 'Authorization': `Bearer ${newToken}` }
        : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` };
      const retryRes = await fetch(`${API_BASE}${endpoint}`, { headers: retryHeaders, ...options });
      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => ({}));
        throw new Error((errData as any).detail || `API Error: ${retryRes.status}`);
      }
      return retryRes.json();
    }

    // Refresh failed — force logout by clearing tokens; callers will redirect to login
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as any).detail || 'Sesión expirada. Por favor inicia sesión nuevamente.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).detail || `API Error: ${res.status}`);
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
    if (!res.ok) {
      let msg = `Error ${res.status} al subir el archivo`;
      try { const e = await res.json(); if (e.detail || e.message) msg = e.detail || e.message; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  uploadDocumentWithProgress: (
    projectId: string,
    file: File,
    onProgress: (percent: number) => void
  ): Promise<any> => new Promise((resolve, reject) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/projects/${projectId}/documents`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({}); }
      } else {
        let msg = `Error ${xhr.status} al subir el archivo`;
        try { const e = JSON.parse(xhr.responseText); if (e.detail || e.message) msg = e.detail || e.message; } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Error de conexión al subir el archivo'));
    xhr.send(formData);
  }),

  uploadDocumentFromPath: (projectId: string, filePath: string) =>
    request(`/projects/${projectId}/documents/path`, {
      method: 'POST',
      body: JSON.stringify({ path: filePath }),
    }),

  // ─── AI Workflows (GPT-4o-mini) ────────────────────────────
  aiMarketing: (data: any) =>
    request('/ai-workflows/marketing/generate', { method: 'POST', body: JSON.stringify(data) }),
  aiMarketingCalendar: (data: any) =>
    request('/ai-workflows/marketing/calendar', { method: 'POST', body: JSON.stringify(data) }),
  aiModerate: (data: any) =>
    request('/ai-workflows/community/moderate', { method: 'POST', body: JSON.stringify(data) }),
  aiEngage: (data: any) =>
    request('/ai-workflows/community/engage', { method: 'POST', body: JSON.stringify(data) }),
  aiCodeReview: (data: any) =>
    request('/ai-workflows/qa/review', { method: 'POST', body: JSON.stringify(data) }),
  aiTestPlan: (data: any) =>
    request('/ai-workflows/qa/test-plan', { method: 'POST', body: JSON.stringify(data) }),
  aiDesignBrief: (data: any) =>
    request('/ai-workflows/design/brief', { method: 'POST', body: JSON.stringify(data) }),

  // ─── Support Chat ──────────────────────────────────────────
  supportChat: (message: string, history: { role: string; content: string }[] = [], page_context = '') =>
    request('/support/chat', { method: 'POST', body: JSON.stringify({ message, history, page_context }) }),
  supportAdminChat: (message: string, history: { role: string; content: string }[] = []) =>
    request('/support/admin-chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  getKonniBroadcasts: () => request('/support/konni-broadcasts'),
  markKonniBroadcastsRead: () => request('/support/konni-broadcasts/read', { method: 'POST' }),
  getRecentJobs: (since: string) => request(`/jobs/listings?since=${encodeURIComponent(since)}`),

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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  generateConceptMap: (projectId: string) =>
    request(`/projects/${projectId}/concept-map`, { method: 'POST' }),

  explainWithVisuals: (projectId: string, topic: string) =>
    request(`/projects/${projectId}/explain-visual`, {
      method: 'POST',
      body: JSON.stringify({ topic }),
    }),

  // ─── Math ──────────────────────────────────────────────────
  solvemath: (expression: string, step_by_step: boolean = true, language: string = 'es') =>
    request('/math/solve', {
      method: 'POST',
      body: JSON.stringify({ expression, step_by_step, language }),
    }),

  mathNatural: (query: string, step_by_step: boolean = true, language: string = 'es') =>
    request('/math/natural', {
      method: 'POST',
      body: JSON.stringify({ query, step_by_step, language }),
    }),

  mathVerify: (problem: string, student_answer: string, language: string = 'es') =>
    request('/math/verify', {
      method: 'POST',
      body: JSON.stringify({ problem, student_answer, language }),
    }),

  mathGraph: (expression: string, variable: string = 'x', x_min: number = -10, x_max: number = 10) =>
    request('/math/graph', {
      method: 'POST',
      body: JSON.stringify({ expression, variable, x_min, x_max }),
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

  sendMessage: (convId: string, data: { content: string; message_type?: string; document_name?: string; document_path?: string; reply_to_id?: string }) =>
    request(`/messaging/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  uploadVideoMessage: async (videoBlob: Blob) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', videoBlob, 'video.webm');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/messaging/upload-media`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      let msg = `Error ${res.status}`;
      try { const e = await res.json(); if (e.detail || e.message) msg = e.detail || e.message; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

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
  getOnlineUsers: () => request('/admin/online-users'),
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
  sendClosureFeedback: (reason: string, feedback: string) =>
    request('/auth/me/closure-feedback', { method: 'POST', body: JSON.stringify({ reason, feedback }) }),

  sendSuggestion: (type: string, subject: string, message: string) =>
    request('/auth/me/suggestion', { method: 'POST', body: JSON.stringify({ type, subject, message }) }),

  // ─── Bio automática ─────────────────────────────────────────
  generateBio: () =>
    request('/auth/me/bio/generate', { method: 'POST' }),
  toggleBioAuto: (enabled: boolean) =>
    request('/auth/me/bio/auto', { method: 'POST', body: JSON.stringify({ enabled }) }),

  // ─── AI Auto-tag ────────────────────────────────────────────
  autoTag: (text: string) =>
    request('/ai/auto-tag', { method: 'POST', body: JSON.stringify({ text }) }),

  dailySummary: () => request('/ai/daily-summary'),

  cvCoach: (cvText: string, targetRole: string = '') =>
    request('/ai/cv-coach', { method: 'POST', body: JSON.stringify({ cv_text: cvText, target_role: targetRole }) }),

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
  getFeed: (page: number = 1, sort: 'recent' | 'smart' = 'recent', filter: 'all' | 'career' | 'university' | 'friends' = 'all') =>
    request(`/social/feed?page=${page}&sort=${sort}&filter=${filter}`),
  getTrendingPosts: () =>
    request(`/social/feed/trending`),
  getActivityFeed: (page: number = 1, userId?: string) =>
    request(`/social/activity-feed?page=${page}${userId ? `&user_id=${userId}` : ''}`),

  // ─── Wall Posts ───────────────────────────────────────────
  getWallPosts: (userId: string, page: number = 1) =>
    request(`/social/wall/${userId}/posts?page=${page}`),
  createWallPost: (wallOwnerId: string, content: string, imageUrl?: string, visibility?: string, visibleTo?: string[], visibilityListId?: string) =>
    request(`/social/wall/${wallOwnerId}/posts`, {
      method: 'POST', body: JSON.stringify({ content, image_url: imageUrl, visibility: visibility || 'friends', visible_to: visibleTo || [], visibility_list_id: visibilityListId || null }),
    }),

  createMilestonePost: (data: { type: string; content: string; visibility?: string }) =>
    request('/social/milestone', { method: 'POST', body: JSON.stringify(data) }),
  editPost: (postId: string, data: { content: string; image_url?: string }) =>
    request(`/social/posts/${postId}`, { method: 'PUT', body: JSON.stringify(data) }),
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

  // ─── Portfolio & Publications ─────────────────────────────
  getUserProjects: (userId: string) =>
    request(`/social/users/${userId}/projects`),
  addPortfolioProject: (userId: string, data: any) =>
    request(`/social/users/${userId}/projects`, { method: 'POST', body: JSON.stringify(data) }),
  deletePortfolioProject: (projectId: string) =>
    request(`/social/projects/${projectId}`, { method: 'DELETE' }),
  getUserPublications: (userId: string) =>
    request(`/social/users/${userId}/publications`),
  addPublication: (userId: string, data: any) =>
    request(`/social/users/${userId}/publications`, { method: 'POST', body: JSON.stringify(data) }),
  deletePublication: (pubId: string) =>
    request(`/social/publications/${pubId}`, { method: 'DELETE' }),

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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  getTrendingCommunities: (limit: number = 6) => request(`/communities/trending?limit=${limit}`),
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
  createCommunityPost: (id: string, content: string, opts?: string | { image_url?: string; is_announcement?: boolean }) => {
    const image_url = typeof opts === 'string' ? opts : opts?.image_url
    const is_announcement = typeof opts === 'object' ? (opts?.is_announcement ?? false) : false
    return request(`/communities/${id}/posts`, { method: 'POST', body: JSON.stringify({ content, image_url, is_announcement }) })
  },
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
  reportCommunityPost: (postId: string, reason: string) =>
    request(`/communities/posts/${postId}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getCommunitySuggestions: () => request('/communities/suggestions'),
  getCommunityResources: (communityId: string) =>
    request(`/communities/${communityId}/resources`),
  addCommunityResource: (communityId: string, data: { resource_type: string; title: string; url: string; description?: string }) =>
    request(`/communities/${communityId}/resources`, { method: 'POST', body: JSON.stringify(data) }),
  deleteCommunityResource: (communityId: string, resourceId: string) =>
    request(`/communities/${communityId}/resources/${resourceId}`, { method: 'DELETE' }),
  getCommunityEvents: (communityId: string) =>
    request(`/communities/${communityId}/events`),
  createCommunityEvent: (communityId: string, data: { title: string; description?: string; event_date: string; location?: string; meet_url?: string }) =>
    request(`/communities/${communityId}/events`, { method: 'POST', body: JSON.stringify(data) }),
  rsvpCommunityEvent: (communityId: string, eventId: string, status: string) =>
    request(`/communities/${communityId}/events/${eventId}/rsvp?status=${status}`, { method: 'POST' }),
  uploadCommunityCover: async (communityId: string, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/communities/${communityId}/cover`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      let msg = `Error ${res.status}`;
      try { const e = await res.json(); if (e.detail || e.message) msg = e.detail || e.message; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

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
  getMyJobMatches: () => request('/jobs/my-matches'),
  updateJobMatchStatus: (matchId: string, status: 'viewed' | 'interested' | 'declined') =>
    request(`/jobs/matches/${matchId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getJobListingMatches: (jobId: string) => request(`/jobs/listings/${jobId}/matches`),

  // ─── Courses ──────────────────────────────────────────────
  getCourses: (category?: string) =>
    request(`/courses${category ? `?category=${category}` : ''}`),
  getCourse: (id: string) => request(`/courses/${id}`),
  generateCourseContent: (id: string) =>
    request(`/courses/${id}/generate`, { method: 'POST' }),
  completeLesson: (courseId: string, lessonId: string) =>
    request(`/courses/${courseId}/lessons/${lessonId}/complete`, { method: 'POST' }),
  getCourseQuizQuestions: (courseId: string) =>
    request(`/courses/${courseId}/quiz/questions`),

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

  // ─── CV / Perfil Profesional ──────────────────────────────
  getMyCV: () => request('/cv/me'),
  updateCV: (data: any) =>
    request('/cv/me', { method: 'PUT', body: JSON.stringify(data) }),
  getUserCV: (username: string) => request(`/cv/${username}`),
  getPublicCVs: (search?: string) => request(`/courses/cv-public/all${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  parseCV: () => request('/cv/parse', { method: 'POST' }),
  downloadCV: () => request('/cv/download'),
  downloadPublicCV: (username: string) => request(`/cv/${username}/download`),
  retryClassPayment: (classId: string) => request(`/tutors/classes/${classId}/payment-retry`, { method: 'PUT' }),

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

  // ─── Mercado Pago ─────────────────────────────────────────
  getMpHealth: () => request('/payments/mp/health'),
  getMpPlans: () => request('/payments/mp/plans'),
  createMpSubscription: (plan: string) =>
    request('/payments/mp/create-subscription', { method: 'POST', body: JSON.stringify({ plan }) }),
  createMpCheckout: (plan: string) =>
    request('/payments/mp/create-checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
  getMpSubscriptionStatus: () => request('/payments/mp/subscription-status'),
  cancelMpSubscription: (termsAccepted = true) =>
    request('/payments/mp/cancel-subscription', { method: 'POST', body: JSON.stringify({ terms_accepted: termsAccepted }) }),

  // ─── PayPal ──────────────────────────────────────────────
  getPaypalHealth: () => request('/payments/paypal/health'),
  getPaypalPlans: () => request('/payments/paypal/plans'),
  createPaypalOrder: (plan_id: string) =>
    request('/payments/paypal/create-order', { method: 'POST', body: JSON.stringify({ plan_id }) }),
  capturePaypalOrder: (order_id: string) =>
    request(`/payments/paypal/capture-order/${order_id}`, { method: 'POST' }),
  createPaypalSubscription: (plan_id: string) =>
    request('/payments/paypal/create-subscription', { method: 'POST', body: JSON.stringify({ plan_id }) }),
  cancelPaypalSubscription: (subscription_id: string, termsAccepted = true) =>
    request('/payments/paypal/cancel-subscription', { method: 'POST', body: JSON.stringify({ subscription_id, terms_accepted: termsAccepted }) }),

  submitRefundRequest: (data: any) =>
    request('/payments/paypal/refund-request', { method: 'POST', body: JSON.stringify(data) }),

  getAdminRefundRequests: () => request('/admin/refund-requests'),

  // ─── Mail → Contabilidad ───────────────────────────────────
  getEmailDocs: (status?: string) => request(`/email-docs/${status ? `?status=${status}` : ''}`),
  getEmailDocsStats: () => request('/email-docs/stats'),
  pollEmailDocs: () => request('/email-docs/poll', { method: 'POST' }),
  downloadEmailDoc: (id: string) => request(`/email-docs/${id}/download`),
  reviewEmailDoc: (id: string, status: string, adminNotes?: string) =>
    request(`/email-docs/${id}/review`, { method: 'PUT', body: JSON.stringify({ status, admin_notes: adminNotes || '' }) }),

  updateAdminRefundRequest: (id: string, data: any) =>
    request(`/admin/refund-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ─── Tutor Class Payments ─────────────────────────────────
  createMpClassCheckout: (classId: string, applyMaxDiscount?: boolean) =>
    request('/payments/mp/create-class-checkout', {
      method: 'POST',
      body: JSON.stringify({ class_id: classId, apply_max_discount: applyMaxDiscount || false }),
    }),
  createPaypalClassOrder: (classId: string, applyMaxDiscount?: boolean) =>
    request('/payments/paypal/create-class-order', {
      method: 'POST',
      body: JSON.stringify({ class_id: classId, apply_max_discount: applyMaxDiscount || false }),
    }),
  capturePaypalClassOrder: (orderId: string) =>
    request(`/payments/paypal/capture-class-order/${orderId}`, { method: 'POST' }),
  getEnrollmentStatus: (enrollmentId: string) =>
    request(`/tutors/enrollments/${enrollmentId}/status`),

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

  // ─── Fiscal Alerts ───────────────────────────────────────
  checkFiscalAlerts: () =>
    request('/email/fiscal-alerts/check', { method: 'POST' }),

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

  // ─── CEO Moderation Queue ─────────────────────────────────
  getModerationQueue: (status?: string) =>
    request(`/ceo/moderation/queue${status ? `?status=${status}` : ''}`),
  getModerationStats: () => request('/ceo/moderation/stats'),
  approveModerationItem: (itemId: string) =>
    request(`/ceo/moderation/${itemId}/approve`, { method: 'POST' }),
  rejectModerationItem: (itemId: string, note?: string) =>
    request(`/ceo/moderation/${itemId}/reject${note ? `?note=${encodeURIComponent(note)}` : ''}`, { method: 'POST' }),

  // ─── CEO Email Management ─────────────────────────────────
  getCeoEmailInbox: (page?: number, emailType?: string, account?: string) =>
    request(`/email/ceo/inbox?page=${page || 1}${emailType ? `&email_type=${emailType}` : ''}${account ? `&account=${account}` : ''}`),
  getCeoEmailDetail: (emailId: string) => request(`/email/ceo/email/${emailId}`),
  ceoSendEmail: (to: string, subject: string, body: string, ctaText?: string, ctaUrl?: string, fromAccount?: string) =>
    request('/email/ceo/send', { method: 'POST', body: JSON.stringify({ to_email: to, subject, body, cta_text: ctaText || '', cta_url: ctaUrl || '', from_account: fromAccount || 'ceo' }) }),
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

  // ─── Document Delete ──────────────────────────────────────
  deleteProjectDocument: (projectId: string, docId: string) =>
    request(`/projects/${projectId}/documents/${docId}`, { method: 'DELETE' }),

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

  // ─── Live Online Count ──────────────────────────────────
  getOnlineCount: () => request('/ws/online-count'),

  // ─── HR / RRHH ────────────────────────────────────────────
  getChileIndicators: () => request('/hr/indicators'),
  getEmployees: async (filters?: string) => {
    const data = await request(`/hr/employees${filters ? `?${filters}` : ''}`)
    return Array.isArray(data) ? data : (data?.employees || [])
  },
  getEmployee: (id: string) => request(`/hr/employees/${id}`),
  createEmployee: (data: any) => {
    // Convert camelCase to snake_case for backend
    const snake: any = {}
    for (const [k, v] of Object.entries(data)) {
      snake[k.replace(/([A-Z])/g, '_$1').toLowerCase()] = v
    }
    return request('/hr/employees', { method: 'POST', body: JSON.stringify(snake) })
  },
  updateEmployee: (id: string, data: any) => {
    const snake: any = {}
    for (const [k, v] of Object.entries(data)) {
      snake[k.replace(/([A-Z])/g, '_$1').toLowerCase()] = v
    }
    return request(`/hr/employees/${id}`, { method: 'PUT', body: JSON.stringify(snake) })
  },
  deleteEmployee: (id: string) => request(`/hr/employees/${id}`, { method: 'DELETE' }),
  getEmployeeDocuments: (id: string) => request(`/hr/employees/${id}/documents`),
  downloadEmployeeDocument: async (docId: string) => {
    const token = localStorage.getItem('token')
    const base = (import.meta as any).env?.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com'
    const res = await fetch(`${base}/hr/documents/${docId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const cd = res.headers.get('content-disposition')
    a.download = cd?.match(/filename="?([^"]+)"?/)?.[1] || `documento-${docId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
  uploadEmployeeDocument: (id: string, data: any) => request(`/hr/employees/${id}/documents`, { method: 'POST', body: JSON.stringify(data) }),
  signDocument: (docId: string) => request(`/hr/documents/${docId}/sign`, { method: 'POST' }),
  generateContractPdf: (employeeId: string, data: { html: string; worker_name: string }) =>
    request(`/hr/employees/${employeeId}/contract/generate`, { method: 'POST', body: JSON.stringify(data) }),
  provisionEmployeeAccount: (employeeId: string) =>
    request(`/hr/employees/${employeeId}/provision-account`, { method: 'POST' }),
  fesSignDocument: (docId: string) =>
    request(`/hr/documents/${docId}/fes-sign`, { method: 'POST' }),
  verifyFesDocument: (verificationCode: string) =>
    request(`/hr/documents/verify/${verificationCode}`),
  uploadEmployeeFile: (employeeId: string, file: File, documentType: string, name: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    formData.append('name', name)
    const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com/api'
    const token = localStorage.getItem('token')
    return fetch(`${API_BASE}/hr/employees/${employeeId}/documents`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }).then((r: Response) => r.json())
  },
  calculatePayroll: (month: number, year: number, overrides?: Record<string, any>) => request('/hr/payroll/calculate', { method: 'POST', body: JSON.stringify({ month, year, overrides }) }),
  getPayroll: (year: number, month: number) => request(`/hr/payroll/${year}/${month}`),
  approvePayroll: (id: string) => request(`/hr/payroll/${id}/approve`, { method: 'PUT' }),
  markPayrollPaid: (id: string) => request(`/hr/payroll/${id}/mark-paid`, { method: 'PUT' }),
  getPrevired: (year: number, month: number) => request(`/hr/payroll/previred/${year}/${month}`),
  getExpenses: (params?: string) => request(`/hr/expenses${params ? `?${params}` : ''}`),
  createExpense: (data: any) => request('/hr/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: any) => request(`/hr/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: string) => request(`/hr/expenses/${id}`, { method: 'DELETE' }),
  getExpenseSummary: (year: number) => request(`/hr/expenses/summary/${year}`),

  // ─── HR Leave / Vacaciones ────────────────────────────────
  getLeaveRequests: (status?: string, employeeId?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (employeeId) params.set('employee_id', employeeId);
    const qs = params.toString();
    return request(`/hr/leave/requests${qs ? `?${qs}` : ''}`);
  },
  createLeaveRequest: (data: any) =>
    request('/hr/leave/request', { method: 'POST', body: JSON.stringify(data) }),
  approveLeaveRequest: (requestId: string) =>
    request(`/hr/leave/requests/${requestId}/approve`, { method: 'PUT' }),
  rejectLeaveRequest: (requestId: string, reason?: string) =>
    request(`/hr/leave/requests/${requestId}/reject`, { method: 'PUT', body: JSON.stringify({ reject_reason: reason }) }),

  // ─── Legal Obligations ────────────────────────────────────
  getLegalObligations: () => request('/legal-obligations'),
  saveLegalObligations: (items: any[]) =>
    request('/legal-obligations', { method: 'POST', body: JSON.stringify({ items }) }),

  // ─── Tutores / Prestadores Externos ────────────────────────
  applyAsTutor: (data: any) => request('/tutors/apply', { method: 'POST', body: JSON.stringify(data) }),
  getMyTutorProfile: () => request('/tutors/my-profile'),
  updateMyTutorProfile: (data: any) => request('/tutors/my-profile', { method: 'PUT', body: JSON.stringify(data) }),
  uploadTutorDocument: (data: any) => request('/tutors/my-profile/documents', { method: 'POST', body: JSON.stringify(data) }),
  getMyTutorDocuments: () => request('/tutors/my-profile/documents'),
  getTutorApplications: (params?: string) => request(`/tutors/admin/applications${params ? `?${params}` : ''}`),
  getAllTutors: (params?: string) => request(`/tutors/admin/all${params ? `?${params}` : ''}`),
  approveTutor: (id: string) => request(`/tutors/admin/${id}/approve`, { method: 'PUT' }),
  rejectTutor: (id: string, reason: string) => request(`/tutors/admin/${id}/reject?reason=${encodeURIComponent(reason)}`, { method: 'PUT' }),
  suspendTutor: (id: string, reason: string) => request(`/tutors/admin/${id}/suspend?reason=${encodeURIComponent(reason)}`, { method: 'PUT' }),
  getTutorAdmin: (id: string) => request(`/tutors/admin/${id}`),
  createTutorClass: (data: any) => request('/tutors/classes', { method: 'POST', body: JSON.stringify(data) }),
  getTutorClasses: (params?: string) => request(`/tutors/classes${params ? `?${params}` : ''}`),
  getTutorClass: (id: string) => request(`/tutors/classes/${id}`),
  enrollInClass: (id: string, data: any) => request(`/tutors/classes/${id}/enroll`, { method: 'POST', body: JSON.stringify(data) }),
  confirmClassCompletion: (id: string) => request(`/tutors/classes/${id}/confirm`, { method: 'PUT' }),
  rateTutorClass: (id: string, data: any) => request(`/tutors/classes/${id}/rate`, { method: 'POST', body: JSON.stringify(data) }),
  rateStudentInClass: (classId: string, data: { rating: number; comment?: string }) => request(`/tutors/classes/${classId}/rate-student`, { method: 'POST', body: JSON.stringify(data) }),
  getMyOwnClasses: () => request('/tutors/my-own-classes'),
  reportClassNoshow: (id: string, data: any) => request(`/tutors/classes/${id}/report-noshow`, { method: 'POST', body: JSON.stringify(data) }),
  getMyTutorPayments: (params?: string) => request(`/tutors/my-payments${params ? `?${params}` : ''}`),
  getMyTutorPayslips: (params?: string) => request(`/tutors/my-payslips${params ? `?${params}` : ''}`),
  uploadBoletaHonorarios: (paymentId: string, formData: FormData) =>
    request(`/tutors/my-payments/${paymentId}/upload-boleta`, { method: 'POST', body: formData }),
  getMyBoletas: () => request('/tutors/my-boletas'),
  downloadMyBoleta: (docId: string) => request(`/tutors/my-boletas/${docId}/download`),
  getAdminTutorPayments: (params?: string) => request(`/tutors/admin/payments${params ? `?${params}` : ''}`),
  processAdminTutorPayment: (id: string) => request(`/tutors/admin/payments/${id}/process`, { method: 'PUT' }),
  markAdminTutorPaymentPaid: (id: string, data: any) => request(`/tutors/admin/payments/${id}/paid`, { method: 'PUT', body: JSON.stringify(data) }),
  generateTutorPayslips: (year: number, month: number) => request(`/tutors/admin/payslips/generate/${year}/${month}`),
  getTutorDirectory: (params?: string) => request(`/tutors/directory${params ? `?${params}` : ''}`),
  getTutorPublicProfile: (id: string) => request(`/tutors/${id}/public`),
  getTutorPublicByUsername: (username: string) => request(`/tutors/by-username/${username}`),
  getTutorRanking: (limit?: number) => request(`/tutors/ranking${limit ? `?limit=${limit}` : ''}`),
  getTutorContract: () => request('/tutors/my-contract'),
  signTutorContract: () => request('/tutors/my-contract/sign', { method: 'POST' }),

  // ─── Student Tutoring (classes I attend as student) ────────
  getMyTutoringClasses: (params?: string) => request(`/tutors/my-enrolled-classes${params ? `?${params}` : ''}`),
  bookTutoringSession: (data: { tutor_id: string; subject: string; preferred_date: string; class_type: string; notes?: string }) =>
    request('/tutors/classes/book', { method: 'POST', body: JSON.stringify(data) }),
  getMyTutoringPayments: (params?: string) => request(`/tutors/my-student-payments${params ? `?${params}` : ''}`),
  getTutoringExam: (classId: string) => request(`/tutors/classes/${classId}/exam`),
  submitTutoringExam: (classId: string, answers: Record<string, any>) =>
    request(`/tutors/classes/${classId}/exam/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),

  // ─── Tutor Exam Management (tutor side) ────────────────────
  createTutorExam: (classId: string, data: any) => request(`/tutors/classes/${classId}/exam`, { method: 'POST', body: JSON.stringify(data) }),
  enableTutorExam: (classId: string) => request(`/tutors/classes/${classId}/exam/enable`, { method: 'PUT' }),
  getTutorExamResults: (classId: string) => request(`/tutors/classes/${classId}/exam/results`),

  // ─── Tutor Availability ───────────────────────────────────
  getMyAvailability: () => request('/tutors/my-availability'),
  setMyAvailability: (slots: any[]) => request('/tutors/my-availability', { method: 'PUT', body: JSON.stringify({ slots }) }),
  addBlockedDates: (data: any) => request('/tutors/my-blocked-dates', { method: 'POST', body: JSON.stringify(data) }),
  removeBlockedDate: (id: string) => request(`/tutors/my-blocked-dates/${id}`, { method: 'DELETE' }),
  getTutorAvailability: (tutorId: string) => request(`/tutors/${tutorId}/availability`),

  // ─── Tutor Programs ────────────────────────────────────────
  createTutorProgram: (data: any) => request('/tutors/programs', { method: 'POST', body: JSON.stringify(data) }),
  getTutorCategories: () => request('/tutors/categories'),

  // ─── Class Chat ───────────────────────────────────────────
  getClassMessages: (classId: string, page?: number) => request(`/tutors/classes/${classId}/messages?page=${page || 1}`),
  sendClassMessage: (classId: string, message: string) => request(`/tutors/classes/${classId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  // ─── Tutor Subjects (Asignaturas) ────────────────────────
  createTutorSubject: (data: any) => request('/tutors/subjects', { method: 'POST', body: JSON.stringify(data) }),
  getMyTutorSubjects: () => request('/tutors/my-subjects'),
  updateTutorSubject: (id: string, data: any) => request(`/tutors/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTutorSubject: (id: string) => request(`/tutors/subjects/${id}`, { method: 'DELETE' }),
  submitTutorSubjectForApproval: (id: string) => request(`/tutors/subjects/${id}/submit`, { method: 'POST' }),
  getAdminSubjects: (params?: string) => request(`/tutors/admin/subjects${params ? `?${params}` : ''}`),
  approveSubject: (id: string) => request(`/tutors/admin/subjects/${id}/approve`, { method: 'PUT' }),
  rejectSubject: (id: string, reason: string) => request(`/tutors/admin/subjects/${id}/reject?reason=${encodeURIComponent(reason)}`, { method: 'PUT' }),

  // ─── Admin Tutor Management ───────────────────────────────
  enforceRatings: () => request('/tutors/admin/enforce-ratings', { method: 'POST' }),
  applyAsOwnerTutor: () => request('/tutors/apply-as-owner', { method: 'POST' }),

  // ─── Push Broadcast ────────────────────────────────────────
  broadcastPush: (title: string, body: string, url?: string) =>
    request('/push/broadcast', { method: 'POST', body: JSON.stringify({ title, body, url: url || '/' }) }),

  // ─── Executive Showcase (MAX plan) ─────────────────────────
  getMyExecutiveShowcase: () => request('/auth/me/executive-showcase'),
  updateMyExecutiveShowcase: (items: any[]) => request('/auth/me/executive-showcase', { method: 'PUT', body: JSON.stringify(items) }),
  getUserExecutiveShowcase: (userId: string) => request(`/auth/users/${userId}/executive-showcase`),

  // ─── Class Session / FASE 3 ──────────────────────────────
  startClassSession: (classId: string) => request(`/tutors/classes/${classId}/start`, { method: 'PUT' }),
  studentConfirmClass: (classId: string) => request(`/tutors/classes/${classId}/student-confirm`, { method: 'PUT' }),
  objectToClass: (classId: string, reason: string, termsAccepted: boolean) =>
    request(`/tutors/classes/${classId}/object`, { method: 'POST', body: JSON.stringify({ reason, terms_accepted: termsAccepted }) }),
  getClassJitsiRoom: (classId: string) => request(`/tutors/classes/${classId}/jitsi-room`),

  // ─── FASE 4: Post-class exam (3-attempt) + AI summary ────
  getExamAttempts: (classId: string) => request(`/tutors/classes/${classId}/exam/attempts`),
  submitExamAttempt: (classId: string, answers: Record<string, any>, timeSpentSeconds?: number) =>
    request(`/tutors/classes/${classId}/exam/attempt`, { method: 'POST', body: JSON.stringify({ answers, time_spent_seconds: timeSpentSeconds || 0 }) }),
  generateClassSummary: (classId: string) => request(`/tutors/classes/${classId}/generate-summary`, { method: 'POST' }),

  // ─── Health ────────────────────────────────────────────────
  health: () => request('/health'),

  // ─── Employee Attendance / Marcaje ─────────────────────────
  clockAttendance: (action: 'in' | 'out', note?: string) =>
    request('/hr/attendance/clock', { method: 'POST', body: JSON.stringify({ action, note }) }),
  getMyAttendance: (limit?: number) =>
    request(`/hr/attendance/mine${limit ? `?limit=${limit}` : ''}`),
  getAllAttendance: (date?: string) =>
    request(`/hr/attendance/all${date ? `?date=${date}` : ''}`),

  // ─── Blog Thread ─────────────────────────────────────────────
  getBlogPosts: (limit: number = 50) => request(`/blog/posts?limit=${limit}`),
  createBlogPost: (content: string) =>
    request('/blog/posts', { method: 'POST', body: JSON.stringify({ content }) }),
  likeBlogPost: (postId: string) =>
    request(`/blog/posts/${postId}/like`, { method: 'POST' }),

  // ─── Contact Form (público) ────────────────────────────────
  sendContactForm: (data: { name: string; email: string; subject: string; message: string }) =>
    request('/contact/send', { method: 'POST', body: JSON.stringify(data) }),

  // ─── LMS University Integration ──────────────────────────────
  lmsConnect: (data: {
    platform_type: string; platform_name: string; api_url: string;
    api_token?: string; extra_field?: string;
    auth_method?: string; username?: string; password?: string;
  }) =>
    request('/lms/connect', { method: 'POST', body: JSON.stringify({
      extra_field: '', auth_method: 'token', api_token: '', ...data,
    }) }),
  lmsGetConnections: () => request('/lms/connections'),
  lmsDisconnect: (connId: string) => request(`/lms/connections/${connId}`, { method: 'DELETE' }),
  lmsScan: () => request('/lms/scan', { method: 'POST' }),
  lmsGetPending: () => request('/lms/pending'),
  lmsSyncItem: (itemId: string, conniku_project_id: string) =>
    request(`/lms/sync/${itemId}`, { method: 'POST', body: JSON.stringify({ item_id: itemId, conniku_project_id }) }),
  lmsDismissItem: (itemId: string) => request(`/lms/dismiss/${itemId}`, { method: 'POST' }),
  lmsLinkCourse: (courseId: string, conniku_project_id: string) =>
    request('/lms/link-course', { method: 'POST', body: JSON.stringify({ course_id: courseId, conniku_project_id }) }),
  lmsGetCourses: () => request('/lms/courses'),
  lmsActivateCourses: (connectionId: string, courseIds: string[]) =>
    request('/lms/activate-courses', { method: 'POST', body: JSON.stringify({ connection_id: connectionId, course_ids: courseIds }) }),
  lmsGetHub: () => request('/lms/hub'),
  lmsMarkVisited: () => request('/lms/mark-visited', { method: 'POST' }),
  lmsGetTopics: (courseId: string) => request(`/lms/courses/${courseId}/topics`),
  lmsRenameCourse: (courseId: string, displayName: string) =>
    request(`/lms/courses/${courseId}/rename`, { method: 'PATCH', body: JSON.stringify({ display_name: displayName }) }),
  lmsGetAvailable: (connId: string) => request(`/lms/courses/available/${connId}`),
  // ─── LMS Calendar ────────────────────────────────────────────
  lmsGetCalendar: () => request('/lms/calendar'),
  lmsSyncCalendar: () => request('/lms/sync-calendar', { method: 'POST' }),
  lmsUpdateCalendarPrefs: (prefs: { cal_push?: boolean; cal_inapp?: boolean; cal_email?: boolean }) =>
    request('/lms/calendar-prefs', { method: 'PATCH', body: JSON.stringify(prefs) }),
  lmsAddCourses: (connectionId: string, courseIds: string[]) =>
    request('/lms/courses/add', { method: 'POST', body: JSON.stringify({ connection_id: connectionId, course_ids: courseIds }) }),
  lmsScanCourse: (courseId: string) => request(`/lms/scan/${courseId}`, { method: 'POST' }),
  importDocumentB64: (projectId: string, filename: string, content_b64: string, file_type?: string) =>
    request(`/projects/${projectId}/documents/import`, {
      method: 'POST',
      body: JSON.stringify({ filename, content_b64, file_type: file_type || '' }),
    }),
  // ─── Biblioteca ──────────────────────────────────────────────
  getBiblioteca: (params?: { q?: string; category?: string; source_type?: string; page?: number }) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.category) p.set('category', params.category)
    if (params?.source_type) p.set('source_type', params.source_type)
    if (params?.page) p.set('page', String(params.page))
    return request(`/biblioteca?${p.toString()}`)
  },
  getBibliotecaSaved: () => request('/biblioteca/user/saved'),
  getBibliotecaDoc: (docId: string) => request(`/biblioteca/${docId}`),
  shareToBiblioteca: (data: {
    project_id: string; doc_id: string; title: string;
    description?: string; category: string; author?: string;
    year?: number; tags?: string[]
  }) => request('/biblioteca/share', { method: 'POST', body: JSON.stringify(data) }),
  toggleBibliotecaSave: (docId: string) =>
    request(`/biblioteca/${docId}/save`, { method: 'POST' }),
  rateBibliotecaDoc: (docId: string, rating: number) =>
    request(`/biblioteca/${docId}/rate`, { method: 'POST', body: JSON.stringify({ rating }) }),
  getPublicDomainBooks: (params?: { q?: string; lang?: string; page?: number }) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.lang) p.set('lang', params.lang)
    if (params?.page) p.set('page', String(params.page))
    return request(`/biblioteca/public-search?${p.toString()}`)
  },

  // ─── Collaborative Documents (Trabajos Grupales) ────────────────
  collabList: (status = 'active') => request(`/collab?status=${status}`),
  collabGet: (id: string) => request(`/collab/${id}`),
  collabCreate: (data: any) => request('/collab', { method: 'POST', body: JSON.stringify(data) }),
  collabUpdate: (id: string, data: any) => request(`/collab/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  collabDelete: (id: string) => request(`/collab/${id}`, { method: 'DELETE' }),
  collabAddMember: (docId: string, data: any) => request(`/collab/${docId}/members`, { method: 'POST', body: JSON.stringify(data) }),
  collabRemoveMember: (docId: string, userId: string) => request(`/collab/${docId}/members/${userId}`, { method: 'DELETE' }),
  collabUpdateRole: (docId: string, userId: string, data: any) => request(`/collab/${docId}/members/${userId}/role`, { method: 'PUT', body: JSON.stringify(data) }),
  collabVersions: (docId: string) => request(`/collab/${docId}/versions`),
  collabSaveVersion: (docId: string) => request(`/collab/${docId}/versions`, { method: 'POST' }),
  collabGetVersion: (docId: string, versionId: string) => request(`/collab/${docId}/versions/${versionId}`),
  collabSearchUsers: (q: string) => request(`/collab/users/search?q=${encodeURIComponent(q)}`),
  collabChatMessages: (docId: string) => request(`/collab/${docId}/chat`),
  collabSendChat: (docId: string, content: string) => request(`/collab/${docId}/chat`, { method: 'POST', body: JSON.stringify({ content }) }),
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
