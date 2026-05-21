/**
 * Native platform utilities — thin wrapper around Capacitor plugins.
 * All functions gracefully fall back to web APIs when running in a browser.
 */

// True when the app is running inside a Capacitor native shell (iOS / Android)
export const isNative = () =>
  typeof window !== 'undefined' && !!(window.Capacitor?.isNativePlatform?.());

export const getPlatform = () =>
  window.Capacitor?.getPlatform?.() || 'web'; // 'ios' | 'android' | 'web'

// ── Camera ────────────────────────────────────────────────────────────────────

/**
 * Take a photo or pick from the gallery.
 * Returns a { dataUrl, blob, file } on success, throws on cancel/error.
 *
 * On native: uses @capacitor/camera for a full-screen camera UI.
 * On web: falls back to a hidden <input type="file"> click.
 */
export async function takePhoto({ source = 'camera' } = {}) {
  if (isNative()) {
    const { Camera, CameraSource, CameraResultType } = await import('@capacitor/camera');
    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: source === 'gallery' ? CameraSource.Photos : CameraSource.Camera,
      saveToGallery: false,
    });
    // Convert dataUrl to a Blob/File so it can be sent as FormData
    const res = await fetch(image.dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `scan_${Date.now()}.jpeg`, { type: 'image/jpeg' });
    return { dataUrl: image.dataUrl, blob, file };
  }

  // Web fallback — resolve/reject via a temporary <input>
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = source === 'camera' ? 'environment' : undefined;
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) { reject(new Error('No file selected')); return; }
      const dataUrl = URL.createObjectURL(f);
      resolve({ dataUrl, blob: f, file: f });
    };
    input.oncancel = () => reject(new Error('Cancelled'));
    input.click();
  });
}

// ── Geolocation ───────────────────────────────────────────────────────────────

/**
 * Get current position — uses Capacitor on native for better accuracy/speed.
 */
export async function getCurrentPosition() {
  if (isNative()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy_m: pos.coords.accuracy,
    };
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Watch position changes. Returns an unsubscribe function.
 */
export async function watchPosition(callback, errorCallback) {
  if (isNative()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (pos, err) => {
        if (err) { errorCallback?.(err); return; }
        callback({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        });
      }
    );
    return () => Geolocation.clearWatch({ id: watchId });
  }

  // Web fallback
  const id = navigator.geolocation.watchPosition(
    (pos) => callback({
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
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticError() {
  if (!isNative()) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Error });
}

// ── Push Notifications ────────────────────────────────────────────────────────

/**
 * Request push notification permission and return the device token.
 * Returns null on web or if permission is denied.
 */
export async function registerForPushNotifications() {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return null;
    await PushNotifications.register();
    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token) => resolve(token.value));
      PushNotifications.addListener('registrationError', () => resolve(null));
    });
  } catch {
    return null;
  }
}

// ── Network ───────────────────────────────────────────────────────────────────

export async function getNetworkStatus() {
  if (isNative()) {
    const { Network } = await import('@capacitor/network');
    return Network.getStatus();
  }
  return { connected: navigator.onLine, connectionType: 'unknown' };
}
