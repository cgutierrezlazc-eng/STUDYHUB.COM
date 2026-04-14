import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { api } from '../../services/api';
import { useI18n } from '../../services/i18n';
import {
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Medal,
  BookOpen,
  ClipboardList,
} from '../../components/Icons';

export default function CertificationsModule() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [progressData, setProgressData] = useState<any>(null);
  const [certSearch, setCertSearch] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string[]>>({});
  const [certScoreOverride, setCertScoreOverride] = useState(100);
  const [certifying, setCertifying] = useState(false);
  const [certMessage, setCertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user?.role !== 'owner') return;
    loadProgressOverview();
  }, []);

  const loadProgressOverview = async () => {
    setCertLoading(true);
    try {
      const data = await api.adminGetProgressOverview();
      setProgressData(data);
    } catch (e: any) {
      console.error('Failed to load progress overview:', e);
    }
    setCertLoading(false);
  };

  const toggleCourseSelection = (userId: string, courseId: string) => {
    setSelectedUsers((prev) => {
      const current = prev[userId] || [];
      const updated = current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId];
      return { ...prev, [userId]: updated };
    });
  };

  const selectAllCoursesForUser = (userId: string, courseIds: string[]) => {
    setSelectedUsers((prev) => {
      const current = prev[userId] || [];
      const allSelected = courseIds.every((id) => current.includes(id));
      return { ...prev, [userId]: allSelected ? [] : courseIds };
    });
  };

  const handleCertify = async (userId: string) => {
    const courseIds = selectedUsers[userId] || [];
    if (courseIds.length === 0) return;
    setCertifying(true);
    setCertMessage(null);
    try {
      const result = await api.adminCertifyUser(userId, courseIds, certScoreOverride);
      setCertMessage({ type: 'success', text: result.message || t('ceo.certIssued') });
      setSelectedUsers((prev) => ({ ...prev, [userId]: [] }));
      await loadProgressOverview();
    } catch (e: any) {
      setCertMessage({ type: 'error', text: e.message || t('ceo.errorSending') });
    }
    setCertifying(false);
  };

  const handleRevokeCert = async (userId: string, courseId: string, courseTitle: string) => {
    if (!confirm(t('ceo.revokeCertConfirm').replace('{title}', courseTitle))) return;
    try {
      await api.adminRevokeCertificate(userId, courseId);
      setCertMessage({ type: 'success', text: t('ceo.certRevoked') });
      await loadProgressOverview();
    } catch (e: any) {
      setCertMessage({ type: 'error', text: e.message || t('ceo.errorDeleting') });
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ fontSize: 17, margin: '0 0 4px' }}>
            {GraduationCap({ size: 18 })} {t('ceo.certManagement')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {t('ceo.certManagementDesc')}
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadProgressOverview}
          disabled={certLoading}
        >
          {RefreshCw({ size: 14 })} {t('ceo.refresh')}
        </button>
      </div>

      {/* Message */}
      {certMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
            background:
              certMessage.type === 'success' ? 'rgba(5,150,105,0.06)' : 'rgba(239,68,68,0.06)',
            color: certMessage.type === 'success' ? '#059669' : '#DC2626',
            border: `1px solid ${certMessage.type === 'success' ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.15)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {certMessage.type === 'success' ? CheckCircle({ size: 14 }) : AlertTriangle({ size: 14 })}{' '}
          {certMessage.text}
          <button
            onClick={() => setCertMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: 'inherit',
            }}
          >
            ×
          </button>
        </div>
      )}

      {certLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : progressData ? (
        <>
          {/* Summary cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: t('ceo.activeStudents'),
                value: progressData.summary.totalUsersWithProgress,
                icon: Users({ size: 24 }),
                color: '#2D62C8',
              },
              {
                label: t('ceo.certsIssued'),
                value: progressData.summary.totalCertificatesIssued,
                icon: Medal({ size: 24 }),
                color: '#059669',
              },
              {
                label: t('ceo.coursesInProgress'),
                value: progressData.summary.totalInProgress,
                icon: BookOpen({ size: 24 }),
                color: '#C4882A',
              },
              {
                label: t('ceo.totalCourses'),
                value: progressData.summary.totalCourses,
                icon: BookOpen({ size: 24 }),
                color: '#5B5FC7',
              },
            ].map((card, i) => (
              <div key={i} className="u-card" style={{ padding: 16, textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 24,
                    marginBottom: 4,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Score override */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t('ceo.scoreOnCertify')}</span>
            {[80, 90, 100].map((s) => (
              <button
                key={s}
                onClick={() => setCertScoreOverride(s)}
                style={{
                  padding: '4px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: certScoreOverride === s ? '2px solid #2D62C8' : '1px solid var(--border)',
                  background: certScoreOverride === s ? 'rgba(26,58,122,0.08)' : '#fff',
                  color: certScoreOverride === s ? '#2D62C8' : 'var(--text-secondary)',
                }}
              >
                {s}%
              </button>
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {t('ceo.scoreAssigned')}
            </span>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder={t('ceo.searchByNameOrEmail')}
            value={certSearch}
            onChange={(e) => setCertSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 14,
              marginBottom: 16,
              background: '#fff',
              color: 'var(--text-primary)',
            }}
          />

          {/* Users list */}
          {(progressData.users as any[])
            .filter((u: any) => {
              if (!certSearch) return true;
              const q = certSearch.toLowerCase();
              return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            })
            .map((userData: any) => {
              const userSelected = selectedUsers[userData.userId] || [];
              const incompleteCourses = progressData.courses.filter(
                (c: any) =>
                  !userData.courses.some((uc: any) => uc.courseId === c.id && uc.completed)
              );
              const completedCourses = userData.courses.filter((c: any) => c.completed);

              return (
                <div
                  key={userData.userId}
                  className="u-card"
                  style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}
                >
                  {/* User header */}
                  <div
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#2D62C8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{userData.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {userData.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                        {Medal({ size: 14 })} {userData.completedCount} {t('ceo.completed')}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {BookOpen({ size: 14 })} {userData.totalStarted} {t('ceo.started')}
                      </span>
                      {userSelected.length > 0 && (
                        <button
                          onClick={() => handleCertify(userData.userId)}
                          disabled={certifying}
                          style={{
                            padding: '6px 16px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            background: '#059669',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {certifying ? (
                            '...'
                          ) : (
                            <>
                              {GraduationCap({ size: 14 })} {t('ceo.certifyCourses')}{' '}
                              {userSelected.length} {t('ceo.course')}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Courses grid */}
                  <div style={{ padding: '12px 18px' }}>
                    {/* Completed courses */}
                    {completedCourses.length > 0 && (
                      <div
                        style={{
                          marginBottom:
                            completedCourses.length > 0 && incompleteCourses.length > 0 ? 12 : 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#059669',
                            marginBottom: 6,
                          }}
                        >
                          {CheckCircle({ size: 12 })} {t('ceo.certsObtained')}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {completedCourses.map((c: any) => (
                            <div
                              key={c.courseId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '5px 10px',
                                borderRadius: 6,
                                fontSize: 12,
                                background: 'rgba(5,150,105,0.06)',
                                border: '1px solid rgba(5,150,105,0.15)',
                                color: '#059669',
                              }}
                            >
                              <span>{c.courseEmoji}</span>
                              <span style={{ fontWeight: 500 }}>{c.courseTitle}</span>
                              <span style={{ color: 'var(--text-muted)' }}>({c.quizScore}%)</span>
                              <button
                                onClick={() =>
                                  handleRevokeCert(userData.userId, c.courseId, c.courseTitle)
                                }
                                title={t('ceo.revokeTooltip')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#DC2626',
                                  fontSize: 12,
                                  padding: '0 2px',
                                  marginLeft: 2,
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* In-progress + available to certify */}
                    {incompleteCourses.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            marginBottom: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>
                            {ClipboardList({ size: 12 })} {t('ceo.availableToCertify')}
                          </span>
                          <button
                            onClick={() =>
                              selectAllCoursesForUser(
                                userData.userId,
                                incompleteCourses.map((c: any) => c.id)
                              )
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 10,
                              color: '#2D62C8',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {incompleteCourses.every((c: any) => userSelected.includes(c.id))
                              ? t('ceo.deselectAll')
                              : t('ceo.selectAll')}
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {incompleteCourses.map((c: any) => {
                            const inProgress = userData.courses.find(
                              (uc: any) => uc.courseId === c.id
                            );
                            const isSelected = userSelected.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                onClick={() => toggleCourseSelection(userData.userId, c.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  background: isSelected ? 'rgba(26,58,122,0.08)' : '#fff',
                                  border: `1.5px solid ${isSelected ? '#2D62C8' : 'var(--border)'}`,
                                  color: isSelected ? '#2D62C8' : 'var(--text-secondary)',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <span
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 4,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isSelected ? '#2D62C8' : 'transparent',
                                    border: isSelected ? 'none' : '2px solid var(--border)',
                                    color: '#fff',
                                    fontSize: 10,
                                  }}
                                >
                                  {isSelected && '✓'}
                                </span>
                                <span>{c.emoji}</span>
                                <span style={{ fontWeight: 500 }}>{c.title}</span>
                                {inProgress && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      background: 'rgba(196,136,42,0.1)',
                                      color: '#C4882A',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {inProgress.lessonProgress}%
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {completedCourses.length === progressData.courses.length && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: 12,
                          color: '#059669',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {CheckCircle({ size: 16 })} {t('ceo.allCoursesCompleted')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          {progressData.users.length === 0 && (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">{ClipboardList({ size: 48 })}</div>
              <h3>{t('ceo.noActivityYet')}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{t('ceo.noActivityDesc')}</p>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-icon">{GraduationCap({ size: 48 })}</div>
          <h3>{t('ceo.loadProgressData')}</h3>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={loadProgressOverview}
          >
            {t('ceo.loadData')}
          </button>
        </div>
      )}
    </div>
  );
}
