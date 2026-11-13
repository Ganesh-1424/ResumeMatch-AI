import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/apiErrorHandler';
import GoogleSignInButton from '../components/GoogleSignInButton';

/**
 * Login page component connected to Express.js backend (POST /api/auth/login and POST /api/auth/google).
 * Authenticates user credentials, stores JWT token & user details in localStorage,
 * and redirects to the Dashboard upon success.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    loginWithGoogle,
    linkGoogle,
    requestForgotPassword,
    completeResetPassword
  } = useAuth();

  // If redirected from Signup with state
  const registeredEmail = location.state?.registeredEmail || '';
  const fromRegistration = location.state?.registrationSuccess || false;

  const [formData, setFormData] = useState({
    email: registeredEmail,
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Account collision linking state
  const [collisionData, setCollisionData] = useState(null); // { email, message }
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = request token, 2 = enter new password
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showNewResetPw, setShowNewResetPw] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const [successNotice, setSuccessNotice] = useState(
    fromRegistration
      ? {
          title: 'Registration Complete!',
          message: 'Your account was created successfully in MySQL. Please enter your password to log in.'
        }
      : null
  );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateField = (name, value) => {
    let error = '';
    const trimmedVal = (value || '').trim();

    if (name === 'email') {
      if (!trimmedVal) {
        error = 'Email address is required.';
      } else if (!emailRegex.test(trimmedVal)) {
        error = 'Please enter a valid email address (e.g., alex@example.com).';
      }
    }

    if (name === 'password') {
      if (!value) {
        error = 'Password is required.';
      }
    }

    return error;
  };

  const validateForm = () => {
    const newErrors = {};

    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateField('password', formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (apiError) setApiError(null);
    if (successNotice && !fromRegistration) setSuccessNotice(null);

    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));

    const fieldError = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      email: true,
      password: true
    });

    if (!validateForm()) {
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setApiError(null);

    try {
      // POST /api/auth/login with email and password
      const result = await login(formData.email.trim(), formData.password);

      if (result.success) {
        setSuccessNotice({
          title: 'Login Successful!',
          message: `Welcome back, ${result.user?.name || 'User'}! Redirecting to Home page...`
        });

        // Redirect to Home page
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      const parsed = parseApiError(error, 'Invalid email or password. Please try again.');
      setApiError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential, activeClientId = null) => {
    setIsGoogleLoading(true);
    setApiError(null);
    setCollisionData(null);
    setLinkError(null);

    try {
      const result = await loginWithGoogle(credential, activeClientId);
      if (result.success) {
        setSuccessNotice({
          title: 'Google Sign-In Successful!',
          message: `Welcome, ${result.user?.name || 'User'}! Redirecting to Home page...`
        });

        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      if (error.response?.data?.code === 'EMAIL_COLLISION_PASSWORD_EXISTS' || error.response?.status === 409) {
        const collisionEmail = error.response?.data?.email || formData.email || '';
        setPendingGoogleCredential(credential);
        setCollisionData({
          email: collisionEmail,
          message:
            error.response?.data?.message ||
            'An account with this email address already exists using password authentication. Enter your password below to link your Google account.'
        });
        setResetEmail(collisionEmail);
        if (collisionEmail) {
          setFormData((prev) => ({ ...prev, email: collisionEmail }));
        }
      } else {
        const parsed = parseApiError(error, 'Google sign-in failed. Please try again.');
        setApiError(parsed.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (err) => {
    setApiError(err?.message || 'Google authentication encountered an issue.');
  };

  // Handle linking Google account with existing password
  const handleLinkGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!linkPassword) {
      setLinkError('Please enter your account password to link accounts.');
      return;
    }

    setIsLinking(true);
    setLinkError(null);

    try {
      const email = collisionData?.email || formData.email;
      const result = await linkGoogle(email, linkPassword, pendingGoogleCredential);
      if (result.success) {
        setSuccessNotice({
          title: 'Accounts Linked Successfully!',
          message: `Google account linked. Welcome, ${result.user?.name || 'User'}! Redirecting to Home page...`
        });
        setCollisionData(null);
        setPendingGoogleCredential(null);
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      console.error('Link Google error:', err);
      const parsed = parseApiError(err, 'Failed to link Google account. Please verify your password.');
      setLinkError(parsed.message);
    } finally {
      setIsLinking(false);
    }
  };

  // Open password reset modal
  const handleOpenResetModal = () => {
    const defaultEmail = collisionData?.email || formData.email || '';
    setResetEmail(defaultEmail);
    setResetStep(1);
    setResetToken('');
    setNewResetPassword('');
    setConfirmResetPassword('');
    setResetError(null);
    setShowResetModal(true);
  };

  // Step 1: Request password reset authorization
  const handleRequestReset = async (e) => {
    e.preventDefault();
    const emailToReset = (resetEmail || formData.email || '').trim();
    if (!emailToReset) {
      setResetError('Please enter your email address.');
      return;
    }

    setIsResetting(true);
    setResetError(null);

    try {
      const res = await requestForgotPassword(emailToReset);
      if (res && res.resetToken) {
        setResetToken(res.resetToken);
        setResetStep(2);
      } else {
        setResetError('Unable to generate reset authorization. Please verify your email.');
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to process password reset request.');
      setResetError(parsed.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Step 2: Complete password reset with new password
  const handleCompleteReset = async (e) => {
    e.preventDefault();
    if (!newResetPassword || newResetPassword.length < 8) {
      setResetError('New password must be at least 8 characters long.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setResetError('Passwords do not match. Please verify.');
      return;
    }

    setIsResetting(true);
    setResetError(null);

    try {
      const res = await completeResetPassword(resetEmail, resetToken, newResetPassword);
      if (res && res.success) {
        setShowResetModal(false);
        setFormData((prev) => ({
          ...prev,
          email: resetEmail,
          password: newResetPassword
        }));
        setSuccessNotice({
          title: 'Password Reset Successful!',
          message: 'Your password has been securely updated. You can now log in or link your accounts.'
        });
        if (collisionData) {
          setLinkPassword(newResetPassword);
        }
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to reset password. The reset token may have expired.');
      setResetError(parsed.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white dark:bg-slate-900 p-7 sm:p-9 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-blue-100 dark:border-blue-900/60">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign In to Your Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Access your saved resume analysis reports and ATS score history
          </p>
        </div>

        {/* Success Notice Banner */}
        {successNotice && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-3 animate-fade-in"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold text-emerald-950 dark:text-white block">
                {successNotice.title}
              </strong>
              <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {successNotice.message}
              </p>
            </div>
          </div>
        )}

        {/* API Error Banner */}
        {apiError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3 animate-fade-in"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold text-rose-950 dark:text-white block">
                Sign In Failed
              </strong>
              <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
                {apiError}
              </p>
            </div>
          </div>
        )}

        {/* Account Collision Interactive Linking Card */}
        {collisionData && (
          <div
            role="alert"
            className="p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs space-y-3.5 animate-fade-in shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <strong className="font-bold text-amber-950 dark:text-white text-sm block">
                  Link Your Google Account
                </strong>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  An account for <strong>{collisionData.email}</strong> already exists using password authentication. Enter your password to verify ownership and securely link your Google account:
                </p>
              </div>
            </div>

            <form onSubmit={handleLinkGoogleSubmit} className="space-y-2.5 pt-1">
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showLinkPassword ? 'text' : 'password'}
                  placeholder="Enter your account password"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  disabled={isLinking}
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLinkPassword(!showLinkPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showLinkPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {linkError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{linkError}</span>
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isLinking || !linkPassword}
                  className="flex-1 py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isLinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Verify &amp; Link Google Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCollisionData(null);
                    setLinkPassword('');
                    setLinkError(null);
                  }}
                  className="py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-700 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="text-right pt-0.5">
                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="text-[11px] text-amber-800 dark:text-amber-300 hover:underline cursor-pointer font-medium"
                >
                  Forgot your password? Reset it here &rarr;
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Google Authentication */}
        <div className="space-y-4">
          <GoogleSignInButton
            label="Continue with Google"
            isLoading={isGoogleLoading}
            disabled={isLoading || isGoogleLoading}
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          <div className="relative flex items-center justify-center pt-1">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold whitespace-nowrap">
              or continue with email
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4.5">
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                placeholder="student@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800/80 transition focus:outline-none focus:bg-white dark:focus:bg-slate-800 ${
                  errors.email
                    ? 'border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            {errors.email && (
              <p
                id="login-email-error"
                role="alert"
                className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pt-0.5 font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Password <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleOpenResetModal}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                placeholder="Enter your account password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800/80 transition focus:outline-none focus:bg-white dark:focus:bg-slate-800 ${
                  errors.password
                    ? 'border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-0.5 rounded transition cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="login-password-error"
                role="alert"
                className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pt-0.5 font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Signup */}
        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>Don't have an account yet? </span>
          <Link
            to="/signup"
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Create an account</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Security / Technology Badge */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Secure JWT authentication • Express + MySQL</span>
          </p>
        </div>

      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <KeyRound className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Reset Account Password
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {resetStep === 1 ? 'Step 1 of 2: Identity Verification' : 'Step 2 of 2: Set New Password'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{resetError}</span>
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="kaganesh04@gmail.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 pt-0.5">
                    We will generate a secure reset authorization token for this account.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isResetting || !resetEmail}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    <span>Request Reset Authorization</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 text-xs">
                  Identity verified for <strong>{resetEmail}</strong>. Please enter your new password below.
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    New Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showNewResetPw ? 'text' : 'password'}
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewResetPw(!showNewResetPw)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewResetPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isResetting || !newResetPassword || !confirmResetPassword}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Update Password &amp; Continue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
