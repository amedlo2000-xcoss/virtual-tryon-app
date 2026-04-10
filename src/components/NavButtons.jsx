import { useNavigate } from 'react-router-dom'

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
  )
}