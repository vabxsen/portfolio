'use client';
import { Code2, PenTool } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, type CSSProperties } from 'react';
import { useMotionPreference } from './motion';

const drift = { stiffness: 45, damping: 16, mass: 0.9 };

// Platforms orbit a core that alternates between code and design. CSS drives the rotation;
// the pointer only shifts the layers at different depths.
export function HeroOrbit({ platforms, accents }: { platforms: string[]; accents: string[] }) {
  const reduced = useMotionPreference();
  const root = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, drift);
  const y = useSpring(pointerY, drift);
  const outerX = useTransform(x, (value) => value * 0.35);
  const outerY = useTransform(y, (value) => value * 0.35);
  const middleX = useTransform(x, (value) => value * 0.7);
  const middleY = useTransform(y, (value) => value * 0.7);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Pause the loops while the hero is off screen.
    const observer = new IntersectionObserver(([entry]) => {
      element.dataset.paused = String(!entry.isIntersecting);
    });
    observer.observe(element);
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const move = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 34);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 34);
    };
    if (!reduced && finePointer) window.addEventListener('pointermove', move, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', move);
    };
  }, [reduced, pointerX, pointerY]);

  return (
    <div className="hero-orbit" ref={root} aria-hidden="true">
      <div className="orbit-halo" />
      <motion.div className="orbit-layer" style={{ x: outerX, y: outerY }}>
        <div className="orbit-sweep" />
        <div className="orbit-ring orbit-ring-outer">
          {platforms.map((platform, index) => (
            <span
              className="orbit-node"
              key={`${platform}-${index}`}
              style={{ '--angle': `${(360 / platforms.length) * index - 60}deg` } as CSSProperties}
            >
              <span className="orbit-label">{platform}</span>
            </span>
          ))}
        </div>
      </motion.div>
      <motion.div className="orbit-layer" style={{ x: middleX, y: middleY }}>
        <div className="orbit-ring orbit-ring-middle">
          {accents.map((accent, index) => (
            <span
              className="orbit-node"
              key={`${accent}-${index}`}
              style={
                {
                  '--angle': `${(360 / accents.length) * index}deg`,
                  '--dot': accent,
                } as CSSProperties
              }
            >
              <span className="orbit-dot" />
            </span>
          ))}
        </div>
        <div className="orbit-ring orbit-ring-inner">
          <span className="orbit-node" style={{ '--angle': '0deg' } as CSSProperties}>
            <span className="orbit-dot orbit-dot-accent" />
          </span>
        </div>
      </motion.div>
      <motion.div className="orbit-core" style={{ x, y }}>
        <span className="orbit-ripple" />
        <span className="orbit-ripple" />
        <Code2 className="orbit-icon" size={30} strokeWidth={1.4} />
        <PenTool className="orbit-icon orbit-icon-alt" size={27} strokeWidth={1.4} />
      </motion.div>
    </div>
  );
}

// Lets any `.spotlight` element follow the pointer with one shared listener.
export function SpotlightTracker() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const move = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>('.spotlight');
      if (!target) return;
      const box = target.getBoundingClientRect();
      target.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
      target.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
    };
    document.addEventListener('pointermove', move, { passive: true });
    return () => document.removeEventListener('pointermove', move);
  }, []);
  return null;
}
