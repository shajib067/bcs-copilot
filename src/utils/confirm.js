import { Alert, Platform } from 'react-native';

// React Native's Alert is a no-op on react-native-web, which silently breaks
// confirmation flows (e.g. submitting a mock). This helper falls back to the
// browser's confirm dialog on web.
export function confirm({
  title,
  message = '',
  confirmText = 'OK',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(text)
      : true;
    if (ok) onConfirm && onConfirm();
    else onCancel && onCancel();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

// Simple informational alert that also works on web.
export function notify(title, message = '') {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}
