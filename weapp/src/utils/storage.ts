import Taro from '@tarojs/taro'

/**
 * Taro.getStorageSync 在 H5 模式下有内存缓存，
 * 直接通过 localStorage.setItem 写入的值读不到。
 * 此函数加一层 localStorage fallback。
 */
export function getStorage(key: string): any {
  try {
    const val = Taro.getStorageSync(key)
    if (val !== '' && val !== null && val !== undefined) return val
  } catch {}
  // fallback: 直接读 localStorage
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    try { return JSON.parse(raw) } catch { return raw }
  } catch { return null }
}

export function setStorage(key: string, value: any): void {
  try {
    Taro.setStorageSync(key, value)
  } catch {}
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch {}
}

export function removeStorage(key: string): void {
  try { Taro.removeStorageSync(key) } catch {}
  try { localStorage.removeItem(key) } catch {}
}

/**
 * 统一获取用户ID，兼容 userInfo.id 和 userInfo.userId
 */
export function getUserId(): number {
  const userInfo = getStorage('USER_INFO')
  if (userInfo) {
    if (userInfo.id) return Number(userInfo.id) || 0
    if (userInfo.userId) return Number(userInfo.userId) || 0
  }
  const userId = getStorage('USER_ID')
  return Number(userId) || 0
}

/**
 * 规范化用户信息对象，确保同时包含 id 和 userId
 */
export function normalizeUserInfo(raw: any): any {
  if (!raw) return null
  const normalized = { ...raw }
  if (raw.userId && !raw.id) {
    normalized.id = raw.userId
  }
  if (raw.id && !raw.userId) {
    normalized.userId = raw.id
  }
  return normalized
}
