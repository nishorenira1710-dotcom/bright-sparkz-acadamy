import React from 'react';
import { getFirebaseConfig, getMissingFirebaseFields } from '../../lib/firebase-config';
import { CenterLogo } from '../logo/CenterLogo';
import { Flame, AlertTriangle, KeyRound, Copy, Check, Terminal } from 'lucide-react';

export const FirebaseSetupRequired: React.FC = () => {
  const missing = getMissingFirebaseFields();
  const config = getFirebaseConfig();
  const [copied, setCopied] = React.useState(false);

  const envTemplate = `# Firebase Web Configuration for Bright Sparkz Academy
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="bright-sparkz-academy.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="bright-sparkz-academy"
VITE_FIREBASE_STORAGE_BUCKET="bright-sparkz-academy.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef"`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      <div className="max-w-xl w-full bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <CenterLogo size="lg" />
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Bright Sparkz Academy</h1>
            <p className="text-xs text-orange-400 font-semibold mt-0.5">Learn Smarter, Shine Brighter</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Firebase Configuration Required</span>
          </div>
          <h2 className="text-lg font-bold text-white">Cloud Firestore & Authentication Not Configured</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            This production system is strictly backed by Google Cloud Firestore and Firebase Authentication.
            No mock database or insecure demo fallback is active.
          </p>
        </div>

        {/* Missing fields alert */}
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-300">
            <KeyRound className="w-4 h-4 text-red-400" />
            <span>Missing Environment Variables:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-red-200">
            {missing.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </div>

        {/* Step-by-step Setup instructions */}
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Quick Setup Checklist:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
            <li>
              Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-orange-400 underline font-semibold">Firebase Console</a> and create a project (e.g., <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">bright-sparkz-academy</code>).
            </li>
            <li>
              In <strong>Authentication</strong> &gt; <strong>Sign-in method</strong>, enable <strong>Email/Password</strong>.
            </li>
            <li>
              In <strong>Firestore Database</strong>, create a database in production mode.
            </li>
            <li>
              Under Project Settings &gt; General &gt; Your apps, register a Web App and copy your credentials into a <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">.env</code> file.
            </li>
          </ol>
        </div>

        {/* .env snippet with copy button */}
        <div className="relative bg-slate-950 rounded-2xl border border-white/5 p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> .env template
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Template'}
            </button>
          </div>
          <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre">
            {envTemplate}
          </pre>
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Once your <code className="text-slate-300 font-mono">.env</code> is populated, restart the server or refresh this page.
        </div>
      </div>
    </div>
  );
};
