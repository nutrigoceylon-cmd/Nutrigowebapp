const eventRegistrationWebhookUrl =
  import.meta.env.VITE_EVENT_REGISTRATION_WEBHOOK_URL ??
  'https://script.google.com/macros/s/AKfycbxuGaHe8ST9ss3jP546_feU4WL8-nq2SDt8ZnMYjHxuX-wqy_J0Slt9I2QgxY2qok4/exec'

export interface EventRegistrationWebhookPayload {
  eventId: string
  eventTitle: string
  eventDate: string
  contactName: string
  contactPhone: string
  contactEmail: string
  attendeeAge: number
  attendeeGender: string
  availableSpots: number
}

export async function notifyEventRegistrationWebhook(payload: EventRegistrationWebhookPayload) {
  if (!eventRegistrationWebhookUrl) return

  const body = JSON.stringify(payload)

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const queued = navigator.sendBeacon(
      eventRegistrationWebhookUrl,
      new Blob([body], { type: 'text/plain;charset=UTF-8' })
    )
    if (queued) return
  }

  await fetch(eventRegistrationWebhookUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    keepalive: true,
  })
}
