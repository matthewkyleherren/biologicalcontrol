/** Profile URL for one-time voice consent, optionally returning afterward. */
export function voiceConsentHref(nextPath = '/contribute') {
  const params = new URLSearchParams({consent: '1'})
  if (nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    params.set('next', nextPath)
  }
  return `/me?${params.toString()}`
}

export function isVoiceConsentRequiredError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err ?? '')
  return /voice consent required|VOICE_CONSENT_REQUIRED/i.test(message)
}
