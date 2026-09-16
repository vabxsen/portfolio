import { Fragment, type CSSProperties, type ReactNode } from 'react';

// These effects are plain markup. CSS scroll-driven animations bring them to life where
// supported; everywhere else, and with reduced motion, the text simply renders at rest.

export function RevealLines({ lines }: { lines: ReactNode[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <span className="line-mask" key={index}>
          <span className="line-inner">{line}</span>
        </span>
      ))}
    </>
  );
}

export function ScrollWords({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  const last = Math.max(words.length - 1, 1);
  return (
    <p className="scroll-words">
      {words.map((word, index) => (
        <Fragment key={index}>
          <span style={{ '--p': index / last } as CSSProperties}>{word}</span>
          {index < words.length - 1 && ' '}
        </Fragment>
      ))}
    </p>
  );
}

export function TechMarquee({ items }: { items: string[] }) {
  if (!items.length) return null;
  // Each track must be wider than the viewport for the loop to stay seamless.
  const repeated = Array.from({ length: Math.ceil(16 / items.length) }, () => items).flat();
  return (
    <div className="tech-marquee" aria-hidden="true">
      <div className="marquee-rail">
        {[0, 1].map((track) => (
          <ul className="marquee-track" key={track}>
            {repeated.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export function OrbitText({ text }: { text: string }) {
  const phrase = `${text.trim()} • `;
  return (
    <svg className="orbit-text" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id="contact-orbit-path" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
      </defs>
      <text>
        <textPath href="#contact-orbit-path" textLength="512" lengthAdjust="spacing">
          {phrase.length > 30 ? phrase : phrase.repeat(2)}
        </textPath>
      </text>
    </svg>
  );
}
