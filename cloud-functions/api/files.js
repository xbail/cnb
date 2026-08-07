import { getStore } from '@edgeone/pages-blob'

export async function onRequestGet(context) {
  try {
    const store = getStore('cnb-files')
    const { blobs } = await store.list({ consistency: 'strong' })

    const records = []
    for (const b of blobs) {
      const key = b.key
      if (key.endsWith('.meta.json')) continue

      let meta = null
      try {
        meta = await store.get(key + '.meta.json', { type: 'json', consistency: 'strong' })
      } catch {
        // ignore
      }

      const name = (meta && meta.name) || key.split('/').pop() || key
      const size = (meta && meta.size) || 0
      const type = (meta && meta.type) || 'application/octet-stream'
      const createdAt = (meta && meta.createdAt) || ''

      records.push({
        id: key,
        key,
        url: '/api/file?key=' + encodeURIComponent(key),
        thumbnailUrl: meta && meta.thumbKey ? '/api/file?key=' + encodeURIComponent(meta.thumbKey) : undefined,
        name,
        size,
        type,
        createdAt,
      })
    }

    records.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0))

    return json({ code: 0, msg: 'ok', data: records })
  } catch (e) {
    return json({ code: 500, msg: 'list failed', data: { message: e && e.message ? e.message : 'unknown error' } }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}