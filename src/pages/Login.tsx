import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles,
  Plane,
  Headphones,
  Check,
  PhoneCall,
  Globe2,
  MessageSquare
} from 'lucide-react';
import { client } from '../lib/api';
import logo from '../assets/logo.png';
import loginHero from '../assets/login-hero.png';

export default function Login() {
  const { isAuthenticated, login, loginRequest, loginVerifyOtp } = useAuthStore();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpTimer, setLoginOtpTimer] = useState(0);
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);

  // Forgot Password modal states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1); // 1: email, 2: otp, 3: new password
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  // Load remembered email on mount
  useEffect(() => {
    const remembered = localStorage.getItem('gsf_remembered_email');
    if (remembered) {
      setEmail(remembered);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendTimer]);

  // Login 2FA OTP countdown timer
  useEffect(() => {
    if (loginOtpTimer > 0) {
      const timer = setTimeout(() => setLoginOtpTimer(loginOtpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [loginOtpTimer]);

  // Handle Step 1: Validate credentials & trigger Brevo OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setOtpSentMsg('');

    try {
      const result = await loginRequest(email.trim(), password);
      if (result.success) {
        if (result.requiresOtp) {
          setLoginStep('otp');
          setLoginOtp('');
          setLoginOtpTimer(60);
          setOtpSentMsg(result.message || `A 6-digit verification code has been sent to ${email.trim()}`);
          if (result.fallbackOtp) {
            setFallbackOtp(result.fallbackOtp);
          }
        } else {
          // Direct login (OTP disabled by Admin)
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err: any) {
      console.error('Login request error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify Brevo OTP & Complete Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp.trim() || loginOtp.trim().length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginVerifyOtp(email.trim(), loginOtp.trim());
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('gsf_remembered_email', email.trim());
        } else {
          localStorage.removeItem('gsf_remembered_email');
        }
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.message || 'Invalid verification code. Please check your email and try again.');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Login OTP
  const handleResendLoginOtp = async () => {
    if (loginOtpTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      const result = await loginRequest(email.trim(), password);
      if (result.success) {
        setLoginOtpTimer(60);
        setOtpSentMsg(result.message || 'A new verification code has been sent to your email.');
        if (result.fallbackOtp) {
          setFallbackOtp(result.fallbackOtp);
        }
      } else {
        setError(result.message || 'Failed to resend verification code.');
      }
    } catch {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password flow
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');

    try {
      if (resetStep === 1) {
        if (!forgotEmail.trim()) {
          setForgotError('Please enter your email address.');
          setForgotLoading(false);
          return;
        }

        const res = await client.api.fetch('/api/public/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
        });
        const data = await res.json() as any;

        if (res.ok && data.success) {
          const otp = String(Math.floor(100000 + Math.random() * 900000));
          await client.api.fetch('/api/public/store-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp })
          });

          await client.api.fetch('/api/public/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: forgotEmail.trim().toLowerCase(),
              subject: '🔐 Password Reset OTP — Get Set Flight CRM',
              html: `
                <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06)">
                  <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:30px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">🔐 Password Reset</h1>
                    <p style="color:#ddd6fe;margin:6px 0 0;font-size:13px">Get Set Flight — Secure Verification</p>
                  </div>
                  <div style="padding:28px 32px;background:#fff">
                    <p style="color:#374151;font-size:14px;margin:0 0 16px">Hello,</p>
                    <p style="color:#374151;font-size:14px;margin:0 0 20px">You have requested to reset your CRM password. Use the verification code below to proceed:</p>
                    <div style="background:#f5f3ff;border:2px dashed #8b5cf6;border-radius:12px;padding:22px;text-align:center;margin:0 0 20px">
                      <p style="color:#6d28d9;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;font-weight:700">Your Verification Code</p>
                      <p style="color:#4c1d95;font-size:36px;font-weight:800;margin:0;letter-spacing:8px;font-family:monospace">${otp}</p>
                      <p style="color:#8b5cf6;font-size:11px;margin:8px 0 0">Valid for 10 minutes</p>
                    </div>
                    <p style="color:#6b7280;font-size:12px;margin:0">If you did not request this, please ignore this email or notify IT administration.</p>
                  </div>
                </div>
              `
            })
          });

          setResetStep(2);
          setOtpResendTimer(60);
        } else {
          setForgotError(data.message || 'This email is not registered in our CRM.');
        }
      } else if (resetStep === 2) {
        if (!otpCode.trim() || otpCode.length !== 6) {
          setForgotError('Please enter the 6-digit verification code.');
          setForgotLoading(false);
          return;
        }

        const res = await client.api.fetch('/api/public/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp: otpCode.trim() })
        });
        const data = await res.json() as any;

        if (res.ok && data.success) {
          setResetStep(3);
        } else {
          setForgotError(data.message || 'Invalid or expired code. Please try again.');
        }
      } else if (resetStep === 3) {
        if (!newPassword.trim() || newPassword.length < 6) {
          setForgotError('Password must be at least 6 characters.');
          setForgotLoading(false);
          return;
        }

        const res = await client.api.fetch('/api/public/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), newPassword: newPassword.trim() })
        });
        const data = await res.json() as any;

        if (res.ok && data.success) {
          setForgotSent(true);
        } else {
          setForgotError(data.message || 'Failed to update password.');
        }
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setForgotError('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendTimer > 0) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      await client.api.fetch('/api/public/store-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp })
      });
      await client.api.fetch('/api/public/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: forgotEmail.trim().toLowerCase(),
          subject: '🔐 Password Reset OTP (Resend) — Get Set Flight CRM',
          html: `<p>Your new verification code is: <strong>${otp}</strong> (valid for 10 minutes)</p>`
        })
      });
      setOtpResendTimer(60);
      setOtpCode('');
    } catch {
      setForgotError('Failed to resend code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 font-sans selection:bg-purple-100 selection:text-purple-900">
      
      {/* Outer Card Container with Subtle Rainbow Ambient Glow */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100/80 flex flex-col lg:flex-row transition-all duration-300">
        
        {/* Rainbow Shimmer Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 rainbow-glow z-30" />

        {/* ================= LEFT COLUMN: LOGIN FORM ================= */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 md:p-14 flex flex-col justify-between bg-white relative z-20">
          
          {/* Top Brand Logo */}
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center gap-4 mb-8">
              <img 
                src="https://getsetflight.com/get_set_flight_logo.png" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = logo; }}
                alt="Get Set Flight Logo" 
                className="h-14 w-auto max-w-[200px] object-contain drop-shadow-sm" 
              />
              <div className="border-l-2 border-purple-200 pl-3.5 flex flex-col justify-center">
                <span className="text-base font-black tracking-tight text-gray-900 flex items-center gap-2">
                  Get Set Flight
                  <span className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                    CRM
                  </span>
                </span>
                <span className="text-[11px] text-gray-400 font-semibold tracking-wide">
                  Official Portal
                </span>
              </div>
            </div>

            {/* Header Titles */}
            <div className="mb-7">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Welcome back
              </h1>
              <p className="text-gray-500 text-sm sm:text-base mt-1.5">
                Please enter your details
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200/60 text-red-700 text-sm flex items-start gap-3 animate-shake">
                <span className="text-base">⚠️</span>
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* Form */}
            {loginStep === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all duration-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                  />
                  <span className="text-sm text-gray-600 font-medium">Remember for 30 days</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotSent(false);
                    setForgotEmail(email);
                    setForgotError('');
                    setResetStep(1);
                    setOtpCode('');
                    setNewPassword('');
                  }}
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                >
                  Forgot password
                </button>
              </div>

              {/* Sign In Button with Light Rainbow Border / Shimmer on Hover */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative group w-full py-3.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-purple-700/25 transition-all duration-200 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 via-amber-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />

                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Validating & Sending OTP...
                    </span>
                  ) : (
                    'Sign in with OTP'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: 6-Digit OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
              {fallbackOtp && (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs shadow-sm">
                  <div className="font-bold flex items-center justify-between text-amber-900 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      Brevo IP Security Notice
                    </span>
                    <button
                      type="button"
                      onClick={() => setLoginOtp(fallbackOtp)}
                      className="px-2.5 py-1 rounded-md bg-purple-700 text-white font-semibold text-[11px] hover:bg-purple-800 transition-colors shadow-xs"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                  <div className="text-gray-700 mt-1">
                    Your Brevo account has <strong>Authorised IPs</strong> enabled which blocked email delivery to your inbox.
                  </div>
                  <div className="mt-2 p-2 bg-white/90 rounded-xl border border-amber-200 flex items-center justify-between">
                    <span className="text-gray-500 text-[11px]">Your Verification Code:</span>
                    <span className="font-mono font-extrabold text-xl text-purple-700 tracking-widest">{fallbackOtp}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-amber-800">
                    To receive emails directly in your inbox, disable "Authorised IPs" at <a href="https://app.brevo.com/security/authorised_ips" target="_blank" rel="noreferrer" className="underline font-bold text-purple-700">Brevo Security Settings</a>.
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-4 rounded-xl border-2 border-purple-200 bg-white text-gray-900 text-center text-3xl font-mono font-bold tracking-[0.4em] placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-purple-600/20 focus:border-purple-600 transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('credentials');
                      setError('');
                      setOtpSentMsg('');
                      setFallbackOtp(null);
                    }}
                    className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft size={13} /> Change email / password
                  </button>
                  {loginOtpTimer > 0 ? (
                    <span className="text-gray-400">Resend in <strong className="text-purple-700">{loginOtpTimer}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendLoginOtp}
                      disabled={loading}
                      className="text-purple-600 hover:text-purple-800 font-bold hover:underline"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>
              </div>

              {/* Verify & Enter CRM Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || loginOtp.length < 6}
                  className="relative group w-full py-3.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-purple-700/25 transition-all duration-200 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying Code...
                    </span>
                  ) : (
                    'Verify & Enter CRM'
                  )}
                </button>
              </div>
            </form>
          )}
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-8 mt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Don't have an account? <span className="text-purple-600 font-semibold cursor-pointer hover:underline" onClick={() => setError('Please contact IT administration to request a new CRM agent account.')}>Contact Admin</span></span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck size={14} /> 256-Bit SSL Secured
            </span>
          </div>

        </div>


        {/* ================= RIGHT COLUMN: INTERACTIVE AGENT HERO SHOWCASE ================= */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#7e57c2] via-[#673ab7] to-[#4527a0] p-6 sm:p-10 md:p-12 flex flex-col justify-between items-center relative overflow-hidden select-none min-h-[580px]">
          
          {/* Animated Ambient Aura & Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink-500/25 blur-3xl animate-aura-pulse pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl animate-aura-pulse pointer-events-none" style={{ animationDelay: '2.5s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />

          {/* Top Header Badge */}
          <div className="w-full flex items-center justify-between relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              Get Set Flight · Live Agent Desk
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 text-xs font-medium tracking-wide">
              <Sparkles size={12} className="text-amber-300" />
              24/7 Ticketing
            </div>
          </div>

          {/* Center Image Container with Smooth Animation & Interactive Floating Pills */}
          <div className="relative my-auto py-4 flex items-center justify-center w-full max-w-md">
            
            {/* Glowing Backdrop Circle behind Hero Image */}
            <div className="absolute w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-gradient-to-tr from-purple-400/25 to-pink-400/20 blur-2xl pointer-events-none" />

            {/* Main Hero Image */}
            <div className="relative z-10 animate-hero-float flex items-center justify-center">
              <img
                src={loginHero}
                alt="Get Set Flight Support Specialist"
                loading="eager"
                decoding="async"
                className="w-full max-w-[340px] sm:max-w-[420px] h-auto object-contain drop-shadow-[0_24px_45px_rgba(0,0,0,0.38)] transition-transform duration-300 hover:scale-[1.02]"
              />

              {/* Floating Live Status Pill: Top Left */}
              <div className="absolute -top-2 -left-2 sm:left-0 bg-white/95 backdrop-blur-md rounded-2xl py-2 px-3.5 shadow-xl border border-purple-200/60 flex items-center gap-2.5 animate-badge-1 cursor-default hover:scale-105 transition-transform">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-gray-900 tracking-tight">Active Online</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Instant Sync</span>
              </div>

              {/* Floating Live Call / Ticket Pill: Bottom Right */}
              <div className="absolute -bottom-2 -right-2 sm:right-0 bg-slate-900/90 backdrop-blur-md rounded-2xl py-2.5 px-4 shadow-2xl border border-white/15 flex items-center gap-3 animate-badge-2 cursor-default hover:scale-105 transition-transform text-white">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm shadow-md">
                  ✈️
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    GSF Travel Desk
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-gray-300 font-medium">99.98% SLA Speed</div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Card Footer Banner */}
          <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl py-3.5 px-4 border border-white/20 text-white text-center shadow-lg relative z-10">
            <p className="text-sm font-semibold tracking-wide flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              High-Velocity Bookings · Seamless Ticketing
            </p>
            <p className="text-xs text-white/80 mt-0.5 font-normal">
              Empowering flight agents and supervisors with unified live workflows.
            </p>
          </div>

        </div>

      </div>


      {/* ================= FORGOT PASSWORD POPUP MODAL ================= */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 animate-scale-up">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                {resetStep === 2 ? <ShieldCheck size={28} /> : resetStep === 3 ? <Lock size={28} /> : <Mail size={28} />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {resetStep === 1 ? 'Reset Password' : resetStep === 2 ? 'Verify Code' : 'New Password'}
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1.5">
                {resetStep === 1 ? 'Enter your registered email to receive a 6-digit OTP' :
                 resetStep === 2 ? `Enter the 6-digit verification code sent to ${forgotEmail}` :
                 'Enter your new secure password'}
              </p>
            </div>

            {/* Error Message */}
            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200/60 text-center">
                {forgotError}
              </div>
            )}

            {/* Success Finished */}
            {forgotSent ? (
              <div className="text-center space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-sm">
                  <p className="font-bold">✅ Password Updated Successfully!</p>
                  <p className="text-xs text-emerald-700 mt-1">You can now sign in with your updated password.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotSent(false);
                    setResetStep(1);
                  }}
                  className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm transition-all shadow-md"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                
                {/* Step 1: Email */}
                {resetStep === 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registered Email</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. info@getsetflight.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    />
                  </div>
                )}

                {/* Step 2: OTP */}
                {resetStep === 2 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">6-Digit Verification Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl font-mono font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    />
                    <div className="text-center mt-3">
                      {otpResendTimer > 0 ? (
                        <p className="text-xs text-gray-400">Resend code in <strong>{otpResendTimer}s</strong></p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-xs text-purple-600 hover:underline font-semibold"
                        >
                          Didn't receive the code? Resend
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: New Password */}
                {resetStep === 3 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter minimum 6 characters"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step Dots */}
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        resetStep === step ? 'w-6 bg-purple-600' : 'w-2 bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {forgotLoading ? 'Processing...' : (
                    resetStep === 1 ? 'Send Verification Code' :
                    resetStep === 2 ? 'Verify Code' :
                    'Update Password'
                  )}
                </button>

                {/* Cancel / Close */}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setResetStep(1);
                    setForgotError('');
                  }}
                  className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
