export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const fileName = url.searchParams.get('name') || ''
  const fileSize = parseInt(url.searchParams.get('size') || '', 10)

  if (!fileName || !fileSize) {
    return json({ code: 400, msg: 'missing name or size param' }, 400)
  }

  try {
    const result = await signUpload({ fileName, fileSize })
    return json({ code: 0, msg: 'ok', data: result })
  } catch (e) {
    const message = e && e.message ? e.message : 'unknown error'
    return json({ code: 500, msg: 'get upload signature failed', data: { message } }, 500)
  }
}

function getUploadType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp']
  return videoExts.includes(ext) ? 'files' : 'imgs'
}

function sanitizeFileName(fileName) {
  const ext = fileName.split('.').pop() || ''
  const randomName = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  return ext ? randomName + '.' + ext : randomName
}

async function signUpload({ fileName, fileSize }) {
  const type = getUploadType(fileName)
  const safeFileName = sanitizeFileName(fileName)
  const slugImg = process.env.SLUG_IMG || 'wujinpai/cnbimg'
  const metaUrl = 'https://api.cnb.cool/' + slugImg + '/-/upload/' + type

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    const resp = await fetch(metaUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: 'Bearer ' + (process.env.TOKEN_IMG || ''),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: safeFileName, size: fileSize }),
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      throw new Error('get upload signature failed: ' + resp.status + ' ' + resp.statusText + ' ' + errText)
    }

    const result = await resp.json()
    return Object.assign({}, result, { safeFileName })
  } finally {
    clearTimeout(timeoutId)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}