'use client';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { useRef, type ReactNode, type CSSProperties, type PointerEvent } from 'react';

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
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
      whileInView={reduced ? {} : { y: [16, 0], opacity: [0.65, 1] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
export function ProjectSurface({
  children,
  style,
  className = '',
}: {
  children: ReactNode;
  style: CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  function move(event: PointerEvent<HTMLElement>) {
    if (reduced || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - box.top}px`);
  }
  return (
    <motion.article
      ref={ref}
      style={style}
      className={`project-card ${className}`}
      onPointerMove={move}
      whileHover={reduced ? {} : { y: -4 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.article>
  );
}
