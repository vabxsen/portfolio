'use client';
import { motion, useReducedMotion } from 'framer-motion';
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={reduced ? {} : { opacity: [0.8, 1] }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
