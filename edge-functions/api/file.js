export async function onRequestDelete(context) {
  try {
    const env = context.env
    const url = new URL(context.request.url)
    const path = url.searchParams.get('path') || ''

    if (!path) {
      return json({ code: 400, msg: 'missing path param' }, 400)
    }

    const slugImg = env.SLUG_IMG || 'wujinpai/cnbimg'
    const token = env.TOKEN_IMG || ''
    const isImg = path.includes('/-/imgs/')
    const mediaPath = isImg ? path.split('/-/imgs/')[1] : path.split('/-/files/')[1] || ''

    if (!mediaPath) {
      return json({ code: 400, msg: 'invalid path' }, 400)
    }

    const delType = isImg ? 'imgs' : 'files'
    const delUrl = 'https://api.cnb.cool/' + slugImg + '/-/' + delType + '/' + mediaPath

    const resp = await fetch(delUrl, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json',
      },
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      throw new Error('delete failed: ' + resp.status + ' ' + errText)
    }

    return json({ code: 0, msg: 'ok' })
  } catch (e) {
    const message = e && e.message ? e.message : 'unknown error'
    return json({ code: 500, msg: 'delete file failed', data: { message } }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
