type OrientationWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type TiltOptions = {
  isActive: () => boolean;
  isPaused: () => boolean;
  onChange: (x: number, y: number) => void;
};

// Orientation events combine the phone's motion sensors into usable tilt angles.
// Sensor input stays separate from pointer input and uses the renderer's smoothing.
export function setupSignalTilt(options: TiltOptions) {
  const container = document.querySelector<HTMLElement>('.signal-tilt');
  const button = container?.querySelector<HTMLButtonElement>('.tilt-toggle');
  const status = container?.querySelector<HTMLElement>('.tilt-status');
  const hint = document.querySelector<HTMLElement>('.signal-hint');
  const orientation = window.DeviceOrientationEvent as
    OrientationWithPermission | undefined;
  const supported =
    window.isSecureContext &&
    orientation &&
    (navigator.maxTouchPoints > 0 ||
      window.matchMedia('(any-pointer: coarse)').matches);
  let enabled = false;
  let pending = false;
  let listening = false;
  let baseline: { beta: number; gamma: number } | null = null;
  let sensorTimeout: ReturnType<typeof setTimeout> | undefined;
  let message = "Let your phone's tilt guide the sculpture.";

  function updateControl() {
    if (!button || !status) return;
    button.textContent = pending
      ? 'Enabling tilt…'
      : enabled
        ? 'Disable tilt'
        : 'Enable tilt';
    button.setAttribute('aria-pressed', String(enabled));
    // Keep disabling available even while paused; enabling never starts animation.
    button.disabled = pending || (!enabled && options.isPaused());
    status.textContent =
      options.isPaused() && !pending
        ? 'Animation paused. Play to use tilt.'
        : message;
  }

  function stopListening() {
    window.removeEventListener('deviceorientation', onOrientation);
    clearTimeout(sensorTimeout);
    listening = false;
    baseline = null;
    options.onChange(0, 0);
  }

  function disable(nextMessage: string) {
    enabled = false;
    stopListening();
    message = nextMessage;
    updateControl();
  }

  function onOrientation(event: DeviceOrientationEvent) {
    if (!options.isActive()) return;
    const { beta, gamma } = event;
    if (
      beta === null ||
      gamma === null ||
      !Number.isFinite(beta) ||
      !Number.isFinite(gamma)
    )
      return;
    if (!baseline) {
      baseline = { beta, gamma };
      clearTimeout(sensorTimeout);
      message = 'Tilt gently to turn the sculpture.';
      updateControl();
    }
    // Wrap angular differences and rotate the axes for landscape screens.
    const delta = (value: number, start: number) =>
      ((((value - start + 180) % 360) + 360) % 360) - 180;
    const pitch = delta(beta, baseline.beta);
    const roll = delta(gamma, baseline.gamma);
    const angle =
      window.screen.orientation?.angle ??
      (window as Window & { orientation?: number }).orientation ??
      0;
    const radians = (angle * Math.PI) / 180;
    const horizontal = roll * Math.cos(radians) + pitch * Math.sin(radians);
    const vertical = pitch * Math.cos(radians) - roll * Math.sin(radians);
    const clamp = (value: number, limit: number) =>
      Math.max(-limit, Math.min(limit, value));
    options.onChange(
      clamp(horizontal / 45, 1) * 0.65,
      clamp(vertical / 45, 1) * 0.45,
    );
  }

  function syncActivity() {
    if (!supported || !button || !status) return;
    if (enabled && options.isActive()) {
      if (!listening) {
        listening = true;
        message = 'Hold your phone comfortably to set the starting position.';
        window.addEventListener('deviceorientation', onOrientation);
        // An exposed API doesn't guarantee usable hardware or allowed readings.
        sensorTimeout = setTimeout(() => {
          disable('Tilt is unavailable. You can still use the usual controls.');
        }, 5000);
      }
    } else if (listening) {
      stopListening();
    }
    updateControl();
  }

  if (supported && container && button && status) {
    container.hidden = false;
    if (hint)
      hint.textContent =
        'Touch the field, or enable tilt. Follow your curiosity.';
    button.addEventListener('click', async () => {
      if (pending) return;
      if (enabled) {
        disable('Tilt is off. Touch the field to turn the sculpture.');
        return;
      }
      if (options.isPaused()) return;
      pending = true;
      updateControl();
      try {
        // Call directly during the tap so Safari retains user activation.
        const permission = orientation.requestPermission
          ? await orientation.requestPermission()
          : 'granted';
        if (permission === 'granted') {
          enabled = true;
        } else {
          message =
            'Motion access was denied. You can still use the usual controls.';
        }
      } catch {
        message =
          'Motion access is unavailable. You can still use the usual controls.';
      } finally {
        pending = false;
        syncActivity();
      }
    });
    const recalibrate = () => {
      baseline = null;
      options.onChange(0, 0);
    };
    if (window.screen.orientation)
      window.screen.orientation.addEventListener('change', recalibrate);
    else window.addEventListener('orientationchange', recalibrate);
    updateControl();
  }

  return {
    get enabled() {
      return enabled;
    },
    syncActivity,
  };
}
