import { forwardRef } from 'react'

const GOLD = '#c9a96e'
const GOLD_LIGHT = '#f0ddb0'
const GOLD_DARK = '#a07840'

const scoreLabels = {
  knowledge: '知的',
  friendly: '親しみ',
  cool: 'クール',
  sexy: 'セクシー',
  childlike: '童顔',
  soft: 'ソフト',
  sharp: 'シャープ',
  elegant: '上品',
  photogenic: 'フォトジェ\nニック',
}

const balanceLabels = {
  outline: '輪郭',
  santei: '三庭比率',
  cheek: '頬骨',
  symmetry: '左右対称',
  gravity: '重心',
  eline: 'Eライン',
  profile: '横顔',
  photogenic: 'フォトジェニック',
}

const adviceLabels = {
  angle: 'ベストアングル',
  avoidAngle: '避けるアングル',
  expression: '表情',
  light: 'ライティング',
  background: '背景',
  faceWork: 'フェイスワーク',
}

function Stars({ value }) {
  return (
    <span style={{ color: GOLD, fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(value)}
      <span style={{ color: '#ddd' }}>{'★'.repeat(5 - value)}</span>
    </span>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      textAlign: 'center',
      margin: '20px 0 12px',
      position: 'relative',
    }}>
      <div style={{
        display: 'inline-block',
        padding: '4px 20px',
        border: `1px solid ${GOLD}`,
        color: GOLD_DARK,
        fontSize: 12,
        letterSpacing: '0.15em',
        fontWeight: 700,
        background: '#fff',
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </div>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 1,
        background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
        zIndex: 0,
      }} />
    </div>
  )
}

