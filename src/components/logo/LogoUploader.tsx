import React, { useState, useRef } from 'react';
import { Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateLogoFile } from '../../utils/validation';
import { CenterLogo } from './CenterLogo';

interface LogoUploaderProps {
  currentLogoUrl: string | null;
  onLogoSelected: (logoDataUrl: string | null) => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ currentLogoUrl, onLogoSelected }) => {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      onLogoSelected(result);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onLogoSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-white border border-slate-200 rounded-2xl">
        <div className="shrink-0 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
          <CenterLogo logoUrl={preview} size="lg" />
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <h4 className="text-sm font-semibold text-slate-900">Center Emblem & Logo</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload your tuition center's crest or logo. Formats supported: PNG, JPEG, WebP, SVG (Max 2MB).
            This logo will be displayed on receipts, portal headers, and attendance summaries.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              {preview ? 'Change Logo' : 'Upload Logo'}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset to Default
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
