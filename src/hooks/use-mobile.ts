import { useMediaQuery } from "@react-hookz/web/useMediaQuery";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  return (
    useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`, { initializeWithValue: false }) ??
    false
  );
}
