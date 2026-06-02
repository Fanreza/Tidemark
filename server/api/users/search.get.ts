import { searchUsers } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string) ?? ''
  if (!q || q.length < 2) return []
  return searchUsers(q)
})
