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

      // 跳过没有 meta 的孤立文件（如视频缩略图），避免列表出现 size:0 垃圾记录
      if (!meta) continue

      records.push({
        id: key,
        key,
        url: '/api/file?key=' + encodeURIComponent(key),
        thumbnailUrl: meta.thumbKey ? '/api/file?key=' + encodeURIComponent(meta.thumbKey) : undefined,
        name: meta.name || key.split('/').pop() || key,
        size: meta.size || 0,
        type: meta.type || 'application/octet-stream',
        createdAt: meta.createdAt || '',
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