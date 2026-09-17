'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { MagneticLink } from './motion';
import { navigation } from '@/data/portfolio';

export function Navbar({ sections, name }: { sections: Record<string, boolean>; name: string }) {
  const visibleNavigation = navigation.filter((item) => sections[item.href.slice(1)]);
  const sectionLinks = [
    ...visibleNavigation,
    ...(sections.opensource ? [{ label: 'GitHub', href: '#opensource' }] : []),
  ];
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive('#' + entry.target.id);
      },
      { rootMargin: '-15% 0px -55% 0px' },
    );
    sectionLinks.forEach((item) => {
      const section = document.querySelector(item.href);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [sections.work, sections.about, sections.journey, sections.opensource]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);
  return (
    <header className="site-nav" data-scrolled={scrolled || undefined} ref={header}>
      <div className="nav-inner">
        <a href="#top" className="wordmark" aria-label={`${name} home`}>
          vs<span>.</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {sectionLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? 'location' : undefined}
            >
              {item.label}
              {active === item.href && (
                <motion.span
                  className="nav-active-pill"
                  layoutId="active-section"
                  aria-hidden="true"
                  transition={
                    reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }
                  }
                />
              )}
            </a>
          ))}
        </nav>
        {sections.contact && (
          <MagneticLink className="nav-contact" href="#contact">
            Let’s talk <ArrowUpRight size={15} />
          </MagneticLink>
        )}
        <button
          className="menu-toggle"
          ref={toggle}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav id="mobile-menu" className="mobile-nav" hidden={!open} aria-label="Mobile navigation">
          {[
            ...sectionLinks,
            ...(sections.contact ? [{ label: 'Contact', href: '#contact' }] : []),
          ].map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
              <ArrowUpRight size={16} />
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
