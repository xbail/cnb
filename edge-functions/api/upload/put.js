export async function onRequestPost(context) {
  try {
    const req = context.request
    const url = new URL(req.url)
    const uploadUrl = url.searchParams.get('upload_url') || ''

    if (!uploadUrl) {
      return json({ code: 400, msg: 'missing upload_url param' }, 400)
    }

    const contentType = req.headers.get('content-type') || 'application/octet-stream'
    const contentLength = req.headers.get('content-length')

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
      },
      body: req.body,
      ...(req.body ? { duplex: 'half' } : {}),
    })

    if (!putRes.ok) {
      const errText = await putRes.text().catch(() => '')
      return json(
        {
          code: 400,
          msg: 'upload failed: ' + putRes.status + ' ' + putRes.statusText + ' ' + errText,
          data: { status: putRes.status },
        },
        502,
      )
    }

    return json({ code: 0, msg: 'ok' })
  } catch (e) {
    const message = e && e.message ? e.message : 'unknown error'
    return json({ code: 500, msg: 'upload put failed', data: { message } }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
