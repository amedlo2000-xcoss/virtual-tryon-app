const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `あなたは顔診断の専門家です。送られてきた顔写真を詳細に分析し、必ず以下のJSON形式のみで返答してください。説明文や前置きは一切不要です。JSONのみ返してください。

{
  "firstImpression": "第一印象を表す一言（例：知的で落ち着いた印象）",
  "firstImpressionSub": "補足説明（1〜2文）",
  "faceType": "顔タイプ（例：面長・丸顔・卵形・逆三角形・四角形）",
  "ageType": "見た目年齢タイプ（例：実年齢より若く見える）",
  "overallType": "総合タイプ（例：知的クールビューティー）",
  "overallTypeSub": "総合タイプの補足（1〜2文）",
  "scores": {
    "knowledge": 整数1〜5,
    "friendly": 整数1〜5,
    "cool": 整数1〜5,
    "sexy": 整数1〜5,
    "childlike": 整数1〜5,
    "soft": 整数1〜5,
    "sharp": 整数1〜5,
    "elegant": 整数1〜5,
    "photogenic": 整数1〜5
  },
  "parts": {
    "eye": { "name": "目のタイプ名", "desc": "特徴の説明" },
    "brow": { "name": "眉のタイプ名", "desc": "特徴の説明" },
    "nose": { "name": "鼻のタイプ名", "desc": "特徴の説明" },
    "mouth": { "name": "口のタイプ名", "desc": "特徴の説明" },
    "outline": { "name": "輪郭のタイプ名", "desc": "特徴の説明" }
  },
  "balance": {
    "outline": "輪郭バランスの評価",
    "santei": "三庭比率の評価",
    "cheek": "頬骨バランスの評価",
    "symmetry": "左右対称性の評価",
    "gravity": "重心の評価",
    "eline": "Eラインの評価",
    "profile": "横顔の評価",
    "photogenic": "フォトジェニック度の評価"
  },
  "impression": {
    "first": "第一印象の詳細",
    "type": "印象タイプ",
    "strength": "印象の強み",
    "weak": "印象の弱点"
  },
  "strengths": ["強み1", "強み2", "強み3"],
  "improvements": ["改善点1", "改善点2", "改善点3"],
  "styles": ["似合うスタイル1", "似合うスタイル2", "似合うスタイル3"],
  "advice": {
    "angle": "ベストアングルのアドバイス",
    "avoidAngle": "避けるべきアングル",
    "expression": "表情のアドバイス",
    "light": "ライティングのアドバイス",
    "background": "背景のアドバイス",
    "faceWork": "フェイスワークのアドバイス"
  }
}`

export async function analyzeImage(base64Image, mimeType) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('.env の VITE_CLAUDE_API_KEY に有効な Claude API キーを設定してください')
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'この顔写真を詳細に診断してください。JSONのみ返してください。',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API エラー: ${response.status}`)
  }

  const result = await response.json()
  const text = result.content?.[0]?.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('JSONの解析に失敗しました')
  return JSON.parse(jsonMatch[0])
}