const KarteCard = forwardRef(function KarteCard({ data }, ref) {
  if (!data) return null

  return (
    <div
      ref={ref}
      style={{
        background: '#fff',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
        color: '#333',
        paddingBottom: 24,
        boxShadow: '0 2px 24px rgba(0,0,0,0.12)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {/* ヘッダー */}
      <div style={{
        background: `linear-gradient(135deg, ${GOLD_DARK} 0%, ${GOLD} 60%, ${GOLD_LIGHT} 100%)`,
        padding: '20px 24px 16px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', opacity: 0.85, marginBottom: 6 }}>
          AI FACE ANALYSIS REPORT
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.1em' }}>
          顔診断カルテ
        </div>
        <div style={{
          margin: '8px auto 0',
          width: 40,
          height: 1,
          background: 'rgba(255,255,255,0.6)',
        }} />
      </div>

      {/* 第一印象バナー */}
      <div style={{
        background: '#fdf8f2',
        borderTop: `2px solid ${GOLD}`,
        borderBottom: `1px solid ${GOLD_LIGHT}`,
        padding: '14px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, color: GOLD_DARK, letterSpacing: '0.2em', marginBottom: 4 }}>
          FIRST IMPRESSION
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2a2a2a', marginBottom: 4 }}>
          {data.firstImpression}
        </div>
        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
          {data.firstImpressionSub}
        </div>
      </div>

      {/* 3カラム: スコア・パーツ・バランス */}
      <div style={{ display: 'flex', gap: 0, margin: '0 0' }}>
        {/* スコア */}
        <div style={{
          flex: 1,
          padding: '12px 8px',
          borderRight: `1px solid ${GOLD_LIGHT}`,
        }}>
          <div style={{ fontSize: 9, color: GOLD_DARK, letterSpacing: '0.15em', textAlign: 'center', marginBottom: 8 }}>
            SCORES
          </div>
          {Object.entries(data.scores ?? {}).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#555', whiteSpace: 'pre-line', lineHeight: 1.2, marginBottom: 2 }}>
                {scoreLabels[k] ?? k}
              </div>
              <Stars value={v} />
            </div>
          ))}
        </div>

        {/* パーツ */}
        <div style={{
          flex: 1.4,
          padding: '12px 8px',
          borderRight: `1px solid ${GOLD_LIGHT}`,
        }}>
          <div style={{ fontSize: 9, color: GOLD_DARK, letterSpacing: '0.15em', textAlign: 'center', marginBottom: 8 }}>
            PARTS
          </div>
          {Object.entries(data.parts ?? {}).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 9,
                color: GOLD_DARK,
                letterSpacing: '0.1em',
                borderBottom: `1px solid ${GOLD_LIGHT}`,
                paddingBottom: 2,
                marginBottom: 3,
              }}>
                {k.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#222', marginBottom: 2 }}>{v.name}</div>
              <div style={{ fontSize: 10, color: '#666', lineHeight: 1.5 }}>{v.desc}</div>
            </div>
          ))}
        </div>

        {/* バランス */}
        <div style={{ flex: 1.2, padding: '12px 8px' }}>
          <div style={{ fontSize: 9, color: GOLD_DARK, letterSpacing: '0.15em', textAlign: 'center', marginBottom: 8 }}>
            BALANCE
          </div>
          {Object.entries(data.balance ?? {}).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 7 }}>
              <div style={{ fontSize: 9, color: GOLD_DARK, letterSpacing: '0.08em', marginBottom: 2 }}>
                {balanceLabels[k] ?? k}
              </div>
              <div style={{ fontSize: 10, color: '#444', lineHeight: 1.5 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 印象分析 */}
      <SectionTitle>IMPRESSION ANALYSIS</SectionTitle>
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['第一印象', data.impression?.first],
          ['印象タイプ', data.impression?.type],
          ['強み', data.impression?.strength],
          ['弱点', data.impression?.weak],
        ].map(([label, value]) => (
          <div key={label} style={{
            background: '#fdf8f2',
            border: `1px solid ${GOLD_LIGHT}`,
            borderRadius: 4,
            padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, color: GOLD_DARK, letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 顔タイプ + 総合評価 */}
      <SectionTitle>FACE TYPE</SectionTitle>
      <div style={{
        margin: '0 20px',
        padding: '12px 16px',
        background: `linear-gradient(135deg, #fdf8f2, #fff)`,
        border: `1px solid ${GOLD}`,
        borderRadius: 4,
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: GOLD_DARK, letterSpacing: '0.15em' }}>FACE TYPE</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#222', marginTop: 4 }}>{data.faceType}</div>
          </div>
          <div style={{ width: 1, background: GOLD_LIGHT }} />
          <div>
            <div style={{ fontSize: 9, color: GOLD_DARK, letterSpacing: '0.15em' }}>AGE TYPE</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#222', marginTop: 4 }}>{data.ageType}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: GOLD_DARK, marginBottom: 4 }}>
          {data.overallType}
        </div>
        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>{data.overallTypeSub}</div>
      </div>

      {/* 強み・改善・スタイル */}
      <SectionTitle>ANALYSIS</SectionTitle>
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          ['強み', data.strengths, '#e8f5e9', '#2e7d32'],
          ['改善点', data.improvements, '#fff3e0', '#e65100'],
          ['スタイル', data.styles, '#e8eaf6', '#283593'],
        ].map(([label, items, bg, color]) => (
          <div key={label} style={{
            background: bg,
            borderRadius: 4,
            padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, color, letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>
              {label}
            </div>
            {(items ?? []).map((item, i) => (
              <div key={i} style={{ fontSize: 10, color: '#333', marginBottom: 4, lineHeight: 1.5 }}>
                · {item}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* アドバイス6項目 */}
      <SectionTitle>PHOTO ADVICE</SectionTitle>
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(data.advice ?? {}).map(([k, v]) => (
          <div key={k} style={{
            background: '#fdf8f2',
            border: `1px solid ${GOLD_LIGHT}`,
            borderRadius: 4,
            padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, color: GOLD_DARK, letterSpacing: '0.1em', marginBottom: 3 }}>
              {adviceLabels[k] ?? k}
            </div>
            <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* フッター */}
      <div style={{
        marginTop: 20,
        padding: '10px 0',
        borderTop: `1px solid ${GOLD_LIGHT}`,
        textAlign: 'center',
        fontSize: 9,
        color: '#aaa',
        letterSpacing: '0.2em',
      }}>
        Powered by Claude Vision AI · AI FACE KARTE
      </div>
    </div>
  )
})

export default KarteCard
