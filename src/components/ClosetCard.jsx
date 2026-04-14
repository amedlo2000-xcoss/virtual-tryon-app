export default function ClosetCard({ item, isSelected, onSelect, onDelete }) {
  return (
    <div className={`closet-card${isSelected ? ' closet-card--selected' : ''}`}>
      <div className="closet-card__image">
        <img src={item.image_url} alt={item.name} />
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
