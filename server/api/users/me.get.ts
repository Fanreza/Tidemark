import { getUserByWallet } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const wallet = query.wallet as string
  if (!wallet) throw createError({ statusCode: 400, message: 'wallet required' })
  return getUserByWallet(wallet)
})
