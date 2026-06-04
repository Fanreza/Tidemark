import { getDocumentById, deleteDocument, assertDocumentOwner } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const doc = await getDocumentById(id)
  if (!doc) throw createError({ statusCode: 404, message: 'Document not found' })
  assertDocumentOwner(doc, getQuery(event).wallet)
  await deleteDocument(id)
  return { success: true }
})
