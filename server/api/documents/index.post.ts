import { createDocument } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const payload: Parameters<typeof createDocument>[0] = {
    title: body.title,
    owner_wallet: body.owner_wallet ?? 'demo-wallet',
    owner_email: body.owner_email ?? '',
    walrus_blob_id: body.walrus_blob_id ?? '',
    file_type: body.file_type,
    file_size: body.file_size,
    is_encrypted: body.is_encrypted ?? false,
    status: body.walrus_blob_id ? 'draft' : 'pending' as any,
  }

  if (body.walrus_object_id != null) payload.walrus_object_id = body.walrus_object_id
  if (body.seal_allowlist_id != null) payload.seal_allowlist_id = body.seal_allowlist_id
  if (body.seal_encryption_id != null) payload.seal_encryption_id = body.seal_encryption_id

  return createDocument(payload)
})
