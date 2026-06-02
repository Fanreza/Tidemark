export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const { isConnected, address } = useWallet()
  if (!isConnected.value) return navigateTo('/login')
  if (to.path === '/register') return
  const user = await $fetch(`/api/users/me?wallet=${encodeURIComponent(address.value ?? '')}`).catch(() => null)
  if (!user) return navigateTo('/register')
})
