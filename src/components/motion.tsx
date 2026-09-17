'use client';
import {
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import {
  useContext,
  createContext,
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
  type PointerEvent,
} from 'react';

const MotionEnabled = createContext(true);
export function useMotionPreference() {
  const reduced = useReducedMotion();
  return !useContext(MotionEnabled) || reduced;
}
export function MotionProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  return (
    <MotionEnabled.Provider value={enabled}>
      <MotionConfig reducedMotion={enabled ? 'user' : 'always'}>
        {enabled && <ScrollProgress />}
        {children}
      </MotionConfig>
    </MotionEnabled.Provider>
  );
}

const spring = { stiffness: 180, damping: 24, mass: 0.7 };
const ease = [0.22, 1, 0.36, 1] as const;

function canTrackPointer(event: PointerEvent<HTMLElement>, reduced: boolean | null) {
  return (
    reduced === false &&
    event.pointerType === 'mouse' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 150, damping: 30 });
  return <motion.div className="scroll-progress" style={{ scaleX: progress }} aria-hidden="true" />;
}

const peakWeight = 800;
const reach = 190;

// CSS runs the entrance so server and client markup match and it starts before hydration.
// With a mouse, letters near the cursor ease toward a heavier weight of the variable font.
export function AnimatedName({ name }: { name: string }) {
  const reduced = useMotionPreference();
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches)
      return;
    const letters = [...element.querySelectorAll<HTMLElement>('.hero-letter')];
    const restWeight = Number.parseInt(getComputedStyle(element).fontWeight, 10) || 500;
    const weights = letters.map(() => restWeight);
    const targets = letters.map(() => restWeight);
    let centers: { x: number; y: number }[] = [];
    let frame = 0;
    const measure = () => {
      centers = letters.map((letter) => {
        const box = letter.getBoundingClientRect();
        return {
          x: box.left + box.width / 2 + window.scrollX,
          y: box.top + box.height / 2 + window.scrollY,
        };
      });
    };
    const tick = () => {
      let settling = false;
      letters.forEach((letter, index) => {
        const next = weights[index] + (targets[index] - weights[index]) * 0.16;
        weights[index] = Math.abs(targets[index] - next) < 1 ? targets[index] : next;
        if (weights[index] !== targets[index]) settling = true;
        letter.style.fontWeight = String(Math.round(weights[index]));
      });
      frame = settling ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const move = (event: globalThis.PointerEvent) => {
      if (!centers.length) measure();
      const x = event.clientX + window.scrollX;
      const y = event.clientY + window.scrollY;
      centers.forEach((center, index) => {
        const distance = Math.hypot(x - center.x, (y - center.y) * 1.4);
        const pull = Math.max(0, 1 - distance / reach);
        targets[index] = restWeight + (peakWeight - restWeight) * pull * pull;
      });
      start();
    };
    const rest = () => {
      targets.fill(restWeight);
      start();
    };
    // Measure once the entrance has settled, and again whenever the layout changes.
    const settle = window.setTimeout(measure, 1600);
    window.addEventListener('resize', measure);
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', rest);
    return () => {
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', rest);
      letters.forEach((letter) => letter.style.removeProperty('font-weight'));
    };
  }, [reduced]);

  return (
    <span className="hero-name" ref={root}>
      <span className="sr-only">{name}</span>
      <span aria-hidden="true">
        {name.split(' ').map((word, index) => (
          <span className="hero-word-mask" key={`${word}-${index}`}>
            <span style={{ '--i': index } as CSSProperties}>
              {Array.from(word).map((letter, position) => (
                <span className="hero-letter" key={position}>
                  {letter}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

export function MagneticLink({
  children,
  href,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  href: string;
  className: string;
  ariaLabel?: string;
}) {
  const reduced = useMotionPreference();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, spring);
  const smoothY = useSpring(y, spring);
  const bounds = useRef<DOMRect | null>(null);
  function reset() {
    x.set(0);
    y.set(0);
    bounds.current = null;
  }
  function move(event: PointerEvent<HTMLAnchorElement>) {
    if (!canTrackPointer(event, reduced)) return;
    const box = bounds.current ?? event.currentTarget.getBoundingClientRect();
    bounds.current = box;
    x.set(Math.max(-7, Math.min(7, (event.clientX - box.left - box.width / 2) * 0.12)));
    y.set(Math.max(-5, Math.min(5, (event.clientY - box.top - box.height / 2) * 0.15)));
  }
  return (
    <motion.a
      href={href}
      className={className}
      aria-label={ariaLabel}
      style={{ x: reduced ? 0 : smoothX, y: reduced ? 0 : smoothY }}
      onPointerMove={move}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onBlur={reset}
      whileTap={reduced === false ? { scale: 0.97 } : {}}
    >
      {children}
    </motion.a>
  );
}
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useMotionPreference();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduced === false ? { y: [28, 0], opacity: [0.45, 1] } : { y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
