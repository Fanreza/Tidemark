import { getDocumentById, getShareLinksByDocument, getSigningRequestsByDocument } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const doc = await getDocumentById(id)
  if (!doc) throw createError({ statusCode: 404, message: 'Document not found' })

  const [shareLinks, signingRequests] = await Promise.all([
    getShareLinksByDocument(id),
    getSigningRequestsByDocument(id),
  ])

  return { ...doc, share_links: shareLinks, signing_requests: signingRequests }
})
