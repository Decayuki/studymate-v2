import { useState, useEffect } from 'react';

interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Custom hook for responsive design utilities
 * Provides breakpoint detection and screen size information
 */
export function useResponsive(): BreakpointState {
  const [state, setState] = useState<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState({
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
        isLargeDesktop: width >= BREAKPOINTS.xl,
        width,
        height,
      });
    };

    // Initial state
    updateState();

    // Add event listener
    window.addEventListener('resize', updateState);

    // Cleanup
    return () => window.removeEventListener('resize', updateState);
  }, []);

  return state;
}

/**
 * Hook for detecting if screen is below a certain breakpoint
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const [isBelow, setIsBelow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkBreakpoint = () => {
      setIsBelow(window.innerWidth < BREAKPOINTS[breakpoint]);
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isBelow;
}

/**
 * Hook for detecting touch device
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.maxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouchDevice;
}

/**
 * Hook for detecting device orientation
 */
export function useOrientation(): 'portrait' | 'landscape' | null {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);

    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return orientation;
}

/**
 * Hook for detecting reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for detecting dark mode preference
 */
export function usePrefersDarkMode(): boolean {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDarkMode(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersDarkMode(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersDarkMode;
}