export default defineNuxtPlugin(async () => {
  const { tryReconnect } = useWallet()
  await tryReconnect()
})
