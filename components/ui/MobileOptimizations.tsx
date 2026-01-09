'use client';

import { useEffect } from 'react';
import { useResponsive, useTouchDevice, useOrientation } from '@/hooks/useResponsive';

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

/**
 * Mobile Optimizations Component
 * Applies mobile-specific optimizations and enhancements
 */
export function MobileOptimizations({ children }: MobileOptimizationsProps) {
  const { isMobile } = useResponsive();
  const isTouchDevice = useTouchDevice();
  const orientation = useOrientation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Disable zoom on input focus for iOS
    if (isMobile && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }

    // Add touch device class for CSS
    if (isTouchDevice) {
      document.body.classList.add('touch-device');
    } else {
      document.body.classList.add('no-touch');
    }

    // Add mobile class for CSS
    if (isMobile) {
      document.body.classList.add('mobile-device');
    } else {
      document.body.classList.remove('mobile-device');
    }

    // Add orientation class
    if (orientation) {
      document.body.classList.remove('portrait', 'landscape');
      document.body.classList.add(orientation);
    }

    // Cleanup
    return () => {
      document.body.classList.remove('touch-device', 'no-touch', 'mobile-device', 'portrait', 'landscape');
    };
  }, [isMobile, isTouchDevice, orientation]);

  useEffect(() => {
    if (!isMobile) return;

    // Prevent pull-to-refresh on mobile
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const isScrollingUp = currentY > startY;
      const isAtTop = window.scrollY <= 0;

      if (isAtTop && isScrollingUp) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Prevent overscroll behavior
    document.body.style.overscrollBehavior = 'contain';

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.body.style.overscrollBehavior = '';
    };
  }, [isMobile]);

  return <>{children}</>;
}

/**
 * Mobile-aware Loading Component
 */
export function MobileLoader({ message = 'Chargement...' }: { message?: string }) {
  const { isMobile } = useResponsive();

  return (
    <div className={`flex items-center justify-center ${isMobile ? 'p-8' : 'p-12'}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto ${
          isMobile ? 'h-8 w-8' : 'h-12 w-12'
        }`}></div>
        <p className={`mt-4 text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}

/**
 * Mobile-aware Error Component
 */
export function MobileError({ 
  title = 'Erreur', 
  message, 
  onRetry 
}: { 
  title?: string; 
  message: string; 
  onRetry?: () => void;
}) {
  const { isMobile } = useResponsive();

  return (
    <div className={`flex items-center justify-center ${isMobile ? 'p-4' : 'p-8'}`}>
      <div className="text-center max-w-md">
        <div className={`text-red-500 mb-4 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>⚠️</div>
        <h3 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          {title}
        </h3>
        <p className={`text-gray-600 mb-6 ${isMobile ? 'text-sm' : 'text-base'}`}>
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
              isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'
            }`}
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Mobile-aware Empty State Component
 */
export function MobileEmptyState({
  icon = '📄',
  title,
  description,
  action
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const { isMobile } = useResponsive();

  return (
    <div className={`text-center ${isMobile ? 'py-8 px-4' : 'py-12 px-8'}`}>
      <div className={`mb-4 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>{icon}</div>
      <h3 className={`font-medium text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
        {title}
      </h3>
      <p className={`text-gray-600 mb-6 max-w-md mx-auto ${isMobile ? 'text-sm' : 'text-base'}`}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Mobile-optimized Button Component
 */
export function MobileButton({
  children,
  variant = 'primary',
  size = 'auto',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'auto';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}) {
  const { isMobile } = useResponsive();

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
  };

  const getSizeClasses = () => {
    if (size === 'auto') {
      return isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-6 py-3 text-base';
    }
    
    const sizes = {
      sm: isMobile ? 'px-3 py-2 text-xs min-h-[36px]' : 'px-4 py-2 text-sm',
      md: isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-6 py-3 text-base',
      lg: isMobile ? 'px-6 py-4 text-base min-h-[52px]' : 'px-8 py-4 text-lg',
    };
    
    return sizes[size];
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    getSizeClasses(),
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    isMobile ? 'touch-manipulation' : '', // Improves touch responsiveness
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
      )}
      {children}
    </button>
  );
}

/**
 * Mobile-optimized Input Component
 */
export function MobileInput({
  label,
  error,
  hint,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  [key: string]: any;
}) {
  const { isMobile } = useResponsive();

  const inputClasses = [
    'w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
    isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm', // Larger touch targets on mobile
    error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block font-medium text-gray-700 ${isMobile ? 'text-base' : 'text-sm'}`}>
          {label}
        </label>
      )}
      <input
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'}`}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}