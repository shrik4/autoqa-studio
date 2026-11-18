import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  KeyRound,
  Globe,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTerminalStore } from '../../stores/useTerminalStore';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSetting,
    testStatus,
    setTestStatus,
    setSettings,
  } = useSettingsStore();

  const { addLog } = useTerminalStore();

  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    // Load initial settings from main process
    if (window.api?.getSettings) {
      window.api.getSettings().then((loaded) => {
        if (loaded) setSettings(loaded);
      }).catch(() => {});
    }
  }, [setSettings]);

  const handleTestKey = async () => {
    if (!settings.geminiApiKey) {
      setTestStatus({ tested: true, valid: false, message: 'Please enter an API key first.' });
      return;
    }
    setIsTestingKey(true);
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'SYSTEM',
      message: 'Verifying Gemini API key against Google endpoint...',
    });

    try {
      const res = await window.api?.testGeminiKey?.(settings.geminiApiKey);
      if (res?.valid) {
        setTestStatus({ tested: true, valid: true, message: 'Gemini API key is active and valid.' });
        addLog({
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'SUCCESS',
          category: 'SYSTEM',
          message: 'Gemini API key successfully authenticated.',
        });
      } else {
        setTestStatus({ tested: true, valid: false, message: res?.error || 'Verification failed.' });
        addLog({
          id: (Date.now() + 2).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'ERROR',
          category: 'SYSTEM',
          message: `Gemini API key verification error: ${res?.error}`,
        });
      }
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSave = async () => {
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'SYSTEM',
      message: 'Saving application preferences...',
    });

    const success = await window.api?.saveSettings?.(settings);
    if (success) {
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
      addLog({
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'SUCCESS',
        category: 'SYSTEM',
        message: 'Settings saved successfully to secure local store.',
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto h-full">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            Application Configuration
          </h1>
          <p className="text-xs text-slate-400">
            Manage your Gemini AI credentials, Playwright browser behavior, and execution safety rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-md shadow-cyan-500/20"
        >
          {isSavedRecently ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {isSavedRecently ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* 1. Gemini AI Configuration Section */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-b border-slate-800 pb-3">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <span>GOOGLE GEMINI API CONFIGURATION</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.geminiApiKey}
                  onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#060911] border border-slate-700/80 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTestingKey}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              >
                {isTestingKey ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                Test Connection
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Never exposed to the frontend. Encrypted in local Electron user data.
            </p>
          </div>

          {testStatus.tested && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                testStatus.valid
                  ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                  : 'bg-rose-950/30 border-rose-900/50 text-rose-400'
              }`}
            >
              {testStatus.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{testStatus.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Active Gemini Model
            </label>
            <select
              value={settings.geminiModel}
              onChange={(e) => updateSetting('geminiModel', e.target.value)}
              className="bg-[#060911] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500/50 w-full sm:w-80"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-fast, Recommended)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Playwright Browser Controls Section */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-b border-slate-800 pb-3">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>PLAYWRIGHT BROWSER AUTOMATION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Browser Visibility Mode
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="headless"
                  checked={!settings.headless}
                  onChange={() => updateSetting('headless', false)}
                  className="accent-cyan-500"
                />
                <span>Visible Window (Recommended for QA audit)</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="headless"
                  checked={settings.headless}
                  onChange={() => updateSetting('headless', true)}
                  className="accent-cyan-500"
                />
                <span>Headless</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Action Timeout (milliseconds)
            </label>
            <input
              type="number"
              value={settings.actionTimeoutMs}
              onChange={(e) => updateSetting('actionTimeoutMs', Number(e.target.value))}
              className="w-full bg-[#060911] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Slow-Motion Delay between Actions (ms)
            </label>
            <input
              type="number"
              value={settings.slowMoMs}
              onChange={(e) => updateSetting('slowMoMs', Number(e.target.value))}
              className="w-full bg-[#060911] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Adds human-observable delays (e.g. 500ms) so you can watch automated clicks and typing clearly.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Automatic Retry Limit on Failures
            </label>
            <input
              type="number"
              value={settings.maxRetries}
              min={0}
              max={5}
              onChange={(e) => updateSetting('maxRetries', Number(e.target.value))}
              className="w-full bg-[#060911] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Security Guardrails */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SECURITY & SAFETY GUARDRAILS</span>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-start gap-3 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requireConfirmationForSensitive}
              onChange={(e) => updateSetting('requireConfirmationForSensitive', e.target.checked)}
              className="mt-0.5 accent-cyan-500 rounded"
            />
            <div>
              <span className="font-semibold block text-slate-200">
                Require human approval for purchases, payments, and sensitive forms
              </span>
              <span className="text-slate-400 text-[11px] block">
                Prevents accidental checkouts, payment gateway submissions, or account deletion without explicit user click.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.saveScreenshotsOnFailure}
              onChange={(e) => updateSetting('saveScreenshotsOnFailure', e.target.checked)}
              className="mt-0.5 accent-cyan-500 rounded"
            />
            <div>
              <span className="font-semibold block text-slate-200">
                Capture automated viewport screenshots on any step failure
              </span>
              <span className="text-slate-400 text-[11px] block">
                Preserves visual DOM evidence for root-cause diagnosis.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
