const AGGREGATORS = [
  'https://aggregator.walrus-testnet.walrus.space',
  'https://wal-aggregator-testnet.staketab.org',
  'https://walrus-testnet-aggregator.bartestnet.com',
  'https://walrus-testnet.blockscope.net',
]

export default defineEventHandler(async (event) => {
  const blobId = getRouterParam(event, 'blobId')
  const method = event.method

  console.log(`[blob] ${method} blobId=${blobId}`)

  for (const aggregator of AGGREGATORS) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10_000)
      const url = `${aggregator}/v1/blobs/${blobId}`
      const res = await fetch(url, { method, signal: ctrl.signal })
      clearTimeout(timer)

      console.log(`[blob] ${aggregator} → ${res.status}`)

      if (res.ok) {
        const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
        setResponseHeader(event, 'Content-Type', contentType)
        setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
        if (method === 'HEAD') return null
        const body = await res.arrayBuffer()
        return new Uint8Array(body)
      }
    } catch (e: any) {
      console.log(`[blob] ${aggregator} → ERROR: ${e.message}`)
    }
  }

  console.log(`[blob] all aggregators failed for blobId=${blobId}`)
  throw createError({ statusCode: 404, statusMessage: 'Blob not found on Walrus' })
})
