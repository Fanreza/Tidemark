import { getUserByWallet, createUser } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { wallet_address, username } = body

  if (!wallet_address || !username) throw createError({ statusCode: 400, message: 'wallet_address and username required' })

  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (clean.length < 3) throw createError({ statusCode: 400, message: 'Username must be at least 3 characters (a-z, 0-9, _)' })

  const existing = await getUserByWallet(wallet_address)
  if (existing) return existing

  return createUser({ wallet_address, username: clean })
})
