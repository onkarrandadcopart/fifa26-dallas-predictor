import { NavLink } from 'react-router-dom';
import { useMovementStore } from '@/store/movement-store';
import { countUnreviewed } from '@/engine/movement';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', label: 'Dashboard' },
  { to: '/standings', label: 'Points Table' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/odds', label: 'Odds' },
  { to: '/movement', label: 'Movement' },
  { to: '/executive', label: 'Executive' },
  { to: '/clients', label: 'Clients' },
];

export function TabNav() {
  const events = useMovementStore((s) => s.events);
  const { total: unreviewedCount } = countUnreviewed(events);

  return (
    <nav className="border-b border-b1 bg-s1/50">
      <div className="flex gap-0 max-w-[1600px] mx-auto px-6">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              cn(
                'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors duration-150 flex items-center gap-1.5',
                isActive
                  ? 'border-accent text-accent-bright'
                  : 'border-transparent text-t3 hover:text-t2 hover:border-b3',
              )
            }
          >
            {tab.label}
            {tab.to === '/movement' && unreviewedCount > 0 && (
              <span className="bg-red text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                {unreviewedCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
