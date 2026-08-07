import { getStore } from '@edgeone/pages-blob'

export async function onRequestPost(context) {
  try {
    let body = {}
    try {
      body = await context.request.json()
    } catch {
      // ignore
    }

    const name = body.name || 'file'
    const contentType = body.contentType || 'application/octet-stream'
    const ext = (name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/gi, '') || 'bin'
    const uuid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    const key = `uploads/${uuid}.${ext}`

    const store = getStore('cnb-files')
    const { url } = await store.createUploadUrl(key, {
      expireSeconds: 3600,
      contentType,
    })

    return json({ code: 0, msg: 'ok', data: { upload_url: url, key, name: `${uuid}.${ext}` } })
  } catch (e) {
    return json({ code: 500, msg: 'sign failed', data: { message: e && e.message ? e.message : 'unknown error' } }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}