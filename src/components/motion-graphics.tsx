'use client';
import { Code2, PenTool } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMotionPreference } from './motion';

const drift = { stiffness: 45, damping: 16, mass: 0.9 };
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export type OrbitProject = { slug: string; accent: string; platforms: number[] };
type Link = { x1: number; y1: number; x2: number; y2: number; color: string };

function centerWithin(element: Element, origin: DOMRect) {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2 - origin.left, y: box.top + box.height / 2 - origin.top };
}

// Platforms orbit a core that alternates between code and design, with one dot per project.
// Hovering a platform pauses the orbit and links it to its projects; clicking jumps to them.
export function HeroOrbit({
  platforms,
  projects,
}: {
  platforms: string[];
  projects: OrbitProject[];
}) {
  const reduced = useMotionPreference();
  const root = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const focusRef = useRef<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
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
    const move = (event: PointerEvent) => {
      if (focusRef.current !== null) return;
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 34);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 34);
    };
    if (!reduced && finePointer()) window.addEventListener('pointermove', move, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', move);
    };
  }, [reduced, pointerX, pointerY]);

  // Draw the links, following the layers while their drift settles.
  useEffect(() => {
    focusRef.current = focus;
    if (focus === null) {
      setLinks([]);
      return;
    }
    let frame = 0;
    let previous = '';
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const container = root.current;
      const label = labels.current[focus];
      if (!container || !label) return;
      const origin = container.getBoundingClientRect();
      const from = centerWithin(label, origin);
      const next = projects.flatMap((project, index) => {
        const dot = dots.current[index];
        if (!dot || !project.platforms.includes(focus)) return [];
        const to = centerWithin(dot, origin);
        return [{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, color: project.accent }];
      });
      const key = next
        .map((link) => `${link.x1 | 0},${link.y1 | 0},${link.x2 | 0},${link.y2 | 0}`)
        .join();
      if (key !== previous) {
        previous = key;
        setLinks(next);
      }
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [focus, projects]);

  function jump(platform: number) {
    const slugs = new Set(
      projects
        .filter((project) => project.platforms.includes(platform))
        .map((project) => project.slug),
    );
    const targets = [...document.querySelectorAll<HTMLElement>('[data-project]')].filter((target) =>
      slugs.has(target.dataset.project ?? ''),
    );
    if (!targets.length) return;
    targets[0].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    for (const target of targets) {
      target.dataset.spotlit = 'true';
      window.setTimeout(() => delete target.dataset.spotlit, 2600);
    }
  }

  return (
    <div
      className="hero-orbit"
      ref={root}
      aria-hidden="true"
      data-focus={focus === null ? undefined : 'true'}
    >
      <div className="orbit-halo" />
      <svg className="orbit-links">
        {links.map((link, index) => (
          <line
            key={index}
            x1={link.x1}
            y1={link.y1}
            x2={link.x2}
            y2={link.y2}
            style={{ '--dot': link.color } as CSSProperties}
          />
        ))}
      </svg>
      <motion.div className="orbit-layer" style={{ x: outerX, y: outerY }}>
        <div className="orbit-sweep" />
        <div className="orbit-ring orbit-ring-outer">
          {platforms.map((platform, index) => (
            <span
              className="orbit-node"
              key={`${platform}-${index}`}
              style={{ '--angle': `${(360 / platforms.length) * index - 60}deg` } as CSSProperties}
            >
              <span
                className="orbit-label"
                ref={(element) => {
                  labels.current[index] = element;
                }}
                data-active={focus === index ? 'true' : undefined}
                data-dim={focus !== null && focus !== index ? 'true' : undefined}
                onPointerEnter={() => setFocus(index)}
                onPointerLeave={() => setFocus((current) => (current === index ? null : current))}
                onClick={() => jump(index)}
              >
                {platform}
                <b className="orbit-count">
                  {projects.filter((project) => project.platforms.includes(index)).length}
                </b>
              </span>
            </span>
          ))}
        </div>
      </motion.div>
      <motion.div className="orbit-layer" style={{ x: middleX, y: middleY }}>
        <div className="orbit-ring orbit-ring-middle">
          {projects.map((project, index) => (
            <span
              className="orbit-node"
              key={project.slug}
              style={
                {
                  '--angle': `${(360 / projects.length) * index}deg`,
                  '--dot': project.accent,
                } as CSSProperties
              }
            >
              <span
                className="orbit-dot"
                ref={(element) => {
                  dots.current[index] = element;
                }}
                data-match={
                  focus === null ? undefined : project.platforms.includes(focus) ? 'true' : 'false'
                }
              />
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
    if (!finePointer()) return;
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

const maxTilt = 6; // Degrees at the preview's edges.
const tiltEase = 140; // Time constant in milliseconds.

type Tilt = {
  stage: HTMLElement;
  visual: HTMLElement;
  glare: HTMLElement | null;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

// Featured project previews tilt in 3D toward the mouse, pressing down where it points, while a
// soft glare follows it across the surface. Previews ease back flat when the mouse moves away.
export function TiltStages() {
  const reduced = useMotionPreference();

  useEffect(() => {
    if (reduced || !finePointer()) return;
    const tilts = new Map<HTMLElement, Tilt>();
    let active: HTMLElement | null = null;
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;
    let last = 0;

    const tick = (now: number) => {
      frame = 0;
      const elapsed = last ? Math.min(Math.max(now - last, 0), 50) : 16;
      last = now;
      const ease = 1 - Math.exp(-elapsed / tiltEase);
      let moving = false;
      for (const tilt of tilts.values()) {
        tilt.x += (tilt.targetX - tilt.x) * ease;
        tilt.y += (tilt.targetY - tilt.y) * ease;
        if (Math.abs(tilt.targetX - tilt.x) + Math.abs(tilt.targetY - tilt.y) > 0.0005)
          moving = true;
        else {
          tilt.x = tilt.targetX;
          tilt.y = tilt.targetY;
          if (tilt.stage !== active && !tilt.x && !tilt.y) {
            tilt.visual.style.removeProperty('transform');
            tilt.glare?.style.removeProperty('transform');
            tilts.delete(tilt.stage);
            continue;
          }
        }
        tilt.visual.style.transform = `perspective(1400px) rotateX(${(-tilt.y * 2 * maxTilt).toFixed(3)}deg) rotateY(${(tilt.x * 2 * maxTilt).toFixed(3)}deg)`;
        // The glare is twice the preview's size, so half of the pointer's offset centers it there.
        tilt.glare?.style.setProperty(
          'transform',
          `translate(${(tilt.x * 50).toFixed(2)}%, ${(tilt.y * 50).toFixed(2)}%)`,
        );
      }
      if (moving) frame = requestAnimationFrame(tick);
      else last = 0;
    };

    const update = (target: Element | null) => {
      const stage = target?.closest<HTMLElement>('.chapter-stage') ?? null;
      if (active && active !== stage) {
        const previous = tilts.get(active);
        if (previous) previous.targetX = previous.targetY = 0;
        delete active.dataset.tilting;
      }
      active = stage;
      const visual = stage?.querySelector<HTMLElement>('.project-visual');
      if (stage && visual && pointer) {
        let tilt = tilts.get(stage);
        if (!tilt) {
          tilt = {
            stage,
            visual,
            glare: visual.querySelector('.stage-glare'),
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
          };
          tilts.set(stage, tilt);
        }
        const box = stage.getBoundingClientRect();
        const clamp = (value: number) => Math.min(Math.max(value, -0.5), 0.5);
        tilt.targetX = clamp((pointer.x - box.left) / box.width - 0.5);
        tilt.targetY = clamp((pointer.y - box.top) / box.height - 0.5);
        stage.dataset.tilting = 'true';
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      update(event.target instanceof Element ? event.target : null);
    };
    // Scrolling moves previews under a still mouse.
    let scrollFrame = 0;
    const scroll = () => {
      if (!pointer || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        if (pointer) update(document.elementFromPoint(pointer.x, pointer.y));
      });
    };
    const leave = (event: MouseEvent) => {
      if (event.relatedTarget) return;
      pointer = null;
      update(null);
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });
    document.addEventListener('mouseout', leave);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', scroll);
      document.removeEventListener('mouseout', leave);
      for (const tilt of tilts.values()) {
        tilt.visual.style.removeProperty('transform');
        tilt.glare?.style.removeProperty('transform');
        delete tilt.stage.dataset.tilting;
      }
    };
  }, [reduced]);

  return null;
}

const snapTargets =
  '.button, .nav-contact, .hero-contact, .project-link, .contact-orb, .desktop-nav a, .menu-toggle';
const cursorLag = { stiffness: 520, damping: 42, mass: 0.45 };
const cursorGrow = { stiffness: 360, damping: 30 };

// A ring that trails the mouse: it wraps buttons, and labels project previews and list rows.
// The native cursor stays visible; touch devices and reduced motion never see the ring.
export function CustomCursor() {
  const reduced = useMotionPreference();
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const width = useMotionValue(30);
  const height = useMotionValue(30);
  const smoothX = useSpring(x, cursorLag);
  const smoothY = useSpring(y, cursorLag);
  const smoothWidth = useSpring(width, cursorGrow);
  const smoothHeight = useSpring(height, cursorGrow);

  useEffect(() => {
    const element = ring.current;
    if (!element || reduced || !finePointer()) return;
    let pointer = { x: -100, y: -100 };

    const update = (target: Element | null) => {
      const snap = target?.closest<HTMLElement>(snapTargets);
      const stage = target?.closest('.stage-link');
      const row = target?.closest<HTMLElement>('.index-row > summary');
      let mode = 'default';
      let text = '';
      if (snap) {
        const box = snap.getBoundingClientRect();
        const radius = getComputedStyle(snap).borderTopLeftRadius;
        x.set(box.left + box.width / 2);
        y.set(box.top + box.height / 2);
        width.set(box.width + 14);
        height.set(box.height + 14);
        element.style.setProperty(
          '--cursor-radius',
          radius.includes('%') ? radius : `calc(${radius} + 7px)`,
        );
        mode = 'snap';
      } else {
        x.set(pointer.x);
        y.set(pointer.y);
        element.style.removeProperty('--cursor-radius');
        if (stage || row) {
          mode = 'label';
          text = stage
            ? 'View'
            : (row?.parentElement as HTMLDetailsElement).open
              ? 'Close'
              : 'Open';
          width.set(84);
          height.set(84);
        } else {
          const interactive = target?.closest('a, button, summary');
          mode = interactive ? 'hover' : 'default';
          width.set(interactive ? 46 : 30);
          height.set(interactive ? 46 : 30);
        }
      }
      element.dataset.mode = mode;
      if (label.current && label.current.textContent !== text) label.current.textContent = text;
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      const appearing = element.dataset.visible !== 'true';
      element.dataset.visible = 'true';
      update(event.target as Element);
      if (appearing) {
        smoothX.jump(x.get());
        smoothY.jump(y.get());
        smoothWidth.jump(width.get());
        smoothHeight.jump(height.get());
      }
    };
    const refresh = () => {
      if (element.dataset.visible === 'true')
        update(document.elementFromPoint(pointer.x, pointer.y));
    };
    const leave = (event: MouseEvent) => {
      if (!event.relatedTarget) element.dataset.visible = 'false';
    };
    const afterClick = () => requestAnimationFrame(refresh);

    element.dataset.enabled = 'true';
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', refresh, { passive: true });
    document.addEventListener('mouseout', leave);
    document.addEventListener('click', afterClick);
    return () => {
      delete element.dataset.enabled;
      delete element.dataset.visible;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', refresh);
      document.removeEventListener('mouseout', leave);
      document.removeEventListener('click', afterClick);
    };
  }, [reduced, x, y, width, height, smoothX, smoothY, smoothWidth, smoothHeight]);

  return (
    <motion.div
      ref={ring}
      className="cursor"
      aria-hidden="true"
      style={{ x: smoothX, y: smoothY, width: smoothWidth, height: smoothHeight }}
    >
      <span ref={label} className="cursor-label" />
    </motion.div>
  );
}

// One scroll listener for two effects: the page tints toward the accent of the featured
// chapter nearest the middle of the screen, and the contact curtain reports how far the
// page above it has slid away.
export function ScrollEffects() {
  const reduced = useMotionPreference();
  const tint = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = tint.current;
    const curtain = layer?.closest<HTMLElement>('.curtain');
    if (!layer || !curtain) return;
    const chapters = [...curtain.querySelectorAll<HTMLElement>('.chapter')];
    const counter = curtain.querySelector<HTMLElement>('.chapter-counter');
    const cover = curtain.querySelector<HTMLElement>('.curtain-cover');
    const stage = curtain.querySelector<HTMLElement>('.curtain-stage');
    let frame = 0;

    // Pin the panel only when it fits on screen; a taller one would be revealed bottom first.
    const layout = () => {
      if (!stage) return;
      const fits = stage.offsetHeight <= window.innerHeight - 24;
      if (!reduced && fits && window.innerWidth > 700) curtain.dataset.curtain = 'pinned';
      else delete curtain.dataset.curtain;
    };
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let accent = '';
      let strength = 0;
      let nearest = 0;
      let nearestDistance = Infinity;
      chapters.forEach((chapter, index) => {
        const box = chapter.getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - middle);
        const score = 1 - Math.min(distance / (box.height / 2 + middle * 0.6), 1);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = index;
        }
        if (score > strength) {
          strength = score;
          accent = chapter.style.getPropertyValue('--project-accent');
        }
      });
      if (counter && chapters.length) {
        counter.style.setProperty('--current', String(nearest));
        counter.style.setProperty(
          '--counter-accent',
          chapters[nearest].style.getPropertyValue('--project-accent'),
        );
      }
      if (!reduced) {
        if (accent) layer.style.setProperty('--tint', accent);
        layer.style.opacity = Math.min(1, strength * 1.5).toFixed(3);
      }
      if (cover && stage) {
        const hidden = window.innerHeight - cover.getBoundingClientRect().bottom;
        const reveal = Math.min(1, Math.max(0, hidden / Math.max(stage.offsetHeight, 1)));
        stage.style.setProperty('--reveal', reveal.toFixed(3));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = () => {
      layout();
      schedule();
    };
    // Keyboard focus inside the pinned panel would otherwise stay hidden behind the page.
    const reveal = () => {
      if (!cover || !stage || !curtain.dataset.curtain) return;
      const coverBottom = cover.getBoundingClientRect().bottom + window.scrollY;
      const top = coverBottom + stage.offsetHeight - window.innerHeight;
      if (window.scrollY < top - 1) window.scrollTo({ top, behavior: 'auto' });
    };
    const observer = new ResizeObserver(resize);

    layout();
    update();
    if (stage) observer.observe(stage);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    stage?.addEventListener('focusin', reveal);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      stage?.removeEventListener('focusin', reveal);
      delete curtain.dataset.curtain;
      layer.style.opacity = '0';
    };
  }, [reduced]);

  return <div ref={tint} className="page-tint" aria-hidden="true" />;
}

