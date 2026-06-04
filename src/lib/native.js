/**
 * Native platform utilities — thin wrapper around Expo modules.
 * All functions gracefully fall back to web APIs when running in a browser.
 */

import * as Device from 'expo-device';

// True when the app is running on a physical device (iOS / Android)
export const isNative = () => Device.isDevice;

export const getPlatform = () => {
  if (!isNative()) return 'web';
  return Device.osName === 'Android' ? 'android' : 'ios';
};

// ── Camera ────────────────────────────────────────────────────────────────────

/**
 * Take a photo or pick from the gallery.
 * Returns a { dataUrl, blob, file } on success, throws on cancel/error.
 *
 * On native: uses expo-image-picker for a full-screen camera/gallery UI.
 * On web: falls back to a hidden <input type="file"> click.
 */
export async function takePhoto({ source = 'camera' } = {}) {
  if (isNative()) {
    const ImagePicker = await import('expo-image-picker');

    let result;
    if (source === 'gallery') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.85,
      });
    } else {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.85,
      });
    }

    if (result.canceled) {
      throw new Error('Cancelled');
    }

    const imageAsset = result.assets[0];
    if (!imageAsset.uri) {
      throw new Error('No image URI');
    }

    // Fetch the image and convert to File
    const response = await fetch(imageAsset.uri);
    const blob = await response.blob();
    const file = new File([blob], `scan_${Date.now()}.jpeg`, { type: 'image/jpeg' });

    return {
      dataUrl: imageAsset.uri,
      blob,
      file,
    };
  }

  // Web fallback — resolve/reject via a temporary <input>
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
 * Get current position — uses Expo Location on native for better accuracy/speed.
 */
export async function getCurrentPosition() {
  if (isNative()) {
    const Location = await import('expo-location');

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy_m: position.coords.accuracy,
      };
    } catch {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy_m: position.coords.accuracy,
      };
    }
  }

  // Web fallback
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
 * Watch position changes. Returns an unsubscribe function.
 */
export async function watchPosition(callback, errorCallback) {
  if (isNative()) {
    const Location = await import('expo-location');

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      errorCallback?.(new Error('Location permission denied'));
      return () => {};
    }

    const subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        });
      }
    );

    return () => subscription.remove();
  }

  // Web fallback
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
  if (!isNative()) return;
  const Haptics = await import('expo-haptics');
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function hapticError() {
  if (!isNative()) return;
  const Haptics = await import('expo-haptics');
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

// ── Push Notifications ────────────────────────────────────────────────────────

/**
 * Request push notification permission and return the device token.
 * Returns null on web or if permission is denied.
 */
export async function registerForPushNotifications() {
  if (!isNative()) return null;
  try {
    const Notifications = await import('expo-notifications');

    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    return null;
  }
}

// ── Network ───────────────────────────────────────────────────────────────────

export async function getNetworkStatus() {
  if (isNative()) {
    const Network = await import('expo-network');
    return Network.getNetworkStateAsync();
  }
  return { isConnected: navigator.onLine, isInternetReachable: navigator.onLine };
}
