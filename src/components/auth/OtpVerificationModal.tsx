import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { X, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, ArrowRight, Clock, KeyRound } from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSuccessNavigate?: (role: UserRole) => void;
  onOpenLogin?: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  email,
  onClose,
  onSuccessNavigate,
  onOpenLogin
}) => {
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Expiry Timer (10 Minutes = 600 Seconds)
  const [expirySeconds, setExpirySeconds] = useState<number>(600);
  
  // Resend Cooldown Timer (60 Seconds)
  const [resendCooldown, setResendCooldown] = useState<number>(60);

  // Attempts Remaining
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(5);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Expiry Timer interval
  useEffect(() => {
    if (!isOpen) return;
    setExpirySeconds(600);
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);
    setError(null);
    setSuccessMsg(null);
    setAttemptsRemaining(5);

    setTimeout(() => {
      inputRefs[0].current?.focus();
    }, 150);
  }, [isOpen, email]);

  useEffect(() => {
    if (!isOpen || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, expirySeconds]);

  // Resend Cooldown Timer interval
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, value: string) => {
    // Only accept numeric digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto submit if all 6 digits filled
    if (digit && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError(null);
      inputRefs[5].current?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const fullOtp = codeToVerify || otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('This verification code has expired. Please click "Resend Code".');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const verifiedUser = await verifyOtp(email, fullOtp);
      setSuccessMsg('Account successfully verified! Activating portal access...');

      setTimeout(() => {
        onClose();
        if (onSuccessNavigate) {
          onSuccessNavigate(verifiedUser.role);
        }
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please try again.');
      if (err.remainingAttempts !== undefined) {
        setAttemptsRemaining(err.remainingAttempts);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    try {
      setResendLoading(true);
      setError(null);
      setSuccessMsg(null);

      const result = await resendOtp(email);
      setSuccessMsg(result.message || 'A new 6-digit OTP code has been sent to your email.');

      // Reset timers and attempts
      setExpirySeconds(600);
      setResendCooldown(60);
      setAttemptsRemaining(5);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
      if (err.retryAfterSeconds) {
        setResendCooldown(err.retryAfterSeconds);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md bg-[#121214] text-white border-0 sm:border border-zinc-800 shadow-2xl rounded-none sm:rounded-2xl overflow-hidden font-sans flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer z-10 min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7 space-y-4 overflow-y-auto overscroll-contain">
          
          {/* Header Badge & Title */}
          <div className="text-center space-y-2 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] flex items-center justify-center mx-auto shadow-inner mb-2">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
              EMAIL VERIFICATION
            </h2>

            <p className="text-xs text-zinc-300 leading-relaxed px-2">
              We have dispatched a secure 6-digit verification code to:
            </p>
            <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs font-bold text-[#CCFF00] break-all">
              {email}
            </div>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/90 border border-red-800 text-red-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 6-Digit OTP Inputs */}
          <div className="py-2 space-y-3">
            <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-400 text-center">
              ENTER 6-DIGIT VERIFICATION CODE
            </label>

            <div className="flex justify-center items-center gap-2 sm:gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-10 h-12 sm:w-12 sm:h-14 bg-[#18181b] border ${
                    digit ? 'border-[#CCFF00] text-[#CCFF00]' : 'border-zinc-800 text-white'
                  } focus:border-[#CCFF00] focus:ring-2 focus:ring-[#CCFF00]/20 text-center font-mono font-black text-xl sm:text-2xl rounded-xl outline-none transition-all shadow-inner`}
                />
              ))}
            </div>

            {/* Expiry & Attempt Indicators */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 px-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Code Expires: </span>
                <span className={expirySeconds <= 60 ? 'text-red-400 font-mono font-black' : 'text-zinc-200 font-mono font-bold'}>
                  {formatTime(expirySeconds)}
                </span>
              </div>

              {attemptsRemaining !== null && (
                <div className="flex items-center gap-1 font-semibold text-zinc-400">
                  <span>Attempts Left: </span>
                  <span className={`font-bold ${attemptsRemaining <= 2 ? 'text-amber-400' : 'text-zinc-200'}`}>
                    {attemptsRemaining}/5
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={loading || otp.some((d) => d === '') || expirySeconds <= 0}
            className="w-full min-h-[48px] bg-[#CCFF00] hover:bg-[#b3e600] disabled:bg-zinc-800 disabled:text-zinc-500 text-black text-xs font-black tracking-widest py-3.5 uppercase transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
          >
            {loading ? (
              <span>VERIFYING CODE...</span>
            ) : (
              <>
                <span>VERIFY & ACTIVATE PORTAL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend OTP Section */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col items-center justify-center space-y-2 text-center">
            <p className="text-xs text-zinc-400">
              Didn't receive the verification email?
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-[#CCFF00] disabled:text-zinc-500 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin text-[#CCFF00]' : ''}`} />
              <span>
                {resendLoading
                  ? 'Sending new code...'
                  : resendCooldown > 0
                  ? `Resend Code in ${resendCooldown}s`
                  : 'Resend Verification Code'}
              </span>
            </button>
          </div>

          {/* Back to Login option */}
          {onOpenLogin && (
            <div className="text-center text-xs text-zinc-500 pt-1">
              Need to use a different email?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="font-bold text-zinc-300 hover:text-white underline cursor-pointer"
              >
                Sign In or Change Email
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
