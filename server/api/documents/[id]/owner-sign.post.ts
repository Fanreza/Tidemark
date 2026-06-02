import { getDocumentById, createSigningRequest, getSigningRequestsByDocument, updateDocumentStatus, updateDocumentBlobId } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const doc = await getDocumentById(id)
  if (!doc) throw createError({ statusCode: 404, message: 'Document not found' })

  if (body.signed_blob_id) {
    await updateDocumentBlobId(id, body.signed_blob_id)
  }

  // Create the owner's signing request and immediately mark it signed
  const req = await createSigningRequest({
    document_id: id,
    signer_email: doc.owner_wallet,
    signer_wallet: doc.owner_wallet,
    status: 'signed',
    signed_at: new Date().toISOString(),
    sui_tx_hash: body.sui_tx_hash ?? null,
    order_index: -1,
  })

  // Check if all other signing requests are also signed — mark completed
  const allRequests = await getSigningRequestsByDocument(id)
  const nonOwner = allRequests.filter(r => r.id !== req.id)
  if (nonOwner.length === 0 || nonOwner.every(r => r.status === 'signed')) {
    await updateDocumentStatus(id, 'completed')
  } else {
    await updateDocumentStatus(id, 'signing')
  }

  return req
})
