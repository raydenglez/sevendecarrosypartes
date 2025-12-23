import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function useKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    const setupKeyboardListeners = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');

        const showHandler = await Keyboard.addListener('keyboardWillShow', (info) => {
          setIsKeyboardVisible(true);
          setKeyboardHeight(info.keyboardHeight);
        });

        const hideHandler = await Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        });

        cleanup = () => {
          showHandler.remove();
          hideHandler.remove();
        };
      } catch {
        // Keyboard plugin not available
      }
    };

    setupKeyboardListeners();

    return () => {
      cleanup?.();
    };
  }, []);

  const hideKeyboard = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.hide();
    } catch {
      // Keyboard plugin not available
    }
  };

  return {
    isKeyboardVisible,
    keyboardHeight,
    hideKeyboard,
  };
}
