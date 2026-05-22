'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiDelete, apiPut, AdminStats, AdminUser } from '@/lib/api';
import styles from './admin.module.css';

type Tab = 'stats' | 'users';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Verify admin role on mount
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        await apiGet('/api/admin/stats');
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      }
    };
    verifyAdmin();
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiGet<AdminStats>('/api/admin/stats');
      setStats(data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : '無法載入統計資料');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiGet<AdminUser[]>('/api/admin/users');
      setUsers(data);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : '無法載入用戶列表');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
    }
  }, [isAdmin, fetchStats, fetchUsers]);

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`確定要刪除用戶「${username}」嗎？此操作無法撤銷。`)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiDelete(`/api/admin/users/${userId}`);
      setActionSuccess(`已刪除用戶「${username}」`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string, username: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiPut(`/api/admin/users/${userId}/role`, { role: newRole });
      setActionSuccess(`已將「${username}」改為 ${newRole === 'admin' ? '管理員' : '一般用戶'}`);
      fetchUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失敗');
    }
  };

  // Loading / not-admin state
  if (isAdmin === null) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>載入中...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.denied}>
          <h2>⛔ 無權限</h2>
          <p>此頁面僅限管理員訪問。</p>
          <a href="/dashboard" className={styles.backLink}>← 返回儀表板</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <a href="/dashboard" className={styles.backBtn}>← 返回</a>
        <h1 className={styles.title}>🔧 管理員儀表板</h1>
      </div>

      {/* Tab nav */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'stats' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 統計概覽
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 用戶管理
        </button>
      </div>

      {/* Feedback messages */}
      {actionError && <div className={styles.errorMsg}>{actionError}</div>}
      {actionSuccess && <div className={styles.successMsg}>{actionSuccess}</div>}

      {/* ── Stats tab ─────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className={styles.statsGrid}>
          {loadingStats ? (
            <div className={styles.skeleton} />
          ) : statsError ? (
            <div className={styles.errorCard}>{statsError}</div>
          ) : (
            <>
              {/* KPI cards */}
              <div className={styles.kpiCard}>
                <span className={styles.kpiVal}>{stats?.total_users ?? 0}</span>
                <span className={styles.kpiLabel}>總用戶數</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiVal}>{stats?.total_logs ?? 0}</span>
                <span className={styles.kpiLabel}>總記錄數</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiVal}>{stats?.new_users_today ?? 0}</span>
                <span className={styles.kpiLabel}>今日新用戶</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiVal}>{stats?.logs_today ?? 0}</span>
                <span className={styles.kpiLabel}>今日記錄數</span>
              </div>

              {/* Top foods */}
              <section className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>🏆 熱門食物 TOP 10</h2>
                {stats?.top_foods && stats.top_foods.length > 0 ? (
                  <ul className={styles.topFoods}>
                    {stats.top_foods.map((food, i) => (
                      <li key={i} className={styles.topFoodItem}>
                        <span className={styles.foodRank}>#{i + 1}</span>
                        <span className={styles.foodName}>{food.food_name}</span>
                        <span className={styles.foodCount}>{food.count} 次</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.empty}>暫無資料</p>
                )}
              </section>

              {/* Weekly user trend */}
              <section className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>📈 本週新用戶趨勢</h2>
                {stats?.weekly_new_users_trend && stats.weekly_new_users_trend.length > 0 ? (
                  <div className={styles.trendBars}>
                    {stats.weekly_new_users_trend.map((item, i) => (
                      <div key={i} className={styles.trendItem}>
                        <span className={styles.trendDate}>{item.date.slice(5)}</span>
                        <div className={styles.trendBar}
                          style={{ height: `${Math.min((item.count / Math.max(...stats.weekly_new_users_trend.map(t => t.count))) * 60, 4)}px` }}
                        />
                        <span className={styles.trendCount}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.empty}>暫無資料</p>
                )}
              </section>

              {/* Weekly food log trend */}
              <section className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>🍽️ 本週飲食記錄趨勢</h2>
                {stats?.weekly_food_logs_trend && stats.weekly_food_logs_trend.length > 0 ? (
                  <div className={styles.trendBars}>
                    {stats.weekly_food_logs_trend.map((item, i) => (
                      <div key={i} className={styles.trendItem}>
                        <span className={styles.trendDate}>{item.date.slice(5)}</span>
                        <div className={styles.trendBar}
                          style={{ height: `${Math.min((item.count / Math.max(...stats.weekly_food_logs_trend.map(t => t.count))) * 60, 4)}px` }}
                        />
                        <span className={styles.trendCount}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.empty}>暫無資料</p>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* ── Users tab ────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className={styles.usersSection}>
          {loadingUsers ? (
            <div className={styles.skeleton} />
          ) : usersError ? (
            <div className={styles.errorCard}>{usersError}</div>
          ) : users.length === 0 ? (
            <div className={styles.empty}>目前沒有用戶資料</div>
          ) : (
            <div className={styles.usersTable}>
              <div className={styles.tableHeader}>
                <span>用戶名</span>
                <span>Email</span>
                <span>角色</span>
                <span>熱量限制</span>
                <span>註冊日期</span>
                <span>操作</span>
              </div>
              {users.map((user) => (
                <div key={user.id} className={styles.tableRow}>
                  <span className={styles.username}>{user.username}</span>
                  <span className={styles.email}>{user.email}</span>
                  <span>
                    <span className={`${styles.roleBadge} ${user.role === 'admin' ? styles.roleAdmin : styles.roleUser}`}>
                      {user.role === 'admin' ? '管理員' : '用戶'}
                    </span>
                  </span>
                  <span>{user.daily_calorie_limit} kcal</span>
                  <span>{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-TW') : '-'}</span>
                  <span className={styles.actions}>
                    <button
                      className={styles.btnRole}
                      onClick={() => handleToggleRole(user.id, user.role, user.username)}
                      title={user.role === 'admin' ? '降為一般用戶' : '升為管理員'}
                    >
                      {user.role === 'admin' ? '👤' : '🔑'}
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      title="刪除用戶"
                    >
                      🗑️
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}