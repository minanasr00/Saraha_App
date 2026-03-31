import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClipLoader } from 'react-spinners';
import { z } from 'zod';
import { toast } from 'react-toastify';

const emailSchema = z.object({ email: z.string().email('Invalid email address') });
const otpSchema = z.object({ otp: z.string().length(6, 'OTP must be 6 digits') });
const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
});

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const { requestForgotPassword, verifyForgotPassword, resetForgotPassword, login } = useAuth();
  const otpInputRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setOtpAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTime]);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 2 && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    try {
      emailSchema.parse({ email });
      setLoading(true);
      await requestForgotPassword(email);
      setMessage('OTP sent to your email. Please check your inbox.');
      setStep(2);
      setResendCooldown(60); // 60 seconds cooldown
      toast.success('OTP sent successfully! Check your email.');
    } catch (err) {
      console.error('request forgot password error:', err);
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0].message });
      } else {
        const errorMsg = err.response?.data?.message || 'Could not send OTP';
        setErrors({ general: errorMsg });
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    setOtp(newDigits.join(''));

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-focus previous input on backspace
    if (!value && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    if (isLocked) {
      toast.error('Too many failed attempts. Please wait.');
      return;
    }

    try {
      otpSchema.parse({ otp });
      setLoading(true);
      await verifyForgotPassword(email, otp);
      setMessage('OTP verified. Now set your new password.');
      setStep(3);
      toast.success('OTP verified successfully!');
    } catch (err) {
      console.error('verify forgot password error:', err);
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);

      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockoutTime(300); // 5 minutes lockout
        toast.error('Too many failed attempts. Locked for 5 minutes.');
      }

      if (err instanceof z.ZodError) {
        setErrors({ otp: err.errors[0].message });
      } else {
        const errorMsg = err.response?.data?.message || 'Could not verify OTP';
        setErrors({ general: errorMsg });
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    try {
      resetSchema.parse({ password, confirmPassword });
      setLoading(true);
      const response = await resetForgotPassword(email, otp, password, confirmPassword);

      // Auto-login with new credentials
      try {
        await login(email, password);
        setMessage('Password reset and login successful! Redirecting to dashboard...');
        toast.success('Password reset successful! Welcome back!');
        setTimeout(() => navigate('/dashboard'), 1600);
      } catch (loginErr) {
        console.error('Auto-login failed:', loginErr);
        setMessage('Password reset successful. Redirecting to login...');
        toast.success('Password reset successful! Please sign in.');
        setTimeout(() => navigate('/login'), 1600);
      }
    } catch (err) {
      console.error('reset password error:', err);
      if (err instanceof z.ZodError) {
        const fieldErrors = {};
        err.errors.forEach((error) => {
          if (error.path[0]) fieldErrors[error.path[0]] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        const errorMsg = err.response?.data?.message || 'Could not reset password';
        setErrors({ general: errorMsg });
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setErrors({});
    setMessage('');

    try {
      setLoading(true);
      await requestForgotPassword(email);
      setMessage('New OTP sent to your email.');
      setResendCooldown(60);
      toast.success('New OTP sent! Check your email.');
    } catch (err) {
      console.error('resend OTP error:', err);
      const errorMsg = err.response?.data?.message || 'Could not resend OTP';
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-blue-600 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 opacity-10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 opacity-5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          <h1 className="text-3xl text-white font-extrabold mb-4 text-center">Reset Password</h1>
          <p className="text-white/80 mb-6 text-center">Follow the steps to regain access to your account.</p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((stepNumber) => (
              <span
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= stepNumber ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg' : 'bg-white/20 text-white/50'
                }`}
              >
                {stepNumber}
              </span>
            ))}
          </div>

          {message && (
            <div className="bg-green-500/20 border border-green-300/40 text-green-100 rounded-xl p-3 mb-4 flex items-center justify-between">
              <span>{message}</span>
              <button
                onClick={() => setMessage('')}
                className="text-green-300 hover:text-green-100 ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-500/20 border border-red-300/40 text-red-100 rounded-xl p-3 mb-4 flex items-center justify-between">
              <span>{errors.general}</span>
              <button
                onClick={() => setErrors({ ...errors, general: '' })}
                className="text-red-300 hover:text-red-100 ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {isLocked && (
            <div className="bg-red-500/20 border border-red-300/40 text-red-100 rounded-xl p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Account locked due to too many failed attempts. Try again in {formatTime(lockoutTime)}</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-white font-semibold mb-2 block flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/25 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                  required
                />
                {errors.email && <p className="text-red-300 text-sm mt-2">{errors.email}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-2xl font-semibold transition-all flex justify-center items-center transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? <ClipLoader color="#fff" size={20} /> : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-white font-semibold mb-4 block text-center flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Enter Verification Code
                </label>

                <div className="flex justify-center gap-2 mb-4">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-2xl font-bold rounded-xl bg-white/20 text-white border border-white/25 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all"
                      maxLength={1}
                      disabled={isLocked}
                    />
                  ))}
                </div>

                {errors.otp && <p className="text-red-300 text-sm mt-2 text-center">{errors.otp}</p>}

                <div className="text-center text-white/60 text-sm mb-4">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-white hover:text-blue-300 font-semibold underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>

                {otpAttempts > 0 && !isLocked && (
                  <div className="text-center text-yellow-300 text-sm mb-4">
                    Attempts remaining: {5 - otpAttempts}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-2xl font-semibold transition-all flex justify-center items-center transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading || isLocked || otp.length !== 6}
              >
                {loading ? <ClipLoader color="#fff" size={20} /> : 'Verify OTP'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-white font-semibold mb-2 block flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/25 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                  required
                />
                {errors.password && <p className="text-red-300 text-sm mt-2">{errors.password}</p>}
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/25 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                  required
                />
                {errors.confirmPassword && <p className="text-red-300 text-sm mt-2">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-2xl font-semibold transition-all flex justify-center items-center transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? <ClipLoader color="#fff" size={20} /> : 'Reset Password & Sign In'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-white/80">
            <span>Go back to</span>{' '}
            <Link to="/login" className="text-white font-semibold underline hover:text-white/80 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
