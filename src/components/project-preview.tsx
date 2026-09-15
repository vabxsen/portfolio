import Image from 'next/image';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  CheckCheck,
  Circle,
  Command,
  Cpu,
  FileText,
  Folder,
  LayoutGrid,
  Link2,
  MapPin,
  Mic,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Zap,
} from 'lucide-react';
import type { Project } from '@/data/portfolio';
import { BudgiePreview } from './budgie-preview';

// Stylized interface studies summarize verified capabilities. They are labeled
// "Interface study" on the card and are not presented as original screenshots.
export function ProjectPreview({ project }: { project: Project }) {
  if (project.slug === 'kimi' && project.image)
    return (
      <div className="kimi-preview">
        <div className="kimi-preview-copy" aria-hidden="true">
          <span>Kimi.</span>
          <h4>
            Small steps.
            <br />
            Big happy energy.
          </h4>
          <p>
            A LITTLE RITUAL.
            <br />A BETTER DAY.
          </p>
        </div>
        <Image
          className="kimi-screen"
          src={project.image}
          alt={project.imageAlt}
          width={1080}
          height={2400}
          sizes="(max-width: 700px) 160px, 210px"
        />
      </div>
    );
  if (project.slug === 'budgie' && project.image)
    return <BudgiePreview image={project.image} imageAlt={project.imageAlt} />;
  if (project.image)
    return (
      <div className="project-image">
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(max-width: 700px) 100vw, 50vw"
        />
      </div>
    );
  if (project.slug === 'scoop')
    return (
      <div className="scoop-preview">
        <div className="scoop-caption">
          <ArrowDown size={27} />
          <strong>
            Scoop
            <span>
              Keep what
              <br />
              moves you.
            </span>
          </strong>
          <small>
            ON YOUR DEVICE.
            <br />
            ON YOUR TERMS.
          </small>
        </div>
        <div className="phone phone-back">
          <Image
            src="/projects/scoop-downloads.jpg"
            alt="Scoop Android download history screenshot"
            width={480}
            height={1067}
            sizes="220px"
          />
        </div>
        <div className="phone phone-front">
          <Image
            src="/projects/scoop-home.jpg"
            alt="Scoop Android home screenshot"
            width={480}
            height={1067}
            sizes="220px"
            priority
          />
        </div>
      </div>
    );
  if (project.slug === 'dailynx')
    return (
      <div className="mock-window habit-window" aria-hidden="true">
        <MockBar name="dailynx" />
        <div className="mock-app">
          <aside>
            <span className="mock-brand">d.</span>
            <LayoutGrid />
            <CheckCheck />
            <Zap />
            <Circle />
          </aside>
          <div className="mock-main">
            <div className="mock-kicker">YOUR EVERYDAY, A LITTLE BETTER</div>
            <h4>
              Small steps.
              <br />
              Real progress.
            </h4>
            <div className="habit-progress">
              <div>
                <span>Today’s progress</span>
                <b>
                  3 <small>/ 4 habits</small>
                </b>
              </div>
              <div className="progress-ring">
                75<span>%</span>
              </div>
            </div>
            <div className="habit-row">
              <span className="checked">
                <Check />
              </span>
              Read for 20 minutes<span>+ 10 XP</span>
            </div>
            <div className="habit-row">
              <span className="checked">
                <Check />
              </span>
              Make something<span>+ 10 XP</span>
            </div>
            <div className="habit-row">
              <span className="unchecked" />
              Go for a walk<span>30 min</span>
            </div>
          </div>
        </div>
      </div>
    );
  if (project.slug === 'pricepilot')
    return (
      <div className="mock-window price-window" aria-hidden="true">
        <MockBar name="PricePilot" />
        <div className="mock-main">
          <div className="mock-toolbar">
            <b>Price overview</b>
            <span>This month ↗</span>
          </div>
          <div className="price-summary">
            <div>
              <small>Good things come to those who track.</small>
              <h4>Know when to buy.</h4>
            </div>
            <TrendingDown size={30} />
          </div>
          <div className="chart-label">
            <span>Price history</span>
            <b>↓ Price drop detected</b>
          </div>
          <svg
            className="price-chart"
            viewBox="0 0 500 110"
            role="img"
            aria-label="Illustrative falling price trend"
          >
            <path d="M0 15H500M0 55H500M0 95H500" stroke="#ffffff0d" />
            <path
              d="M0 30 40 35 70 24 100 45 140 39 180 58 210 50 245 75 280 67 320 82 355 72 400 93 440 85 500 96"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
          </svg>
          <div className="mock-pills">
            <span>
              <Link2 size={13} /> Track a product
            </span>
            <span>
              <ShieldCheck size={13} /> Target price alerts
            </span>
          </div>
        </div>
      </div>
    );
  if (project.slug === 'pindrop')
    return (
      <div className="mock-window pin-window" aria-hidden="true">
        <MockBar name="pindrop" />
        <div className="consent-panel">
          <div className="pin-icon">
            <MapPin size={27} />
          </div>
          <span className="mock-kicker">LOCATION SHARING, WITH PERMISSION</span>
          <h4>You’re in control.</h4>
          <p>
            Share your location.
            <br />
            Only when you say yes.
          </p>
          <div className="mock-button">
            Allow location sharing <ArrowUpRight size={13} />
          </div>
          <small>
            <ShieldCheck size={12} /> Your permission comes first
          </small>
        </div>
      </div>
    );
  if (project.slug === 'nexrig')
    return (
      <div className="mock-window rig-window" aria-hidden="true">
        <MockBar name="NexRig" />
        <div className="mock-main">
          <div className="mock-toolbar">
            <b>Your next build</b>
            <span>
              <Check size={12} /> Compatible
            </span>
          </div>
          {[
            ['Processor', 'CPU'],
            ['Graphics card', 'GPU'],
            ['Memory', 'RAM'],
          ].map(([label, tag]) => (
            <div className="rig-row" key={tag}>
              <Cpu size={23} />
              <div>
                <small>{tag}</small>
                <b>{label}</b>
              </div>
              <Plus size={16} />
            </div>
          ))}
          <div className="rig-status">
            <ShieldCheck size={15} /> Every component. Checked together.
          </div>
        </div>
      </div>
    );
  if (project.slug === 'doclee')
    return (
      <div className="mock-window doc-window" aria-hidden="true">
        <MockBar name="doclee" />
        <div className="mock-main">
          <span className="mock-kicker">YOUR FILES STAY YOURS.</span>
          <h4>Documents, simplified.</h4>
          <div className="doc-tools">
            {[
              [FileText, 'Image to PDF'],
              [Folder, 'Merge PDFs'],
              [ShieldCheck, 'Protect a PDF'],
            ].map(([Icon, label]) => {
              const Symbol = Icon as typeof FileText;
              return (
                <div key={label as string}>
                  <Symbol size={26} />
                  <b>{label as string}</b>
                  <span>All in your browser ↗</span>
                </div>
              );
            })}
          </div>
          <p className="local-note">
            <ShieldCheck size={13} /> On-device processing. No upload needed.
          </p>
        </div>
      </div>
    );
  if (project.slug === 'gecko-ai')
    return (
      <div className="mock-window ai-window" aria-hidden="true">
        <MockBar name="Gecko AI" />
        <div className="ai-center">
          <Sparkles size={36} />
          <h4>A space to think.</h4>
          <p>Ideas, questions, possibilities.</p>
          <div className="mock-input">
            Start a conversation <ArrowUpRight size={16} />
          </div>
        </div>
      </div>
    );
  return (
    <div className="mock-window native-window" aria-hidden="true">
      <MockBar name="Native AI" />
      <div className="native-center">
        <div className="voice-icon">
          <Mic size={28} />
        </div>
        <h4>
          A little help.
          <br />
          Just a word away.
        </h4>
        <div className="waveform">
          {[8, 15, 25, 12, 35, 45, 22, 52, 31, 17, 38, 23, 12, 19, 9].map((height, index) => (
            <i key={index} style={{ height }} />
          ))}
        </div>
        <span className="mock-kicker">VOICE · AUTOMATION · PYTHON</span>
      </div>
    </div>
  );
}
function MockBar({ name }: { name: string }) {
  return (
    <div className="mock-bar">
      <div className="window-dots">
        <i />
        <i />
        <i />
      </div>
      <span>{name}</span>
      <Command size={10} />
    </div>
  );
}
