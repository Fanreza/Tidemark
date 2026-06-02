import { getSigningRequestsByWallet, getDocumentById, enrichWithUsername, getUserByWallet } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const wallet = query.wallet as string
  if (!wallet) throw createError({ statusCode: 400, message: 'wallet required' })

  const requests = await getSigningRequestsByWallet(wallet)
  const user = await getUserByWallet(wallet)

  return Promise.all(requests.map(async (req) => {
    const [doc, enriched] = await Promise.all([
      getDocumentById(req.document_id),
      enrichWithUsername(req),
    ])
    const ownerUser = doc?.owner_wallet ? await getUserByWallet(doc.owner_wallet) : null
    return {
      ...enriched,
      signer_username: user?.username ?? enriched.signer_username,
      document_title: doc?.title ?? 'Unknown',
      document_walrus_blob_id: doc?.walrus_blob_id ?? null,
      document_status: doc?.status ?? null,
      owner_wallet: doc?.owner_wallet ?? null,
      owner_username: ownerUser?.username ?? null,
    }
  }))
})
