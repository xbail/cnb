export async function onRequestGet(context) {
  try {
    const env = context.env
    const slugImg = env.SLUG_IMG || 'wujinpai/cnbimg'
    const token = env.TOKEN_IMG || ''

    const listUrl = 'https://api.cnb.cool/' + slugImg + '/-/list-assets?page=1&page_size=100'
    const resp = await fetch(listUrl, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json',
      },
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      throw new Error('list assets failed: ' + resp.status + ' ' + errText)
    }

    const assets = await resp.json()
    const records = (Array.isArray(assets) ? assets : [])
      .filter((a) => a && a.record_type === 'slug_img' || (a && a.record_type === 'slug_file'))
      .filter((a) => a && a.path)
      .map((a) => {
        const path = a.path
        const isImg = path.includes('/-/imgs/')
        const mediaPath = isImg ? path.split('/-/imgs/')[1] : path.split('/-/files/')[1] || ''
        const fileName = decodeURIComponent(mediaPath.split('/').pop() || '')
        const ext = fileName.toLowerCase().split('.').pop() || ''
        const type = getTypeFromExt(ext)
        return {
          id: path,
          key: path,
          url: '/img-api/' + mediaPath,
          name: fileName,
          size: a.size_in_byte || 0,
          type,
          createdAt: a.created_at || '',
        }
      })

    records.sort((x, y) => (x.createdAt > y.createdAt ? -1 : x.createdAt < y.createdAt ? 1 : 0))

    return json({ code: 0, msg: 'ok', data: records })
  } catch (e) {
    const message = e && e.message ? e.message : 'unknown error'
    return json({ code: 500, msg: 'list files failed', data: { message } }, 500)
  }
}

function getTypeFromExt(ext) {
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
    avif: 'image/avif', svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v', '3gp': 'video/3gpp',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
  }
  return map[ext] || 'application/octet-stream'
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
