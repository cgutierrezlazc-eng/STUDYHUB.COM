/**
 * Capacitor native bridge — provides platform detection and native APIs.
 * Falls back gracefully when running in a regular browser.
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// ─── Platform Detection ────────────────────────────────────────

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';

// ─── Initialize Native Features ────────────────────────────────

export async function initNative() {
  if (!isNative) return;

  // Hide splash screen after app loads
  await SplashScreen.hide();

  // Configure status bar
  if (isAndroid) {
    await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
  }
  await StatusBar.setStyle({ style: Style.Dark });

  // Keyboard listeners (adjust layout when keyboard shows)
  Keyboard.addListener('keyboardWillShow', (info) => {
    document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    document.body.classList.add('keyboard-open');
  });

  Keyboard.addListener('keyboardWillHide', () => {
    document.documentElement.style.setProperty('--keyboard-height', '0px');
    document.body.classList.remove('keyboard-open');
  });

  // Handle hardware back button (Android)
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.minimizeApp();
    }
  });
}

// ─── Haptic Feedback ───────────────────────────────────────────

export async function hapticTap() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticSuccess() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticError() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

// ─── Share ─────────────────────────────────────────────────────

export async function shareContent(title: string, text: string, url?: string) {
  if (!isNative) {
    // Web fallback
    if (navigator.share) {
      await navigator.share({ title, text, url });
    }
    return;
  }
  await Share.share({ title, text, url, dialogTitle: 'Compartir desde Conniku' });
}

// ─── Open External Link ────────────────────────────────────────

export async function openExternal(url: string) {
  if (!isNative) {
    window.open(url, '_blank');
    return;
  }
  await Browser.open({ url });
}

// ─── Camera (Avatar) ───────────────────────────────────────────

export async function takePhoto(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      width: 400,
      height: 400,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt, // Let user choose camera or gallery
    });
    return image.base64String ? `data:image/${image.format};base64,${image.base64String}` : null;
  } catch {
    return null;
  }
}

// ─── Status Bar Helpers ────────────────────────────────────────

export async function setStatusBarColor(color: string) {
  if (!isNative || !isAndroid) return;
  await StatusBar.setBackgroundColor({ color });
}

export async function hideStatusBar() {
  if (!isNative) return;
  await StatusBar.hide();
}

export async function showStatusBar() {
  if (!isNative) return;
  await StatusBar.show();
}

// ─── Keyboard Helpers ──────────────────────────────────────────

export async function hideKeyboard() {
  if (!isNative) return;
  await Keyboard.hide();
}
