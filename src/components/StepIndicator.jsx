export default function StepIndicator({ current, total }) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '10px' }}>
        <span style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#E8A0A8',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          {pad(current)}
        </span>
        <span style={{ fontSize: '13px', color: '#C9A96E', fontWeight: 600 }}>
          &nbsp;/&nbsp;{pad(total)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {Array.from({ length: total }, (_, i) => {
          const s = i + 1
          return (
            <div key={i} style={{
              flex: 1,
              height: '4px',
              borderRadius: '4px',
              background: s < current ? '#F5C4CA' : s === current ? '#E8A0A8' : '#E8E3DC',
              transition: 'background 0.3s',
            }} />
          )
        })}
      </div>
    </div>
  )
}
