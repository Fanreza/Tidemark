const PUBLISHERS = [
  'https://publisher.walrus-testnet.walrus.space',
  'https://wal-publisher-testnet.staketab.org',
]

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event, false)
  if (!body) throw createError({ statusCode: 400, statusMessage: 'No body provided' })

  const query = getQuery(event)
  const epochs = Math.min(Number(query.epochs ?? 50), 50)
  const owner = query.owner as string | undefined

  let lastError = ''
  for (const publisher of PUBLISHERS) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 120_000)

      const params = new URLSearchParams({ epochs: String(epochs), deletable: 'true' })
      if (owner) params.set('send_object_to', owner)

      const res = await fetch(`${publisher}/v1/blobs?${params}`, {
        method: 'PUT',
        body,
        headers: { 'Content-Type': 'application/octet-stream' },
        signal: ctrl.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        lastError = `${publisher} returned ${res.status}: ${await res.text().catch(() => '')}`
        continue
      }

      const data = await res.json()
      const blobId = data.newlyCreated?.blobObject?.blobId ?? data.alreadyCertified?.blobId
      if (!blobId) { lastError = 'No blob ID in response'; continue }

      const objectId = data.newlyCreated?.blobObject?.id ?? null

      return { blobId, objectId }
    } catch (e: any) {
      lastError = e.message
    }
  }

  throw createError({ statusCode: 502, statusMessage: `Walrus upload failed: ${lastError}` })
})
