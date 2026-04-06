import { useEffect, useRef } from "react";

/**
 * Lightweight scroll-reveal hook using IntersectionObserver.
 * Adds "anim-visible" class to children with "anim-on-scroll" when they enter the viewport.
 *
 * Usage:
 *   const sectionRef = useScrollReveal();
 *   <div ref={sectionRef}> ... children with className="anim-on-scroll" ... </div>
 */
export default function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("anim-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    const targets = el.querySelectorAll(".anim-on-scroll");
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
