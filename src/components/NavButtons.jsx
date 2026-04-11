import { useNavigate, useLocation } from 'react-router-dom'

// 下部ナビゲーション
function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '👗', label: 'Try', path: '/upload-user' },
    { icon: '👚', label: 'Closet', path: '/upload-clothes' },
    { icon: '❤️', label: 'Like', path: '/result' },
    { icon: '👤', label: 'My', path: '/mypage' },
  ]

  return (
    <div className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * NavButtons
 * prevPath  : 戻るボタンの遷移先
 * nextPath  : 次へボタンの遷移先
 * prevLabel : 戻るボタンのラベル
 * nextLabel : 次へボタンのラベル
 * onNext    : 次へ押下時に追加で実行する処理
 */
export default function NavButtons({
  prevPath,
  nextPath,
  prevLabel = '戻る',
  nextLabel = '次へ',
  onNext,
}) {
  const navigate = useNavigate()

  const handleNext = () => {
    if (onNext) onNext()
    if (nextPath) navigate(nextPath)
  }

  return (
    <>
      <div className="button-row">
        {prevPath && (
          <button className="btn-back" onClick={() => navigate(prevPath)}>
            {prevLabel}
          </button>
        )}
        {nextPath && (
          <button className="btn-next" onClick={handleNext}>
            {nextLabel}
          </button>
        )}
      </div>
      <BottomNav />
    </>
  )
}