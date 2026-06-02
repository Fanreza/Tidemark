import { getDocumentById, createShareLink, updateDocumentStatus, generateToken, hashPassword } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const doc = await getDocumentById(id)
  if (!doc) throw createError({ statusCode: 404, message: 'Document not found' })

  const token = generateToken()

  const link = await createShareLink({
    document_id: id,
    token,
    password_hash: body.password ? hashPassword(body.password) : null,
    expires_at: body.expires_at ?? null,
    allow_download: body.allow_download ?? false,
    require_email: body.require_email ?? false,
    is_active: true,
  })

  await updateDocumentStatus(id, 'shared')

  return link
})
