function getMediaType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  const videoExts = ['mp4', 'mov', 'mkv', 'webm', 'm4v', '3gp']
  return videoExts.includes(ext) ? 'files' : 'imgs'
}

export async function onRequest(context: any) {
  const urlPath = context.params.path
  if (!urlPath) {
    return new Response(JSON.stringify({ error: 'No path provided' }), {
      status: 400,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  const pathStr = Array.isArray(urlPath) ? urlPath.join('/') : urlPath
  const mediaType = getMediaType(pathStr)
  const targetUrl = 'https://cnb.cool/' + context.env.SLUG_IMG + '/-/' + mediaType + '/' + pathStr

  const reqHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    Referer: 'https://cnb.cool/',
    Origin: 'https://cnb.cool',
    Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  }

  const range = context.request.headers.get('range')
  if (range) {
    reqHeaders['Range'] = range
  }

  try {
    const resp = await fetch(targetUrl, {
      method: 'GET',
      headers: reqHeaders,
    })

    const headers = new Headers()
    for (const [key, value] of resp.headers.entries()) {
      if (['content-encoding', 'transfer-encoding', 'connection', 'keep-alive'].indexOf(key.toLowerCase()) === -1) {
        headers.set(key, value)
      }
    }
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, DELETE')
    headers.set('Access-Control-Allow-Headers', 'Range, Content-Type')
    headers.set('Cache-Control', 'public, max-age=31536000')

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers,
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 502,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
