import { getShareLinkByToken, getDocumentById, incrementViewCount, hashPassword } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const query = getQuery(event)

  const link = await getShareLinkByToken(token)
  if (!link) throw createError({ statusCode: 404, message: 'Link not found or expired' })
  if (!link.is_active) throw createError({ statusCode: 410, message: 'This link has been revoked' })

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    throw createError({ statusCode: 410, message: 'This link has expired' })
  }

  // Password check
  if (link.password_hash) {
    const provided = query.password ? hashPassword(query.password as string) : null
    if (!provided || provided !== link.password_hash) {
      throw createError({
        statusCode: 401,
        message: 'Password required',
        data: { requirePassword: true, requireEmail: link.require_email },
      })
    }
  }

  // Email gate
  if (link.require_email && !query.email) {
    throw createError({
      statusCode: 401,
      message: 'Email required',
      data: { requirePassword: false, requireEmail: true },
    })
  }

  const doc = await getDocumentById(link.document_id)
  if (!doc) throw createError({ statusCode: 404, message: 'Document not found' })

  await incrementViewCount(token, (query.email as string) ?? null)

  return {
    document: doc,
    shareLink: { ...link, password_hash: undefined },
  }
})
