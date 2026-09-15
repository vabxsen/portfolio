'use client';
import {
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import { useRef, type ReactNode, type CSSProperties, type PointerEvent } from 'react';

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      {children}
    </MotionConfig>
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

export function AnimatedName({ name }: { name: string }) {
  const reduced = useReducedMotion();
  return (
    <span className="hero-name">
      <span className="sr-only">{name}</span>
      <span aria-hidden="true">
        {name.split(' ').map((word, index) => (
          <span className="hero-word-mask" key={`${word}-${index}`}>
            <motion.span
              initial={false}
              animate={
                reduced === false
                  ? { y: [40, 0], opacity: [0.3, 1], filter: ['blur(5px)', 'blur(0px)'] }
                  : { y: 0, opacity: 1, filter: 'none' }
              }
              transition={{ duration: 0.85, delay: index * 0.12, ease }}
            >
              {word}
            </motion.span>
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
  const reduced = useReducedMotion();
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
  const reduced = useReducedMotion();
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
export function ProjectSurface({
  children,
  style,
  className = '',
  flat = false,
}: {
  children: ReactNode;
  style: CSSProperties;
  className?: string;
  flat?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, spring);
  const rotateY = useSpring(tiltY, spring);
  const bounds = useRef<DOMRect | null>(null);
  function reset() {
    tiltX.set(0);
    tiltY.set(0);
    bounds.current = null;
    ref.current?.style.setProperty('--preview-x', '0px');
    ref.current?.style.setProperty('--preview-y', '0px');
  }
  function move(event: PointerEvent<HTMLElement>) {
    if (!canTrackPointer(event, reduced)) return;
    const box = bounds.current ?? event.currentTarget.getBoundingClientRect();
    bounds.current = box;
    const x = Math.max(
      -0.5,
      Math.min(0.5, (event.clientX - box.left) / Math.max(box.width, 1) - 0.5),
    );
    const y = Math.max(
      -0.5,
      Math.min(0.5, (event.clientY - box.top) / Math.max(box.height, 1) - 0.5),
    );
    tiltX.set(flat ? 0 : -y * 5);
    tiltY.set(flat ? 0 : x * 5);
    event.currentTarget.style.setProperty('--preview-x', `${x * 12}px`);
    event.currentTarget.style.setProperty('--preview-y', `${y * 8}px`);
    event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - box.top}px`);
  }
  return (
    <motion.article
      ref={ref}
      style={{
        ...style,
        ...(flat
          ? {}
          : {
              rotateX: reduced ? 0 : rotateX,
              rotateY: reduced ? 0 : rotateY,
              transformPerspective: 1200,
            }),
      }}
      className={`project-card ${className}`}
      onPointerMove={move}
      onPointerLeave={reset}
      onPointerCancel={reset}
      whileHover={reduced === false ? { y: flat ? -4 : -5 } : {}}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.article>
  );
}
