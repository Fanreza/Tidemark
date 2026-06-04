// Primary Sui RPC for the whole app — proxied through Tatum's RPC gateway.
//
// The Tatum API key is secret, so it must never reach the browser. Every
// client-side SuiClient points at this same-origin endpoint (/api/rpc); we
// forward the raw JSON-RPC payload to Tatum with the x-api-key header.
// Falls back to the public Sui fullnode if no Tatum key is configured.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.tatumApiKey as string
  const net = (config.public.suiNetwork as string) || 'testnet'

  const target = apiKey
    ? `https://sui-${net}.gateway.tatum.io`
    : `https://fullnode.${net}.sui.io:443`

  const body = await readRawBody(event, 'utf8')

  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
    body: body ?? '',
  })

  const text = await res.text()
  setResponseStatus(event, res.status)
  setResponseHeader(event, 'Content-Type', 'application/json')
  return text
})
