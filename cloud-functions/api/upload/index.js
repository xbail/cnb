import { getStore } from '@edgeone/pages-blob'

export async function onRequestPost(context) {
  try {
    const contentType = context.request.headers.get('content-type') || 'application/octet-stream'
    const buf = await context.request.arrayBuffer()
    if (!buf || buf.byteLength === 0) {
      return json({ code: 400, msg: 'empty body' }, 400)
    }

    const ext = (contentType.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin'
    const uuid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    const key = `uploads/${uuid}.${ext}`
    const createdAt = new Date().toISOString()

    const store = getStore('cnb-files')
    await store.set(key, buf)

    const name = (context.request.headers.get('x-file-name')) || `${uuid}.${ext}`

    await store.setJSON(key + '.meta.json', {
      key,
      name,
      size: buf.byteLength,
      type: contentType,
      thumbKey: '',
      createdAt,
    })

    return json({
      code: 0,
      msg: 'ok',
      data: {
        key,
        url: '/api/file?key=' + encodeURIComponent(key),
        name,
        size: buf.byteLength,
        type: contentType,
        createdAt,
      },
    })
  } catch (e) {
    return json({ code: 500, msg: 'upload failed', data: { message: e && e.message ? e.message : 'unknown error' } }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}