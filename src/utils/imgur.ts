/**
 * Uploads a base64 PNG to Imgur and returns the hosted URL.
 * Requires a free Imgur client ID — register at https://api.imgur.com/oauth2/addclient
 * (choose "OAuth 2 authorization without a callback URL")
 */
export async function uploadToImgur(base64DataUri: string, clientId: string): Promise<string> {
  // Strip the "data:image/png;base64," prefix — Imgur only wants the raw base64
  const base64 = base64DataUri.replace(/^data:image\/\w+;base64,/, '')

  const res = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${clientId}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64, type: 'base64' }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Imgur upload failed (${res.status}): ${text}`)
  }

  const json = await res.json() as { data: { link: string } }
  return json.data.link
}
