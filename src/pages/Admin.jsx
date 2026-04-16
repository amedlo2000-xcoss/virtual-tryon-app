/**
 * 管理者ダッシュボード
 *
 * ── ユーザー削除機能について ─────────────────────────────────────────────────
 * supabase.auth.admin.deleteUser() はサービスロールキーが必要なため、
 * フロントエンドから直接呼び出すことはセキュリティ上推奨されません。
 * 本番環境では Supabase Edge Function を作成し、サーバー側で実行してください。
 *
 * Edge Function の実装例:
 *   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
 *   const supabaseAdmin = createClient(
 *     Deno.env.get('SUPABASE_URL'),
 *     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
 *   )
 *   // Deno.serve(async (req) => { const { userId } = await req.json()
 *   //   await supabaseAdmin.auth.admin.deleteUser(userId) })
 *
 * 現実装: is_banned = true のソフトデリートのみ対応。
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ── Supabase で実行が必要な SQL ──────────────────────────────────────────────
 * profiles テーブルの RLS を管理者が全件参照できるよう変更してください:
 *
 *   DROP POLICY IF EXISTS "自分のデータのみ参照" ON profiles;
 *   CREATE POLICY "自分または管理者が参照可能"
 *   ON profiles FOR SELECT
 *   USING (
 *     auth.uid() = id OR
 *     EXISTS (
 *       SELECT 1 FROM profiles p
 *       WHERE p.id = auth.uid() AND p.is_admin = true
 *     )
 *   );
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

// ─── 定数 ────────────────────────────────────────────────────────────────────
const ACCENT    = '#E8A0A8'
const PAGE_SIZE = 10

// ─── ユーティリティ ───────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// ─── サブコンポーネント ───────────────────────────────────────────────────────
function KpiCard({ label, value, loading }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      padding: '20px',
    }}>
      <p style={{ fontSize: '11px', color: '#999', fontWeight: 600, margin: '0 0 8px', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <div style={{ display: loading ? 'block' : 'none' }}>
        <div style={{
          height: '32px',
          background: '#F0EAE3',
          borderRadius: '8px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      </div>
      <p style={{
        display: loading ? 'none' : 'block',
        fontSize: '28px', fontWeight: 800, color: '#333', margin: 0, lineHeight: 1,
      }}>
        {value?.toLocaleString() ?? '—'}
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: '14px',
      height: '14px',
      border: '2px solid rgba(255,255,255,0.4)',
      borderTop: '2px solid #fff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}

// ─── 削除確認ダイアログ ───────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '24px',
        width: '320px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <p style={{ fontSize: '14px', color: '#333', margin: '0 0 24px', lineHeight: 1.6, textAlign: 'center' }}>
          {message}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onConfirm}
            style={{
              background: '#B91C1C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            削除する
          </button>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: `1.5px solid ${ACCENT}`,
              color: ACCENT,
              borderRadius: '20px',
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 編集モーダル ─────────────────────────────────────────────────────────────
function EditModal({ user, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name:     user.name     ?? '',
    is_admin: user.is_admin ?? false,
    is_banned: user.is_banned ?? false,
  })

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '24px',
        width: '360px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 800, color: '#333' }}>
          ユーザーを編集
        </h3>

        {/* 名前 */}
        <label style={{ display: 'block', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#999', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
            表示名
          </span>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="未設定"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1.5px solid #E8E0D8',
              fontSize: '14px',
              color: '#333',
              outline: 'none',
            }}
          />
        </label>

        {/* 管理者権限 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.is_admin}
            onChange={e => set('is_admin', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: ACCENT }}
          />
          <span style={{ fontSize: '14px', color: '#333', fontWeight: 600 }}>管理者権限</span>
        </label>

        {/* 停止状態 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.is_banned}
            onChange={e => set('is_banned', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: ACCENT }}
          />
          <span style={{ fontSize: '14px', color: '#333', fontWeight: 600 }}>停止中</span>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => onSave(form)}
            disabled={loading}
            style={{
              background: ACCENT,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <Spinner /> : '保存する'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: `1.5px solid ${ACCENT}`,
              color: ACCENT,
              borderRadius: '20px',
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function Admin() {
  const { signOut } = useAuth()
  const navigate    = useNavigate()

  // KPI
  const [kpi, setKpi]           = useState({})
  const [kpiLoading, setKpiLoading] = useState(true)

  // ユーザー一覧
  const [users, setUsers]         = useState([])
  const [userCount, setUserCount] = useState(0)
  const [page, setPage]           = useState(0)
  const [userLoading, setUserLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [toast, setToast]         = useState(null)

  // 削除確認ダイアログ
  const [confirmTarget, setConfirmTarget] = useState(null)

  // 編集モーダル
  const [editUser, setEditUser]       = useState(null)
  const [editLoading, setEditLoading] = useState(false)

  // ─── データ取得 ─────────────────────────────────────────────────────────────
  const loadKpi = useCallback(async () => {
    setKpiLoading(true)
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
    const week7ago   = daysAgo(7)

    const [
      { count: totalUsers },
      { count: todayNew },
      { count: monthNew },
      { count: tryonTotal },
      { count: closetTotal },
      { count: activeUsers },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString()),
      // AI試着回数は tryon_sessions テーブルから取得
      supabase.from('tryon_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('closet_items').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('last_login_at', week7ago),
    ])

    setKpi({ totalUsers, todayNew, monthNew, tryonTotal, closetTotal, activeUsers })
    setKpiLoading(false)
  }, [])

  const loadUsers = useCallback(async (pg = 0) => {
    setUserLoading(true)
    const from = pg * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const { data, count, error } = await supabase
      .from('profiles')
      .select('id, email, name, created_at, is_admin, is_banned, last_login_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error) {
      setUsers((data || []).map(u => ({ ...u, tryon_count: 0 })))
      setUserCount(count || 0)
    }
    setUserLoading(false)
  }, [])

  useEffect(() => {
    loadKpi()
    loadUsers(0)
  }, [loadKpi, loadUsers])

  // ─── ユーザー操作 ───────────────────────────────────────────────────────────
  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const handleBan = async (userId, currentBanned) => {
    setActionLoading(prev => ({ ...prev, [`ban_${userId}`]: true }))
    const newVal = !currentBanned
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: newVal })
      .eq('id', userId)

    if (error) {
      showToast('error', '操作に失敗しました: ' + error.message)
    } else {
      showToast('success', newVal ? 'ユーザーを停止しました' : '停止を解除しました')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: newVal } : u))
    }
    setActionLoading(prev => ({ ...prev, [`ban_${userId}`]: false }))
  }

  const handleDelete = (userId) => {
    setConfirmTarget(userId)
  }

  const executeDelete = async () => {
    const userId = confirmTarget
    setConfirmTarget(null)
    setActionLoading(prev => ({ ...prev, [`del_${userId}`]: true }))

    const [p1] = await Promise.all([
      supabase.from('profiles').delete().eq('id', userId),
      supabase.from('closet_items').delete().eq('user_id', userId),
      supabase.from('tryon_sessions').delete().eq('user_id', userId),
    ])

    if (p1.error) {
      showToast('error', '削除に失敗しました: ' + p1.error.message)
    } else {
      showToast('success', 'ユーザーを削除しました')
      setUsers(prev => prev.filter(u => u.id !== userId))
      setUserCount(c => c - 1)
    }
    setActionLoading(prev => ({ ...prev, [`del_${userId}`]: false }))
  }

  const handleSaveEdit = async (form) => {
    if (!editUser) return
    setEditLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ name: form.name, is_admin: form.is_admin, is_banned: form.is_banned })
      .eq('id', editUser.id)

    if (error) {
      showToast('error', '更新に失敗しました: ' + error.message)
    } else {
      showToast('success', '更新しました')
      setUsers(prev => prev.map(u =>
        u.id === editUser.id ? { ...u, ...form } : u
      ))
      setEditUser(null)
    }
    setEditLoading(false)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    loadUsers(newPage)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin-login', { replace: true })
  }

  const totalPages = Math.ceil(userCount / PAGE_SIZE)

  // ─── レンダリング ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#FAF5F0' }}>

      {/* ヘッダー */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #F0EAE3',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#333', margin: 0 }}>
            Miron 管理画面
          </h1>
          <p style={{ fontSize: '11px', color: '#E8A0A8', fontWeight: 600, margin: '2px 0 0', letterSpacing: '0.08em' }}>
            ADMIN DASHBOARD
          </p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none',
            border: '1px solid #E8E0D8',
            borderRadius: '20px',
            padding: '7px 16px',
            fontSize: '12px',
            color: '#888',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => (e.target.style.borderColor = '#E8A0A8')}
          onMouseLeave={e => (e.target.style.borderColor = '#E8E0D8')}
        >
          ログアウト
        </button>
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* ① KPIカード */}
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#888', margin: '0 0 16px', letterSpacing: '0.08em' }}>
          KPI サマリー
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <KpiCard label="総ユーザー数"                  value={kpi.totalUsers}  loading={kpiLoading} />
          <KpiCard label="本日の新規登録"                value={kpi.todayNew}    loading={kpiLoading} />
          <KpiCard label="今月の新規登録"                value={kpi.monthNew}    loading={kpiLoading} />
          <KpiCard label="AI試着 総回数"                 value={kpi.tryonTotal}  loading={kpiLoading} />
          <KpiCard label="クローゼット登録 総数"         value={kpi.closetTotal} loading={kpiLoading} />
          <KpiCard label="アクティブユーザー（7日以内）" value={kpi.activeUsers} loading={kpiLoading} />
        </div>

        {/* ② グラフ */}
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#888', margin: '0 0 16px', letterSpacing: '0.08em' }}>
          グラフ
        </h2>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '16px',
          textAlign: 'center',
          color: '#bbb',
          fontSize: '13px',
        }}>
          グラフ機能は準備中です
        </div>

        {/* ③ ユーザー一覧 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#888', margin: 0, letterSpacing: '0.08em' }}>
            ユーザー一覧
          </h2>
          <span style={{ fontSize: '12px', color: '#bbb' }}>
            全 {userCount.toLocaleString()} 件
          </span>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {/* テーブル（横スクロール対応） */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              minWidth: '600px',
            }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F0EAE3' }}>
                  {['メールアドレス', '登録日', 'AI試着', '最終ログイン', 'ステータス', '操作'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#999',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ローディングスケルトン行 (display:none で制御) */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`} style={{ display: userLoading ? '' : 'none', borderBottom: '1px solid #FAF5F0' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{
                          height: '14px',
                          background: '#F0EAE3',
                          borderRadius: '6px',
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* 空状態 (display:none で制御) */}
                <tr style={{ display: (!userLoading && users.length === 0) ? '' : 'none' }}>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#ccc' }}>
                    ユーザーが見つかりません
                  </td>
                </tr>

                {/* データ行 (display:none で制御) */}
                {users.map(u => (
                  <tr key={u.id} style={{
                    display: userLoading ? 'none' : '',
                    borderBottom: '1px solid #FAF5F0',
                    background: u.is_banned ? '#FFF8F7' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!u.is_banned) e.currentTarget.style.background = '#FAFAF8' }}
                  onMouseLeave={e => { e.currentTarget.style.background = u.is_banned ? '#FFF8F7' : 'transparent' }}
                  >
                    <td style={{ padding: '13px 16px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333', fontWeight: 500 }}>
                      {u.email || '—'}
                      {u.is_admin && (
                        <span style={{
                          marginLeft: '6px', fontSize: '10px', fontWeight: 700,
                          background: '#F5E6E8', color: '#E8A0A8',
                          padding: '2px 6px', borderRadius: '6px',
                        }}>
                          管理者
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#888', whiteSpace: 'nowrap' }}>
                      {formatDate(u.created_at)}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#333', fontWeight: 600, textAlign: 'center' }}>
                      {u.tryon_count}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#888', whiteSpace: 'nowrap' }}>
                      {formatDate(u.last_login_at)}
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: u.is_banned ? '#FEE2E2' : '#F0FAF4',
                        color:      u.is_banned ? '#B91C1C' : '#2D7D46',
                      }}>
                        {u.is_banned ? '停止中' : '有効'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {/* 編集ボタン */}
                        <button
                          onClick={() => setEditUser(u)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '12px',
                            border: `1px solid ${ACCENT}`,
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: '#FFFFFF',
                            color: ACCENT,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          編集
                        </button>

                        {/* 停止/解除ボタン */}
                        <button
                          onClick={() => handleBan(u.id, u.is_banned)}
                          disabled={!!actionLoading[`ban_${u.id}`] || u.is_admin}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: (actionLoading[`ban_${u.id}`] || u.is_admin) ? 'not-allowed' : 'pointer',
                            background: u.is_banned ? '#E8F5E9' : '#FFF3CD',
                            color:      u.is_banned ? '#2E7D32' : '#856404',
                            opacity: u.is_admin ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'opacity 0.15s',
                          }}
                        >
                          {actionLoading[`ban_${u.id}`] ? <Spinner /> : (u.is_banned ? '解除' : '停止')}
                        </button>

                        {/* 削除ボタン */}
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={!!actionLoading[`del_${u.id}`] || u.is_admin}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: (actionLoading[`del_${u.id}`] || u.is_admin) ? 'not-allowed' : 'pointer',
                            background: '#FEE2E2',
                            color: '#B91C1C',
                            opacity: u.is_admin ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'opacity 0.15s',
                          }}
                        >
                          {actionLoading[`del_${u.id}`] ? <Spinner /> : '削除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderTop: '1px solid #F0EAE3',
            }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                style={{
                  padding: '7px 14px',
                  borderRadius: '12px',
                  border: '1px solid #E8E0D8',
                  background: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: page === 0 ? '#ccc' : '#666',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                ← 前へ
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      border: 'none',
                      background: p === page ? ACCENT : '#FAF5F0',
                      color: p === page ? '#FFFFFF' : '#666',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    {p + 1}
                  </button>
                )
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '7px 14px',
                  borderRadius: '12px',
                  border: '1px solid #E8E0D8',
                  background: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: page >= totalPages - 1 ? '#ccc' : '#666',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                次へ →
              </button>
            </div>
          )}
        </div>

        <div style={{ height: '40px' }} />
      </div>

      {/* 削除確認ダイアログ */}
      {confirmTarget && (
        <ConfirmDialog
          message="このユーザーを削除しますか？この操作は取り消せません。"
          onConfirm={executeDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {/* 編集モーダル */}
      {editUser && (
        <EditModal
          user={editUser}
          onSave={handleSaveEdit}
          onClose={() => setEditUser(null)}
          loading={editLoading}
        />
      )}

      {/* トースト */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#2D7D46' : '#B91C1C',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 1000,
          animation: 'fadeInUp 0.3s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast.text}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