const decodeTargets =
  '.section-label, .work-caption > span, .chapter-rule > span, .index-header > span, .stage-label, .timeline-period';
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const symbols = '#%&*+=/<>';
const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

function scramble(char: string) {
  if (/\d/.test(char)) return pick('0123456789');
  if (!/[a-z]/i.test(char)) return char;
  if (Math.random() < 0.2) return pick(symbols);
  const letter = pick(letters);
  return char === char.toLowerCase() ? letter.toLowerCase() : letter;
}

// Small labels cycle through random characters the first time they scroll into view, then
// settle left to right into their real text. The text nodes are restored exactly afterwards.
export function DecodeLabels() {
  const reduced = useMotionPreference();

  useEffect(() => {
    if (reduced) return;
    const running = new Set<() => void>();

    const decode = (element: Element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const parts: { node: Text; text: string; offset: number }[] = [];
      let length = 0;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.nodeValue ?? '';
        if (!text.trim()) continue;
        parts.push({ node: node as Text, text, offset: length });
        length += text.length;
      }
      if (!length) return;
      const step = Math.min(34, 760 / length);
      let frame = 0;
      let start = 0;
      let rolled = 0;
      const finish = () => {
        cancelAnimationFrame(frame);
        for (const { node, text } of parts) node.nodeValue = text;
        running.delete(finish);
      };
      const tick = (now: number) => {
        start ||= now;
        frame = requestAnimationFrame(tick);
        // Roll new characters about twenty times a second rather than every frame.
        if (now - rolled < 50) return;
        rolled = now;
        const elapsed = now - start;
        let settled = true;
        for (const { node, text, offset } of parts) {
          let next = '';
          for (let index = 0; index < text.length; index++) {
            const done = elapsed >= 140 + (offset + index) * step;
            if (!done && /\w/.test(text[index])) settled = false;
            next += done ? text[index] : scramble(text[index]);
          }
          node.nodeValue = next;
        }
        if (settled) finish();
      };
      running.add(finish);
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          decode(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    document.querySelectorAll(decodeTargets).forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      running.forEach((finish) => finish());
    };
  }, [reduced]);

  return null;
}

