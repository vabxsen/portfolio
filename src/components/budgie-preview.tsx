import {
  Battery,
  CalendarDays,
  ChartNoAxesColumn,
  LayoutGrid,
  Plus,
  Settings2,
  Wifi,
} from 'lucide-react';

// Illustrative mobile UI using sample subscriptions, not a product screenshot.
export function BudgiePreview() {
  return (
    <div className="budgie-preview" aria-hidden="true">
      <div className="budgie-preview-copy">
        <span>Budgie.</span>
        <h4>
          Less surprise.
          <br />
          More peace of mind.
        </h4>
        <p>
          YOUR SUBSCRIPTIONS.
          <br />A CLEARER PICTURE.
        </p>
      </div>
      <div className="budgie-mobile">
        <div className="budgie-status">
          <span>9:41</span>
          <span>
            <Wifi size={10} />
            <Battery size={12} />
          </span>
        </div>
        <div className="budgie-app-header">
          <b>
            budgie<span>.</span>
          </b>
          <span className="budgie-avatar">B</span>
        </div>
        <div className="budgie-app-body">
          <p className="budgie-greeting">A little clarity, every day.</p>
          <h4>
            Your subscriptions,
            <br />
            in one place.
          </h4>
          <div className="budgie-summary">
            <span>Monthly spending</span>
            <b>
              ₹899<small> / month</small>
            </b>
            <span>3 active subscriptions</span>
          </div>
          <div className="budgie-list-heading">
            <b>My subscriptions</b>
            <Plus size={11} />
          </div>
          {[
            { name: 'Music', initial: 'M', price: '₹149', color: '#dbe6c9' },
            { name: 'Cloud storage', initial: 'C', price: '₹250', color: '#d7e4ec' },
            { name: 'Creative tools', initial: 'C', price: '₹500', color: '#eddbca' },
          ].map((item) => (
            <div className="budgie-row" key={item.name}>
              <span className="budgie-service-icon" style={{ background: item.color }}>
                {item.initial}
              </span>
              <span className="budgie-service">
                <b>{item.name}</b>
                <small>Monthly plan</small>
              </span>
              <b>{item.price}</b>
            </div>
          ))}
        </div>
        <div className="budgie-app-nav">
          <span className="active">
            <LayoutGrid size={12} />
            Home
          </span>
          <span>
            <CalendarDays size={12} />
            Calendar
          </span>
          <span>
            <ChartNoAxesColumn size={12} />
            Insights
          </span>
          <span>
            <Settings2 size={12} />
            Settings
          </span>
        </div>
        <div className="budgie-home-indicator" />
      </div>
    </div>
  );
}
