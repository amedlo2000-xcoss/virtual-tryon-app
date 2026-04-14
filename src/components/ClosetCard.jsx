const BADGE_COLORS = {
  tops: { bg: '#EBF4FF', color: '#2D6EA6' },
  bottoms: { bg: '#F0EBFF', color: '#6B42C8' },
  'one-pieces': { bg: '#FFF0EB', color: '#C85A28' },
}

export default function ClosetCard({ item, isSelected, onSelect, onDelete }) {
  const badge = item.fashn_category ? BADGE_COLORS[item.fashn_category] : null

  return (
    <div className={`closet-card${isSelected ? ' closet-card--selected' : ''}`}>
      <div className="closet-card__image" style={{ position: 'relative' }}>
        <img src={item.image_url} alt={item.name} />
        {item.category && (
          <span style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: 700,
            background: badge?.bg || '#F0F0F0',
            color: badge?.color || '#666',
            lineHeight: 1.6,
          }}>
            {item.category}
          </span>
        )}
      </div>
      <div className="closet-card__body">
        <p className="closet-card__name">{item.name}</p>
        <div className="closet-card__actions">
          <button
            className={`closet-card__btn${isSelected ? ' closet-card__btn--selected' : ' closet-card__btn--select'}`}
            onClick={onSelect}
          >
            {isSelected ? '選択中' : '選択'}
          </button>
          <button
            className="closet-card__btn closet-card__btn--delete"
            onClick={onDelete}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
