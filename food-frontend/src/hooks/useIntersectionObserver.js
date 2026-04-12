import { useState, useEffect, useRef } from "react";

/**
 * Observes whether a DOM element is intersecting the viewport.
 * @param {IntersectionObserverInit} options - Options forwarded to IntersectionObserver
 * @returns {[React.RefObject, boolean]} - [ref to attach to element, isIntersecting]
 */
const useIntersectionObserver = (options = {}) => {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );
    if (node) observer.observe(node);
    return () => { if (node) observer.unobserve(node); };
  // options is intentionally excluded — callers should pass a stable object
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, isIntersecting];
};

export default useIntersectionObserver;
