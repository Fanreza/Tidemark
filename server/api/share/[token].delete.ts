import { deactivateShareLink, getShareLinkByToken, getDocumentById, assertDocumentOwner } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!

  const link = await getShareLinkByToken(token)
  if (!link) throw createError({ statusCode: 404, message: 'Link not found' })

  const doc = await getDocumentById(link.document_id)
  if (!doc) throw createError({ statusCode: 404, message: 'Document not found' })
  assertDocumentOwner(doc, getQuery(event).wallet)

  await deactivateShareLink(token)

  return { success: true }
})
