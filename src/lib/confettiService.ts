import confetti from 'canvas-confetti';

/**
 * Fires dynamic fireworks and confetti effects when a student clicks "تأكيد التطبيق"
 */
export function triggerFireworksConfetti(origin?: { x: number; y: number }) {
  try {
    const originX = origin?.x ?? 0.5;
    const originY = origin?.y ?? 0.65;

    // 1. Immediate crisp pop directly at origin
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: originX, y: originY },
      colors: ['#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899'],
      startVelocity: 35,
      ticks: 180,
      scalar: 0.9,
    });

    // 2. Dual celebratory firework rockets bursting outward
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 50,
        origin: { x: Math.max(0.1, originX - 0.2), y: Math.max(0.2, originY - 0.15) },
        colors: ['#10B981', '#F59E0B', '#38BDF8', '#FBBF24'],
        startVelocity: 40,
        ticks: 200,
      });

      confetti({
        particleCount: 40,
        angle: 120,
        spread: 50,
        origin: { x: Math.min(0.9, originX + 0.2), y: Math.max(0.2, originY - 0.15) },
        colors: ['#3B82F6', '#10B981', '#EC4899', '#A855F7'],
        startVelocity: 40,
        ticks: 200,
      });
    }, 120);

    // 3. Golden sparkles falling downward
    setTimeout(() => {
      confetti({
        particleCount: 25,
        spread: 75,
        origin: { x: originX, y: Math.max(0.15, originY - 0.25) },
        colors: ['#F59E0B', '#FCD34D', '#34D399'],
        gravity: 1.1,
        ticks: 220,
      });
    }, 280);
  } catch (error) {
    console.warn('Could not launch fireworks:', error);
  }
}

/**
 * Fires an celebratory multi-burst confetti effect when a student completes all daily hadiths/tasks.
 */
export function triggerCelebrationConfetti() {
  try {
    // 1. Initial center burst with radiant colors (emerald, amber, cyan, blue, purple)
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#3B82F6', '#6366F1', '#EC4899', '#06B6D4'],
      ticks: 240,
    });

    // 2. Left and right celebratory cannons after a slight delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0.12, y: 0.65 },
        colors: ['#10B981', '#F59E0B', '#38BDF8', '#FCD34D'],
        ticks: 230,
      });

      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 0.88, y: 0.65 },
        colors: ['#10B981', '#F59E0B', '#38BDF8', '#FCD34D'],
        ticks: 230,
      });
    }, 180);

    // 3. Gentle golden shower finale
    setTimeout(() => {
      confetti({
        particleCount: 35,
        spread: 100,
        origin: { y: 0.35 },
        colors: ['#F59E0B', '#FBBF24', '#34D399', '#60A5FA'],
        gravity: 0.8,
        ticks: 280,
      });
    }, 400);
  } catch (error) {
    console.warn('Could not launch confetti:', error);
  }
}

