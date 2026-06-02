import { deactivateShareLink, getShareLinkByToken } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!

  const link = await getShareLinkByToken(token)
  if (!link) throw createError({ statusCode: 404, message: 'Link not found' })

  await deactivateShareLink(token)

  return { success: true }
})
