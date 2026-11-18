import React, { useState } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Camera,
  ExternalLink,
  Power,
  ShieldCheck,
  Monitor,
} from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const BrowserPage: React.FC = () => {
  const [url, setUrl] = useState('https://www.google.com');
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const { addLog } = useTerminalStore();
  const { settings } = useSettingsStore();

  const handleLaunch = async () => {
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'BROWSER',
      message: `Initializing ${settings.browserType} browser (headed mode)...`,
    });
    setIsBrowserOpen(true);
    await window.api?.launchBrowser?.(url);
  };

  const handleClose = async () => {
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'BROWSER',
      message: 'Closing browser session.',
    });
    setIsBrowserOpen(false);
    await window.api?.closeBrowser?.();
  };

  const handleNavigate = async () => {
    if (!url) return;
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'ACTION',
      category: 'BROWSER',
      message: `Navigating to: ${url}`,
    });
    await window.api?.navigateBrowser?.(url);
  };

  const handleScreenshot = async () => {
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'ACTION',
      category: 'PLAYWRIGHT',
      message: 'Capturing high-resolution viewport screenshot...',
    });
    const shot = await window.api?.takeScreenshot?.();
    if (shot) {
      setScreenshotPreview(shot);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto h-full flex flex-col">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Browser View & Controls
          </h1>
          <p className="text-xs text-slate-400">
            Visible Chromium browser control and real-time viewport inspector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isBrowserOpen ? (
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
            >
              <Power className="w-3.5 h-3.5" />
              Close Browser
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors shadow-md shadow-cyan-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Launch Visible Browser
            </button>
          )}
        </div>
      </div>

      {/* Browser Navigation Bar */}
      <div className="bg-[#0b0f19] border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 shadow-lg">
        <div className="flex items-center gap-1 text-slate-400">
          <button className="p-1.5 rounded hover:bg-slate-800 transition-colors" title="Back">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded hover:bg-slate-800 transition-colors" title="Forward">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNavigate}
            className="p-1.5 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-cyan-400"
            title="Reload / Navigate"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* URL Input */}
        <div className="flex-1 flex items-center gap-2 bg-[#060911] border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNavigate();
            }}
            placeholder="Enter target URL..."
            className="w-full bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
          />
        </div>

        <button
          onClick={handleScreenshot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title="Take Viewport Screenshot"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Snapshot</span>
        </button>
      </div>

      {/* Main Viewport Workspace */}
      <div className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center relative min-h-[380px]">
        {screenshotPreview ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <img
              src={screenshotPreview}
              alt="Browser Viewport"
              className="max-h-full max-w-full rounded border border-slate-700 object-contain shadow-2xl"
            />
          </div>
        ) : (
          <div className="text-center p-8 space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
              <Monitor className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">
                Visible Chromium Automation Window
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Playwright controls a real visible browser window on your desktop so you can watch automated clicks, typing, and page navigation live.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              {[
                { label: 'Flipkart', url: 'https://www.flipkart.com' },
                { label: 'Google', url: 'https://www.google.com' },
                { label: 'GitHub', url: 'https://github.com' },
              ].map((site) => (
                <button
                  key={site.label}
                  onClick={() => setUrl(site.url)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition-colors"
                >
                  {site.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Viewport specs overlay */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-slate-400 backdrop-blur-sm">
          Viewport: {settings.viewportWidth} × {settings.viewportHeight} | Headless: {settings.headless ? 'True' : 'False'}
        </div>
      </div>
    </div>
  );
};
