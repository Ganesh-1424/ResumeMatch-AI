import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Official Google 4-color SVG logo
 */
export function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * GoogleSignInButton Component
 * 
 * Embeds official Google Identity Services (GIS) for real Google authentication.
 * Directly renders Google's official Sign In with Google button.
 * Clicking it opens Google's native account selection popup without any in-app setup dialogs.
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
  isLoading = false,
  label = 'Continue with Google',
  disabled = false
}) {
  const [gisLoaded, setGisLoaded] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);
  const googleBtnContainerRef = useRef(null);

  // Active Google Client ID from environment variables
  const envClientId = typeof import.meta.env.VITE_GOOGLE_CLIENT_ID === 'string'
    ? import.meta.env.VITE_GOOGLE_CLIENT_ID.trim()
    : '';

  const activeClientId = envClientId || 'your_google_client_id_here.apps.googleusercontent.com';

  // Ensure Google Identity Services script is loaded
  useEffect(() => {
    const checkGsi = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        setGisLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGsi()) return;

    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => setGisLoaded(true));

    const interval = setInterval(() => {
      if (checkGsi()) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Initialize GIS and render official Google button directly
  const renderGoogleButton = useCallback(() => {
    if (!gisLoaded || !window.google?.accounts?.id || !googleBtnContainerRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: activeClientId,
        callback: (response) => {
          if (response?.credential) {
            onSuccess(response.credential, activeClientId);
          } else {
            if (onError) onError(new Error('No Google credential returned from Google Identity Services.'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      googleBtnContainerRef.current.innerHTML = '';
      const isDark = document.documentElement.classList.contains('dark');
      const containerWidth = Math.min(400, Math.max(260, googleBtnContainerRef.current.offsetWidth || 380));

      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: containerWidth,
      });

      setButtonRendered(true);

      // Prompt One Tap / Account chooser if eligible
      try {
        window.google.accounts.id.prompt();
      } catch (_) {}

    } catch (err) {
      console.warn('[GoogleSignInButton] GIS initialization notice:', err);
    }
  }, [gisLoaded, activeClientId, onSuccess, onError]);

  useEffect(() => {
    renderGoogleButton();
  }, [renderGoogleButton]);

  const handleCustomButtonClick = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (_) {}
    }
  };

  return (
    <div className="w-full">
      {/* Official Google GIS Button Container */}
      <div className="flex justify-center w-full min-h-[44px]">
        <div
          ref={googleBtnContainerRef}
          className={`w-full flex justify-center ${!buttonRendered ? 'hidden' : ''}`}
        />

        {/* Fallback branded button while Google GIS iframe is loading */}
        {!buttonRendered && (
          <button
            type="button"
            onClick={handleCustomButtonClick}
            disabled={disabled || isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 transition shadow-xs active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="w-4.5 h-4.5" />
                <span>{label}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
