/**
 * Native platform utilities — thin wrapper around Expo modules.
 * All functions gracefully fall back to web APIs when running in a browser.
 */

// Detect native at runtime (Expo modules only available on native)
export const isNative = () => {
  try {
    // On native Expo, globalThis has Expo-specific properties
    return typeof global !== 'undefined' && !!global.__ExpoPrivate;
  } catch {
    return false;
  }
};

export const getPlatform = () => {
  if (!isNative()) return 'web';
  try {
    const Device = require('expo-device');
    return Device.osName === 'Android' ? 'android' : 'ios';
  } catch {
    return 'web';
  }
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
    try {
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

      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();
      const file = new File([blob], `scan_${Date.now()}.jpeg`, { type: 'image/jpeg' });

      return {
        dataUrl: imageAsset.uri,
        blob,
        file,
      };
    } catch (err) {
      if (err.message === 'Cancelled' || err.message === 'User cancelled image selection') {
        throw new Error('Cancelled');
      }
      throw err;
    }
  }

  // Web fallback
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
 * Get current position — uses Expo Location on native.
 */
export async function getCurrentPosition() {
  if (isNative()) {
    try {
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
    } catch (err) {
      throw err;
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
    try {
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
    } catch (err) {
      errorCallback?.(err);
      return () => {};
    }
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
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics not available
  }
}

export async function hapticError() {
  if (!isNative()) return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics not available
  }
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
    const Device = await import('expo-device');

    if (!Device.default.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.default.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.default.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = (await Notifications.default.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    return null;
  }
}

// ── Network ───────────────────────────────────────────────────────────────────

export async function getNetworkStatus() {
  if (isNative()) {
    try {
      const Network = await import('expo-network');
      return await Network.getNetworkStateAsync();
    } catch {
      return { isConnected: true, isInternetReachable: true };
    }
  }
  return { isConnected: navigator.onLine, isInternetReachable: navigator.onLine };
}
