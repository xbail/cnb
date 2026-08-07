export async function onRequestPost(context) {
  const uploadPassword = context.env.UPLOAD_PASSWORD

  if (!uploadPassword) {
    return json({ code: 400, msg: 'server password not configured' }, 400)
  }

  let body
  try {
    body = await context.request.json()
  } catch {
    return json({ code: 400, msg: 'invalid request body' }, 400)
  }

  const password = body && body.password

  if (!password || password !== uploadPassword) {
    return json({ code: 401, msg: 'wrong password' }, 401)
  }

  return json({ code: 0, msg: 'ok', data: { success: true } })
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}