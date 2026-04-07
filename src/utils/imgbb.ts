/**
 * Uploads a base64 PNG to imgBB and returns the hosted URL.
 * Get a free API key at https://imgbb.com/signup → API → Add API key
 */
export async function uploadToImgbb(base64DataUri: string, apiKey: string): Promise<string> {
  // Strip the "data:image/png;base64," prefix — imgBB wants raw base64
  const base64 = base64DataUri.replace(/^data:image\/\w+;base64,/, '')

  const body = new FormData()
  body.append('image', base64)

  // Pass key as query param — this is the most reliable way with imgBB
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body,
  })

  const json = await res.json() as {
    success: boolean
    data?: { url: string; display_url: string }
    error?: { message: string }
    status?: number
  }

  if (!res.ok || !json.success || !json.data) {
    const msg = json.error?.message ?? `HTTP ${res.status}`
    throw new Error(`imgBB upload failed: ${msg}`)
  }

  return json.data.display_url
}
