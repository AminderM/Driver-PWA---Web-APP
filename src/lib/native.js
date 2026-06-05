/**
 * Native platform utilities — thin wrapper around browser APIs.
 * Graceful fallbacks for use in web browsers.
 */

// Always false on web (no native layer)
export const isNative = () => false;

export const getPlatform = () => 'web';

// ── Camera ────────────────────────────────────────────────────────────────────

/**
 * Take a photo or pick from the gallery.
 * On web: falls back to a hidden <input type="file"> click.
 */
export async function takePhoto({ source = 'camera' } = {}) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = source === 'camera' ? 'environment' : undefined;
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) {
        reject(new Error('No file selected'));
        return;
      }
      const dataUrl = URL.createObjectURL(f);
      resolve({ dataUrl, blob: f, file: f });
    };
    input.oncancel = () => reject(new Error('Cancelled'));
    input.click();
  });
}

// ── Geolocation ───────────────────────────────────────────────────────────────

/**
 * Get current position using browser Geolocation API.
 */
export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        }),
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy_m: pos.coords.accuracy,
            }),
          reject,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

/**
 * Watch position changes using browser Geolocation API.
 * Returns an unsubscribe function.
 */
export async function watchPosition(callback, errorCallback) {
  const id = navigator.geolocation.watchPosition(
    (pos) =>
      callback({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      }),
    errorCallback,
    { enableHighAccuracy: true, maximumAge: 30000 }
  );

  return () => navigator.geolocation.clearWatch(id);
}

// ── Haptics ───────────────────────────────────────────────────────────────────

export async function hapticSuccess() {
  // Not available on web
}

export async function hapticError() {
  // Not available on web
}

// ── Push Notifications ────────────────────────────────────────────────────────

/**
 * Push notifications not available on web.
 */
export async function registerForPushNotifications() {
  return null;
}

// ── Network ───────────────────────────────────────────────────────────────────

export async function getNetworkStatus() {
  return { isConnected: navigator.onLine, isInternetReachable: navigator.onLine };
}
