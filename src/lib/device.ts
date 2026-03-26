const DEVICE_ID_KEY = 'potenup_device_id'

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return ''
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export function getDeviceName(): string {
  if (typeof window === 'undefined') return ''
  const ua = navigator.userAgent
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Android.*Mobile/i.test(ua)) return 'Android Phone'
  if (/Android/i.test(ua)) return 'Android Tablet'
  if (/Windows/i.test(ua)) return 'Windows PC'
  if (/Macintosh/i.test(ua)) return 'Mac'
  if (/Linux/i.test(ua)) return 'Linux PC'
  return 'Browser'
}
