import { useTryOn } from '../context/TryOnContext'
import ShareButton from '../components/ShareButton'
import NavButtons from '../components/NavButtons'

export default function CoordinateResult() {
  const { userImage, combinedOutfit } = useTryOn()

  const handleAITryOn = () => {
    // TODO: AI試着の実装（後ほど追加）
    alert('AI試着機能は近日公開予定です！')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">コーデ確認</h1>
        <p className="page-desc">あなたとコーデを確認しましょう</p>
      </div>

      <div className="page-content">
        {/* あなたの写真 */}
        {userImage ? (
          <div className="portrait-preview" style={{ marginBottom: '16px' }}>
            <img src={userImage} alt="あなたの写真" />
          </div>
        ) : (
          <div className="result-placeholder" style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '40px' }}>👤</span>
            <p style={{ fontSize: '13px' }}>
              あなたの写真がありません<br />
              <span style={{ fontSize: '12px', color: '#bbb' }}>
                /upload-user から写真を追加できます
              </span>
            </p>
          </div>
        )}

        {/* 選択したコーデ */}
        {(combinedOutfit?.closetItem || combinedOutfit?.newClothes) && (
          <>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '10px' }}>
              選択したコーデ
            </p>
            <div className="coordinate-preview" style={{ marginBottom: '20px' }}>
              {combinedOutfit?.closetItem && (
                <div className="coordinate-slot">
                  <p className="coordinate-slot__label">クローゼット</p>
                  <div className="coordinate-slot__image">
                    <img
                      src={combinedOutfit.closetItem.image_url}
                      alt={combinedOutfit.closetItem.name}
                    />
                  </div>
                </div>
              )}
              {combinedOutfit?.newClothes && (
                <div className="coordinate-slot">
                  <p className="coordinate-slot__label">新しい服</p>
                  <div className="coordinate-slot__image">
                    <img src={combinedOutfit.newClothes} alt="新しい服" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ボタン群（縦並び） */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn-primary" onClick={handleAITryOn}>
            AI試着する
          </button>
          <ShareButton imageUrl={userImage} />
        </div>
      </div>

      <NavButtons prevPath="/coordinate" />
    </div>
  )
}
