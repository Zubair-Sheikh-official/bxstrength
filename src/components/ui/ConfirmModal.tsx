import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, Lock, ShieldCheck, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  requireTextConfirm?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = 'danger',
  confirmText = 'CONFIRM ACTION',
  cancelText = 'CANCEL',
  requireTextConfirm = true,
  onConfirm,
  onCancel
}) => {
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = !requireTextConfirm || typedText.trim().toUpperCase() === 'CONFIRM';

  let icon = <AlertTriangle className="w-8 h-8 text-red-500" />;
  let accentBorder = 'border-red-500/60';
  let buttonBg = isConfirmed
    ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700';

  if (type === 'warning') {
    icon = <AlertTriangle className="w-8 h-8 text-amber-400" />;
    accentBorder = 'border-amber-500/60';
    buttonBg = isConfirmed
      ? 'bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black cursor-pointer shadow-lg shadow-[#CCFF00]/20'
      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700';
  } else if (type === 'success') {
    icon = <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
    accentBorder = 'border-emerald-500/60';
    buttonBg = isConfirmed
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg'
      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700';
  } else if (type === 'info') {
    icon = <Info className="w-8 h-8 text-blue-400" />;
    accentBorder = 'border-blue-500/60';
    buttonBg = isConfirmed
      ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg'
      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700';
  }

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmed) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className={`relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111114] text-white border-0 sm:border ${accentBorder} p-4 sm:p-6 lg:p-8 rounded-none sm:rounded-2xl shadow-2xl space-y-4 flex flex-col justify-center overflow-y-auto`}>
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex-shrink-0">
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-800/80 rounded-full inline-block mb-1">
              ADMIN DOUBLE CONFIRMATION
            </span>
            <h3 className="text-lg font-black uppercase text-white tracking-tight leading-snug">{title}</h3>
          </div>
        </div>

        <div className="bg-zinc-900/90 p-4 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed space-y-2">
          <p>{message}</p>
          <p className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>This administrative change will apply in real-time.</span>
          </p>
        </div>

        {requireTextConfirm && (
          <form onSubmit={handleConfirmSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-1 flex items-center justify-between">
                <span>Type <strong className="text-[#CCFF00]">CONFIRM</strong> to authorize:</span>
                {isConfirmed && (
                  <span className="text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                  </span>
                )}
              </label>
              <input
                type="text"
                autoFocus
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder='Type "CONFIRM"'
                className="w-full bg-[#18181b] border border-zinc-700 focus:border-[#CCFF00] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase tracking-widest outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold tracking-wider py-3 uppercase rounded-xl border border-zinc-700 transition-colors text-center cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                disabled={!isConfirmed}
                className={`w-full ${buttonBg} text-xs font-black tracking-widest py-3 uppercase rounded-xl transition-all shadow-md text-center`}
              >
                {confirmText}
              </button>
            </div>
          </form>
        )}

        {!requireTextConfirm && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onCancel}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold tracking-wider py-3 uppercase rounded-xl border border-zinc-700 transition-colors text-center cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`w-full ${buttonBg} text-xs font-black tracking-widest py-3 uppercase rounded-xl transition-all shadow-md text-center`}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
