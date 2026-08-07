import { getStore } from '@edgeone/pages-blob'

export async function onRequestPost(context) {
  try {
    let body = {}
    try {
      body = await context.request.json()
    } catch {
      // ignore
    }

    const key = body.key || ''
    const name = body.name || 'file'
    const size = Number(body.size) || 0
    const type = body.type || 'application/octet-stream'
    const thumbKey = body.thumbKey || ''
    const createdAt = body.createdAt || new Date().toISOString()

    if (!key) {
      return json({ code: 400, msg: 'missing key' }, 400)
    }

    const store = getStore('cnb-files')
    await store.setJSON(key + '.meta.json', {
      key,
      name,
      size,
      type,
      thumbKey,
      createdAt,
    })

    return json({ code: 0, msg: 'ok', data: { key, url: '/api/file?key=' + encodeURIComponent(key) } })
  } catch (e) {
    return json({ code: 500, msg: 'confirm failed', data: { message: e && e.message ? e.message : 'unknown error' } }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}