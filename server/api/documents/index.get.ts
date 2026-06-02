import { getDocumentsByOwner, getShareLinksByDocument, getSigningRequestsByDocument, enrichWithUsername } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const wallet = (query.wallet as string) ?? 'demo-wallet'

  const docs = await getDocumentsByOwner(wallet)

  return Promise.all(
    docs.map(async doc => ({
      ...doc,
      share_links: await getShareLinksByDocument(doc.id),
      signing_requests: await Promise.all(
        (await getSigningRequestsByDocument(doc.id)).map(enrichWithUsername)
      ),
    })),
  )
})
