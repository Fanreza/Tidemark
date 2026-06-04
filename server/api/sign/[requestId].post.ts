import { getSigningRequestById, updateSigningRequest, getSigningRequestsByDocument, updateDocumentStatus, updateDocumentBlobId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const requestId = getRouterParam(event, 'requestId')!
  const body = await readBody(event)

  const req = await getSigningRequestById(requestId)
  if (!req) throw createError({ statusCode: 404, message: 'Signing request not found' })
  if (req.status !== 'pending') throw createError({ statusCode: 409, message: 'Request already completed' })

  if (body.action === 'decline') {
    const updated = await updateSigningRequest(requestId, {
      status: 'declined',
      signed_at: new Date().toISOString(),
    })
    return updated
  }

  // Only the assigned signer may sign. Compare case-insensitively to match the
  // client's authorization check. (Soft guard — identity is the claimed wallet.)
  if (req.signer_wallet && (body.signer_wallet ?? '').toLowerCase() !== req.signer_wallet.toLowerCase()) {
    throw createError({ statusCode: 403, message: 'Not authorized — wrong wallet for this signing request' })
  }

  const updated = await updateSigningRequest(requestId, {
    status: 'signed',
    signed_at: new Date().toISOString(),
    signer_wallet: body.signer_wallet ?? null,
    sui_tx_hash: body.sui_tx_hash ?? null,
  })

  if (body.signed_blob_id) {
    await updateDocumentBlobId(req.document_id, body.signed_blob_id)
  }

  // Mark document complete if all parties (owner + external signers) have signed
  const allRequests = await getSigningRequestsByDocument(req.document_id)
  const allSigned = allRequests.every(r => r.id === requestId ? true : r.status === 'signed')
  if (allSigned) {
    await updateDocumentStatus(req.document_id, 'completed')
  }

  return updated
})