// Whether a wheel over `start` should scroll an inner scrollable element instead of the page.
function innerScroller(start: EventTarget | null, delta: number) {
  for (
    let node = start instanceof Element ? start : null;
    node && node !== document.body && node !== document.documentElement;
    node = node.parentElement
  ) {
    if (node.scrollHeight <= node.clientHeight) continue;
    if (!/auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) continue;
    const room =
      delta < 0 ? node.scrollTop : node.scrollHeight - node.clientHeight - node.scrollTop;
    if (room > 1) return true;
  }
  return false;
}

const glide = 120; // Time constant in milliseconds for easing toward the wheel's target.

// Mouse wheel scrolling glides toward its target instead of jumping in steps. The page itself
// still scrolls, so sticky elements and scroll-driven animations behave as usual. Keyboard,
// links, and the scrollbar keep their native behavior and take over from a glide in progress.
export function SmoothScroll() {
  const reduced = useMotionPreference();

  useEffect(() => {
    if (reduced) return;
    let target = 0;
    let current = 0;
    let written = 0;
    let last = 0;
    let frame = 0;

    const tick = (now: number) => {
      if (Math.abs(window.scrollY - written) > 3) {
        frame = 0;
        return;
      }
      const elapsed = Math.min(now - last, 64);
      last = now;
      current += (target - current) * (1 - Math.exp(-elapsed / glide));
      if (Math.abs(target - current) < 0.5) current = target;
      window.scrollTo({ top: current, behavior: 'instant' });
      written = window.scrollY;
      frame = current === target ? 0 : requestAnimationFrame(tick);
    };
    const wheel = (event: WheelEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return;
      if (innerScroller(event.target, event.deltaY)) return;
      event.preventDefault();
      if (!frame) {
        current = target = written = window.scrollY;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
      const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = Math.min(max, Math.max(0, target + event.deltaY * unit));
    };

    window.addEventListener('wheel', wheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', wheel);
    };
  }, [reduced]);

  return null;
}

const dotSpacing = 26;
const dotSize = 1.6;
const dotReach = 150; // Pixels around the mouse that dots move away from.
const dotPush = 22; // Largest distance a dot moves.
const alphaLevels = 12;

type Dot = {
  x: number;
  y: number;
  alpha: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  glow: number;
};

// A field of faint dots behind the hero, fading out from the orbit's side like the grid it
// replaces. Dots part around the mouse like a gravity well and spring back when it moves on.
// Without a mouse, or with reduced motion, the field stays still.
export function HeroDots() {
  const reduced = useMotionPreference();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const interactive = !reduced && finePointer();
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let pointer: { x: number; y: number } | null = null;
    let visible = true;
    let frame = 0;
    let last = 0;
    let ink = '';
    let accent = '';

    const draw = () => {
      context.clearRect(0, 0, width, height);
      // Dots are grouped by opacity so each group is one fill.
      const plain = Array.from({ length: alphaLevels }, () => [] as Dot[]);
      const lit = Array.from({ length: alphaLevels }, () => [] as Dot[]);
      for (const dot of dots) {
        plain[Math.round(dot.alpha * (alphaLevels - 1))].push(dot);
        if (dot.glow > 0.02)
          lit[Math.min(alphaLevels - 1, Math.round(dot.glow * (alphaLevels - 1)))].push(dot);
      }
      const fill = (groups: Dot[][], color: string, strength: number, size: number) => {
        context.fillStyle = color;
        groups.forEach((group, level) => {
          if (!level || !group.length) return;
          context.globalAlpha = (strength * level) / (alphaLevels - 1);
          context.beginPath();
          for (const dot of group)
            context.rect(dot.x + dot.dx - size / 2, dot.y + dot.dy - size / 2, size, size);
          context.fill();
        });
      };
      fill(plain, ink, 0.2, dotSize);
      fill(lit, accent, 0.75, dotSize + 0.6);
      context.globalAlpha = 1;
    };

    const layout = () => {
      const style = getComputedStyle(canvas);
      ink = style.color;
      accent = style.getPropertyValue('--accent').trim() || ink;
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      dots = [];
      const columns = Math.floor(width / dotSpacing);
      const rows = Math.floor(height / dotSpacing);
      const left = (width - (columns - 1) * dotSpacing) / 2;
      const top = (height - (rows - 1) * dotSpacing) / 2;
      for (let row = 0; row < rows; row++)
        for (let column = 0; column < columns; column++) {
          const x = left + column * dotSpacing;
          const y = top + row * dotSpacing;
          // The same soft ellipse, centered right of the middle, that masked the old grid.
          const distance = Math.hypot(
            (x - width * 0.72) / (width * 0.55),
            (y - height * 0.42) / (height * 0.62),
          );
          const fade = Math.max(0, 1 - distance / 0.72);
          const alpha = fade * fade * (3 - 2 * fade);
          if (alpha > 0.04) dots.push({ x, y, alpha, dx: 0, dy: 0, vx: 0, vy: 0, glow: 0 });
        }
      draw();
      canvas.dataset.ready = 'true';
    };

    const step = (now: number) => {
      frame = 0;
      const elapsed = last ? Math.min(Math.max((now - last) / 1000, 0), 0.05) : 1 / 60;
      last = now;
      const box = canvas.getBoundingClientRect();
      const mouse = pointer ? { x: pointer.x - box.left, y: pointer.y - box.top } : null;
      const fade = 1 - Math.exp(-elapsed / 0.12);
      let moving = false;
      for (const dot of dots) {
        let targetX = 0;
        let targetY = 0;
        let glow = 0;
        if (mouse) {
          const offsetX = dot.x - mouse.x;
          const offsetY = dot.y - mouse.y;
          const distance = Math.hypot(offsetX, offsetY);
          if (distance < dotReach && distance > 0.01) {
            const pull = 1 - distance / dotReach;
            targetX = (offsetX / distance) * pull * pull * dotPush;
            targetY = (offsetY / distance) * pull * pull * dotPush;
            glow = pull * dot.alpha;
          }
        }
        // A slightly underdamped spring, so dots overshoot a touch as they settle.
        dot.vx += ((targetX - dot.dx) * 170 - dot.vx * 16) * elapsed;
        dot.vy += ((targetY - dot.dy) * 170 - dot.vy * 16) * elapsed;
        dot.dx += dot.vx * elapsed;
        dot.dy += dot.vy * elapsed;
        dot.glow += (glow - dot.glow) * fade;
        if (
          Math.abs(targetX - dot.dx) + Math.abs(targetY - dot.dy) > 0.05 ||
          Math.abs(dot.vx) + Math.abs(dot.vy) > 0.05 ||
          Math.abs(glow - dot.glow) > 0.004
        )
          moving = true;
      }
      draw();
      if (moving) frame = requestAnimationFrame(step);
      else last = 0;
    };
    const start = () => {
      if (visible && !frame) frame = requestAnimationFrame(step);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      start();
    };
    const leave = (event: MouseEvent) => {
      if (event.relatedTarget) return;
      pointer = null;
      start();
    };
    const scroll = () => {
      if (pointer) start();
    };
    const resizer = new ResizeObserver(layout);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });

    resizer.observe(canvas);
    if (interactive) {
      observer.observe(canvas);
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('scroll', scroll, { passive: true });
      document.addEventListener('mouseout', leave);
    }
    return () => {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', scroll);
      document.removeEventListener('mouseout', leave);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="hero-dots" aria-hidden="true" />;
}
