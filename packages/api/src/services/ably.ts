import Ably from 'ably'
import type {ApiEnv} from '../env'

export function ablyConfigured(env: ApiEnv) {
  return Boolean(env.ABLY_API_KEY)
}

function getRest(env: ApiEnv) {
  if (!env.ABLY_API_KEY) return null
  return new Ably.Rest(env.ABLY_API_KEY)
}

/** Capability: subscribe to the user's conversation channels only. */
export async function createAblyTokenRequest(
  env: ApiEnv,
  clientId: string,
  conversationIds: string[]
) {
  const rest = getRest(env)
  if (!rest) return null

  const capability: {[key: string]: Ably.capabilityOp[]} = {}
  for (const id of conversationIds) {
    capability[`conversation:${id}`] = ['subscribe', 'presence']
  }
  if (!Object.keys(capability).length) {
    capability['conversation:none'] = ['subscribe']
  }

  return rest.auth.createTokenRequest({
    clientId,
    capability,
  })
}

export async function publishConversationMessage(
  env: ApiEnv,
  conversationId: string,
  message: unknown
) {
  const rest = getRest(env)
  if (!rest) return
  try {
    await rest.channels.get(`conversation:${conversationId}`).publish('message', message)
  } catch (err) {
    console.error('[ably] publish failed', err)
  }
}
