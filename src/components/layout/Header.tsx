import { useThemeStore } from '@/store/theme-store';

export function Header() {
  const { theme, toggle } = useThemeStore();

  return (
    <header className="border-b border-b1 bg-s1/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-3">
          <img src="/copart-logo.png" alt="Copart" className="h-7 w-auto" />
          <div>
            <h1 className="text-[13px] font-bold text-t1 leading-none">
              Dallas FIFA Predictor
            </h1>
            <p className="text-[10px] text-t3 leading-none mt-0.5 hidden sm:block">
              AT&T Stadium &middot; Copart Entertainment Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 bg-s2 rounded-full px-3 py-1 hover:bg-s3 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to war room mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-3.5 h-3.5 text-amber" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-accent-bright" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
            <span className="text-[10px] text-t3 font-medium">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
