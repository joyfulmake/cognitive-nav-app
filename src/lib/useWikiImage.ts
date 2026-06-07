import { useState, useEffect } from 'react'

export interface WikiImageData {
  src: string
  caption: string
  articleUrl: string
  articleTitle: string
}

export function useWikiImage(query: string | null | undefined) {
  const [data, setData] = useState<WikiImageData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setData(null)
    const slug = encodeURIComponent(query.trim().replace(/ /g, '_'))
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
      headers: { 'Api-User-Agent': 'CognitiveNav/1.0 (educational)' },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(json => {
        if (cancelled) return
        if (json?.thumbnail?.source) {
          // Upsize the thumbnail to 480px wide
          const src = json.thumbnail.source.replace(/\/\d+px-/, '/480px-')
          setData({
            src,
            caption: json.description || json.displaytitle || query,
            articleUrl: json.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${slug}`,
            articleTitle: json.displaytitle || json.title || query,
          })
        } else {
          setData(null)
        }
      })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query])

  return { data, loading }
}
