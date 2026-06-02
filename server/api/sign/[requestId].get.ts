import { getSigningRequestById, getDocumentById, enrichWithUsername } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const requestId = getRouterParam(event, 'requestId')!

  const req = await getSigningRequestById(requestId)
  if (!req) throw createError({ statusCode: 404, message: 'Signing request not found' })

  const [doc, enriched] = await Promise.all([
    getDocumentById(req.document_id),
    enrichWithUsername(req),
  ])

  return {
    ...enriched,
    document_title: doc?.title ?? 'Document',
    document_walrus_blob_id: doc?.walrus_blob_id ?? '',
    document_file_type: doc?.file_type ?? '',
  }
})
