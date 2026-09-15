'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { MagneticLink } from './motion';
import { navigation } from '@/data/portfolio';

const sectionLinks = [...navigation, { label: 'GitHub', href: '#opensource' }];

export function Navbar() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
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
  }, []);
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
    <header className="site-nav" ref={header}>
      <div className="nav-inner">
        <a href="#top" className="wordmark" aria-label="Vaibhav Sen home">
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
                  className="nav-active-line"
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
        <MagneticLink className="nav-contact" href="#contact">
          Let’s talk <ArrowUpRight size={15} />
        </MagneticLink>
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
            ...navigation,
            { label: 'GitHub', href: '#opensource' },
            { label: 'Contact', href: '#contact' },
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
