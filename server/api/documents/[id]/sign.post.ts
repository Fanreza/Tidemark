import { getDocumentById, createSigningRequest, updateDocumentStatus } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const doc = await getDocumentById(id)
  if (!doc) throw createError({ statusCode: 404, message: 'Document not found' })

  const signers: string[] = body.signers ?? []

  const requests = await Promise.all(
    signers.map((wallet, index) =>
      createSigningRequest({
        document_id: id,
        signer_email: '',
        signer_wallet: wallet,
        status: 'pending',
        signed_at: null,
        sui_tx_hash: null,
        order_index: index,
        signature_field: null,
      }),
    ),
  )

  await updateDocumentStatus(id, 'signing')

  return requests
})
