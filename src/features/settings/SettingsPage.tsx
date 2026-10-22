import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/data-service';
import { TuitionCenterSettings } from '../../types';
import { isFirebaseConfigured, getFirebaseConfig } from '../../lib/firebase-config';
import { LogoUploader } from '../../components/logo/LogoUploader';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Flame,
  Shield,
  Clock,
  CreditCard,
  Building,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<TuitionCenterSettings | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [centerName, setCenterName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [defaultGracePeriod, setDefaultGracePeriod] = useState<number>(10);
  const [receiptPrefix, setReceiptPrefix] = useState('ASTC-2026-');
  const [receiptNotes, setReceiptNotes] = useState('');

  const firebaseConfigured = isFirebaseConfigured();
  const fbConfig = getFirebaseConfig();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const s = await dataService.getSettings();
        if (!isMounted) return;
        setSettings(s);
        setCenterName(s.centerName);
        setTagline(s.tagline);
        setLogoUrl(s.logoUrl);
        setAddress(s.address);
        setPhoneNumber(s.phoneNumber);
        setEmail(s.email);
        setTimezone(s.timezone || 'Asia/Kolkata');
        setDefaultGracePeriod(s.defaultGracePeriodMinutes || 10);
        setReceiptPrefix(s.receiptPrefix || 'ASTC-2026-');
        setReceiptNotes(s.receiptNotes || '');
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);
    setSaveLoading(true);

    try {
      const updated = await dataService.updateSettings({
        centerName: centerName.trim(),
        tagline: tagline.trim(),
        logoUrl,
        address: address.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        timezone,
        defaultGracePeriodMinutes: defaultGracePeriod,
        receiptPrefix: receiptPrefix.trim(),
        receiptNotes: receiptNotes.trim(),
      });

      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings.';
      setErrorMessage(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading tuition center profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tuition Center Settings</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              Production Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Branding, official emblem upload, timezone formatting, and Firebase ledger connectivity.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings and tuition center branding saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Production Firebase Cloud Ledger Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-600" />
              Firebase Cloud Firestore & Authentication Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Production backend configuration status. All queries and transactions execute directly against Google Cloud Firestore.
            </p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              firebaseConfigured
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {firebaseConfigured ? '🟢 FIREBASE CONNECTED' : '🟡 SETUP REQUIRED'}
          </span>
        </div>

        {/* Firebase Config Status details */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Database Engine:</span>
            <span className="font-mono text-slate-900 font-bold">Google Cloud Firestore (Modular SDK v11)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Firebase Project ID:</span>
            <code className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {fbConfig.projectId || 'Not set in environment'}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Authentication Domain:</span>
            <code className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {fbConfig.authDomain || 'Not set in environment'}
            </code>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Logo Upload Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-orange-600" />
            Tuition Center Branding & Logo
          </h3>
          <LogoUploader
            currentLogoUrl={logoUrl}
            onLogoSelected={(dataUrl) => setLogoUrl(dataUrl)}
          />
        </div>

        {/* Profile Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Center Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tuition Center Name
              </label>
              <input
                type="text"
                required
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Subject Focus
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Center Address (Displayed on official receipts)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Center Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Operational & Receipt Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Operational & Receipt Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Timezone
              </label>
              <input
                type="text"
                disabled
                value={timezone}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                disabled
                value="INR (₹ Indian Rupee / Paise)"
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Grace Period (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={defaultGracePeriod}
                onChange={(e) => setDefaultGracePeriod(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Number Prefix
              </label>
              <input
                type="text"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Legal Disclaimer / Note
              </label>
              <input
                type="text"
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saveLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveLoading ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
