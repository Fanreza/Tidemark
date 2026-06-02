import { getDocumentById, finalizeDocumentUpload } from '../../../utils/db'

const PUBLISHERS = [
  'https://publisher.walrus-testnet.walrus.space',
  'https://wal-publisher-testnet.staketab.org',
]

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const doc = await getDocumentById(id)
  if (!doc) throw createError({ statusCode: 404, message: 'Document not found' })
  if (doc.walrus_blob_id) throw createError({ statusCode: 409, message: 'Blob already uploaded' })

  const query = getQuery(event)
  const owner = query.owner as string | undefined
  const epochs = Math.min(Number(query.epochs ?? 50), 50)

  const body = await readRawBody(event, false)
  if (!body) throw createError({ statusCode: 400, message: 'No file data' })

  let lastError = ''
  for (const publisher of PUBLISHERS) {
    try {
      const params = new URLSearchParams({ epochs: String(epochs), deletable: 'true' })
      if (owner) params.set('send_object_to', owner)

      const res = await fetch(`${publisher}/v1/blobs?${params}`, {
        method: 'PUT',
        body,
        headers: { 'Content-Type': 'application/octet-stream' },
        signal: AbortSignal.timeout(180_000),
      })

      if (!res.ok) {
        lastError = `${publisher} ${res.status}: ${await res.text().catch(() => '')}`
        continue
      }

      const data = await res.json()
      const blobId = data.newlyCreated?.blobObject?.blobId ?? data.alreadyCertified?.blobId
      if (!blobId) { lastError = 'No blobId in response'; continue }

      const objectId: string | null = data.newlyCreated?.blobObject?.id ?? null

      await finalizeDocumentUpload(id, blobId, objectId)

      return { blobId, objectId }
    } catch (e: any) {
      lastError = e.message
    }
  }

  throw createError({ statusCode: 502, message: `Walrus upload failed: ${lastError}` })
})
