import { ReactNode } from 'react';
import { BioMonitor } from './BioMonitor';
import { MiniMap } from './MiniMap';
import { TopBar } from './TopBar';
import { AbortButton } from './AbortButton';

interface Props {
  children: ReactNode;
  showSides?: boolean;
  selectableMap?: boolean;
  showAbort?: boolean;
}

export const Layout = ({ children, showSides = true, selectableMap = false, showAbort = true }: Props) => (
  <div className="bg-grid min-h-screen">
    <TopBar />
    <div className="px-4 lg:px-6 py-4 lg:py-6">
      <div
        className={`mx-auto w-full max-w-[1500px] grid gap-4 lg:gap-6 ${
          showSides
            ? 'grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px]'
            : 'grid-cols-1'
        }`}
      >
        {showSides && (
          <aside className="order-2 lg:order-1 space-y-4">
            <BioMonitor />
            {showAbort && <AbortButton />}
          </aside>
        )}
        <main className="order-1 lg:order-2 min-w-0">{children}</main>
        {showSides && (
          <aside className="order-3">
            <MiniMap selectable={selectableMap} />
          </aside>
        )}
      </div>
    </div>
  </div>
);
