import { getShareLinkByToken, hashPassword } from '../../utils/db'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const body = await readBody(event)

  const link = await getShareLinkByToken(token)
  if (!link) throw createError({ statusCode: 404, message: 'Share link not found' })

  const config = useRuntimeConfig()
  const client = config.supabaseUrl && config.supabaseServiceKey
    ? createClient(config.supabaseUrl as string, config.supabaseServiceKey as string, { auth: { persistSession: false } })
    : null

  const update: Record<string, any> = {
    allow_download: body.allow_download ?? link.allow_download,
    expires_at: body.expires_at ?? link.expires_at,
  }

  if (body.password !== undefined) {
    update.password_hash = body.password ? hashPassword(body.password) : null
  }

  if (client) {
    const { data, error } = await client.from('share_links').update(update).eq('token', token).select().single()
    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
  }

  // In-memory fallback
  Object.assign(link, update)
  return link
})
