import { getStore } from '@edgeone/pages-blob'

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url)
    const key = url.searchParams.get('key') || ''

    if (!key) {
      return json({ code: 400, msg: 'missing key' }, 400)
    }

    const store = getStore('cnb-files')

    let meta = null
    try {
      meta = await store.get(key + '.meta.json', { type: 'json' })
    } catch {
      // ignore
    }

    const contentType = (meta && meta.type) || 'application/octet-stream'

    const range = context.request.headers.get('range')

    if (range) {
      const buf = await store.get(key, { type: 'arrayBuffer' })
      if (!buf) {
        return new Response('Not Found', { status: 404 })
      }
      const bytes = new Uint8Array(buf)
      const total = bytes.length
      const m = /bytes=(\d*)-(\d*)/.exec(range)
      let start = 0
      let end = total - 1
      if (m) {
        if (m[1]) start = parseInt(m[1], 10)
        if (m[2]) end = Math.min(parseInt(m[2], 10), total - 1)
      }
      if (start > end || start >= total) {
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${total}` },
        })
      }
      const slice = bytes.slice(start, end + 1)
      return new Response(slice, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const data = await store.get(key, { type: 'arrayBuffer' })
    if (!data) {
      return new Response('Not Found', { status: 404 })
    }
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    return json({ code: 500, msg: 'get file failed', data: { message: e && e.message ? e.message : 'unknown error' } }, 500)
  }
}

export async function onRequestDelete(context) {
  try {
    const url = new URL(context.request.url)
    const key = url.searchParams.get('key') || ''

    if (!key) {
      return json({ code: 400, msg: 'missing key' }, 400)
    }

    const store = getStore('cnb-files')
    await store.delete(key)
    await store.delete(key + '.meta.json')

    return json({ code: 0, msg: 'ok' })
  } catch (e) {
    return json({ code: 500, msg: 'delete failed', data: { message: e && e.message ? e.message : 'unknown error' } }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}