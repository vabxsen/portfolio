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
const peakScale = 1.3;
const followPointer = 55; // Time constants in milliseconds: the pointer glides, then letters ease.
const easeLetters = 95;

type Box = { left: number; top: number; width: number; height: number };

// How far a letter's center moves away from the pointer so grown letters push their
// neighbors aside instead of overlapping, like icons in a dock.
function spread(boxes: Box[], scales: number[], index: number, pointerX: number) {
  const box = boxes[index];
  const sameLine = (other: Box) => Math.abs(other.top - box.top) < box.height / 2;
  const line = boxes.filter(sameLine);
  const pivot = Math.min(
    Math.max(pointerX, Math.min(...line.map((other) => other.left))),
    Math.max(...line.map((other) => other.left + other.width)),
  );
  const center = box.left + box.width / 2;
  const from = Math.min(pivot, center);
  const to = Math.max(pivot, center);
  let extra = 0;
  boxes.forEach((other, position) => {
    if (!sameLine(other)) return;
    const overlap = Math.min(to, other.left + other.width) - Math.max(from, other.left);
    if (overlap > 0) extra += overlap * (scales[position] - 1);
  });
  return center < pivot ? -extra : extra;
}

// CSS runs the entrance so server and client markup match and it starts before hydration.
// With a mouse, letters near the cursor grow and ease toward a heavier weight of the variable
// font, spreading apart around it. Both follow a smoothed pointer so the motion glides.
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
    const scales = letters.map(() => 1);
    let reach = 200;
    let pointer: { x: number; y: number } | null = null;
    let glide: { x: number; y: number } | null = null;
    let live = false;
    let visible = true;
    let frame = 0;
    let last = 0;

    const reset = () => {
      live = false;
      delete element.dataset.live;
      for (const letter of letters)
        for (const property of ['margin-left', 'transform', 'font-weight'])
          letter.style.removeProperty(property);
    };
    // Scaling needs inline blocks, which lose the font's kerning between letters, so each
    // letter gets a margin that puts it back where the kerned text had it.
    const prepare = () => {
      reset();
      const offsets = () =>
        letters.map(
          (letter) =>
            letter.getBoundingClientRect().left -
            (letter.parentElement?.getBoundingClientRect().left ?? 0),
        );
      const kerned = offsets();
      element.dataset.live = 'true';
      const spaced = offsets();
      letters.forEach((letter, index) => {
        const first = index === 0 || letter.parentElement !== letters[index - 1].parentElement;
        const drift = kerned[index] - spaced[index];
        const before = first ? 0 : kerned[index - 1] - spaced[index - 1];
        letter.style.marginLeft = `${(drift - before).toFixed(2)}px`;
      });
      weights.fill(restWeight);
      scales.fill(1);
      reach = Number.parseFloat(getComputedStyle(element).fontSize) * 2.3 || 200;
      live = true;
      start();
    };

    const tick = (now: number) => {
      frame = 0;
      if (!live) return;
      // A frame's timestamp can precede the moment it was requested, so never step backwards.
      const elapsed = last ? Math.min(Math.max(now - last, 0), 50) : 16;
      last = now;
      let moving = false;
      if (pointer && glide) {
        const follow = 1 - Math.exp(-elapsed / followPointer);
        glide.x += (pointer.x - glide.x) * follow;
        glide.y += (pointer.y - glide.y) * follow;
        if (Math.hypot(pointer.x - glide.x, pointer.y - glide.y) > 0.2) moving = true;
      }
      // Layout boxes, which the transforms written below do not affect. Each word can be its
      // own offset parent, so every letter is measured from its own.
      const origins = new Map<Element | null, DOMRect | undefined>();
      const boxes = letters.map((letter) => {
        const parent = letter.offsetParent;
        if (!origins.has(parent)) origins.set(parent, parent?.getBoundingClientRect());
        const origin = origins.get(parent);
        return {
          left: (origin?.left ?? 0) + letter.offsetLeft,
          top: (origin?.top ?? 0) + letter.offsetTop,
          width: letter.offsetWidth,
          height: letter.offsetHeight,
        };
      });
      const ease = 1 - Math.exp(-elapsed / easeLetters);
      boxes.forEach((box, index) => {
        let pull = 0;
        if (pointer && glide) {
          const dx = glide.x - (box.left + box.width / 2);
          const dy = (glide.y - (box.top + box.height / 2)) * 1.3;
          const distance = Math.hypot(dx, dy) / reach;
          // A cosine bell: full strength at the pointer, fading out with no hard edge.
          if (distance < 1) pull = (1 + Math.cos(Math.PI * distance)) / 2;
        }
        const scale = 1 + (peakScale - 1) * pull;
        const weight = restWeight + (peakWeight - restWeight) * pull;
        scales[index] += (scale - scales[index]) * ease;
        weights[index] += (weight - weights[index]) * ease;
        if (Math.abs(scale - scales[index]) > 0.0004 || Math.abs(weight - weights[index]) > 0.3)
          moving = true;
        else {
          scales[index] = scale;
          weights[index] = weight;
        }
      });
      letters.forEach((letter, index) => {
        const shift = glide ? spread(boxes, scales, index, glide.x) : 0;
        letter.style.fontWeight = weights[index].toFixed(1);
        // Letters at full size still move aside for grown neighbors.
        letter.style.transform =
          scales[index] === 1 && Math.abs(shift) < 0.01
            ? ''
            : `translateX(${shift.toFixed(2)}px) scale(${scales[index].toFixed(4)})`;
      });
      if (moving) start();
      else last = 0;
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const entering = !pointer;
      pointer = { x: event.clientX, y: event.clientY };
      if (entering || !glide) glide = { ...pointer };
      if (visible) start();
    };
    const leave = () => {
      pointer = null;
      start();
    };
    const scroll = () => {
      if (visible && pointer) start();
    };
    let resizeFrame = 0;
    const resize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(prepare);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });

    // Start once the entrance has settled.
    const settle = window.setTimeout(prepare, 1600);
    observer.observe(element);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', resize);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', resize);
      document.documentElement.removeEventListener('pointerleave', leave);
      reset();
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
