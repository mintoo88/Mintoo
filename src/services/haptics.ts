/**
 * Haptic feedback utility with browser and Android support check
 */

class HapticsService {
  private enabled: boolean = true;

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public light() {
    if (!this.enabled || typeof window === 'undefined') return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignored if unsupported
      }
    }
  }

  public medium() {
    if (!this.enabled || typeof window === 'undefined') return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Ignored
      }
    }
  }

  public heavy() {
    if (!this.enabled || typeof window === 'undefined') return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([35, 20, 45]);
      } catch {
        // Ignored
      }
    }
  }

  public explosion() {
    if (!this.enabled || typeof window === 'undefined') return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 60]);
      } catch {
        // Ignored
      }
    }
  }
}

export const hapticsService = new HapticsService();
