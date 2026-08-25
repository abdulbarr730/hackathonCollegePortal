'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Captcha({ onVerify, id = 'captcha-input' }) {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'valid' | 'invalid'
  const canvasRef = useRef(null);

  // Generate random 5-character alphanumeric string (excluding confusing characters)
  const generateCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const drawCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Background fill
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 + Math.random() * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Add noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(100, 116, 139, ${0.2 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters with rotation and distinct colors
    const colors = ['#4f46e5', '#4338ca', '#3730a3', '#1e1b4b', '#0f172a'];
    const charSpacing = width / (code.length + 1);

    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px monospace';

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const x = (i + 0.8) * charSpacing;
      const y = height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 2;
      ctx.fillText(char, -8, 2);
      ctx.restore();
    }
  };

  const refreshCaptcha = () => {
    const newCode = generateCode();
    setCaptchaCode(newCode);
    setUserInput('');
    setStatus('idle');
    if (onVerify) onVerify(false);
    setTimeout(() => drawCaptcha(newCode), 50);
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUserInput(val);

    if (val.length === captchaCode.length) {
      if (val === captchaCode) {
        setStatus('valid');
        if (onVerify) onVerify(true);
      } else {
        setStatus('invalid');
        if (onVerify) onVerify(false);
      }
    } else {
      setStatus('idle');
      if (onVerify) onVerify(false);
    }
  };

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
          Security Verification
        </label>
        <span className="text-[10px] text-slate-400 font-medium">Case sensitive</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Canvas Security Box */}
        <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 overflow-hidden shadow-inner flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={140}
            height={44}
            className="block"
            title="CAPTCHA security image"
          />
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={refreshCaptcha}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
          title="Regenerate verification code"
          aria-label="Refresh security code"
        >
          <RefreshCw size={16} />
        </button>

        {/* User Input */}
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            required
            maxLength={6}
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type code"
            autoComplete="off"
            spellCheck="false"
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono tracking-wider text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/50 border outline-none transition-all ${
              status === 'valid'
                ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                : status === 'invalid'
                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {status === 'valid' && (
              <CheckCircle2 size={16} className="text-emerald-500 animate-in zoom-in" />
            )}
            {status === 'invalid' && (
              <AlertCircle size={16} className="text-rose-500 animate-in zoom-in" />
            )}
          </div>
        </div>
      </div>
      {status === 'invalid' && (
        <p className="text-[11px] font-medium text-rose-500 animate-in fade-in">
          Security code does not match. Please re-enter or click refresh.
        </p>
      )}
    </div>
  );
}
