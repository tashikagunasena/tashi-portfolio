import useWindowStore from "#store/window.js";
import { useLayoutEffect, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const MOBILE_QUERY = "(max-width: 640px)";

// This app never scrolls the page (html/body/main are overflow:hidden), so a
// non-zero scroll offset there is always a stray value — and because windows
// are absolutely positioned inside that container, any stray horizontal scroll
// silently slides every window off-center. Reset it.
const clearPageScroll = () => {
  const main = document.querySelector("main");
  if (main) main.scrollLeft = main.scrollTop = 0;
  document.documentElement.scrollLeft = document.documentElement.scrollTop = 0;
  document.body.scrollLeft = document.body.scrollTop = 0;
};

const WindowWrapper = (Component, windowKey) => {
  const Wrapped = (props) => {
    const { focusWindow, windows } = useWindowStore();
    const { isOpen, zIndex } = windows[windowKey];
    const ref = useRef(null);
    const draggableRef = useRef(null);

    const placeWindow = () => {
      const el = ref.current;
      if (!el) return;

      // Kill any stray page scroll BEFORE we measure or place — see above.
      clearPageScroll();

      gsap.set(el, { x: 0, y: 0 });

      const isMobile = window.matchMedia(MOBILE_QUERY).matches;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const left = el.offsetLeft;
      const top = el.offsetTop;

      const x = (window.innerWidth - w) / 2 - left;
      let y;

      if (isMobile) {
        // Center inside the area ABOVE the dock so the dock is never covered.
        const dock = document.querySelector("#mobile-dock");
        const dockH = dock ? dock.offsetHeight : 0;
        const stageTop = 12;
        const stageBottom = window.innerHeight - dockH - 8;
        const stageH = Math.max(stageBottom - stageTop, 0);

        const centerY = stageTop + (stageH - h) / 2;
        const minY = stageTop - top;
        const maxY = stageBottom - h - top;
        y = minY > maxY ? minY : Math.min(Math.max(centerY - top, minY), maxY);
      } else {
        y = Math.max((window.innerHeight - h) / 2, 16) - top;
      }

      gsap.set(el, { x, y, transformOrigin: "center center" });
    };

    // --- OPEN/CLOSE ---
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;

      el.style.display = isOpen ? "" : "none"; // "" so CSS flex layouts live
      if (!isOpen) return;

      gsap.killTweensOf(el);
      placeWindow();

      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.32,
          ease: "back.out(1.4)",
          onComplete: () => draggableRef.current?.update(),
        },
      );
    }, [isOpen]);

    // --- STAY CENTERED on mobile when the box changes size ---
    useEffect(() => {
      const el = ref.current;
      if (!el || !isOpen) return;

      let raf = 0;
      const ro = new ResizeObserver(() => {
        if (!window.matchMedia(MOBILE_QUERY).matches) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(placeWindow);
      });
      ro.observe(el);

      const onResize = () => {
        gsap.killTweensOf(el);
        placeWindow();
        draggableRef.current?.update();
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }, [isOpen]);

    // --- DRAG: desktop only ---
    useGSAP(() => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(min-width: 641px)", () => {
        const [instance] = Draggable.create(el, {
          onPress: () => focusWindow(windowKey),
        });
        draggableRef.current = instance;
        return () => {
          instance.kill();
          draggableRef.current = null;
        };
      });
      return () => mm.revert();
    }, []);

    return (
      <section
        id={windowKey}
        ref={ref}
        style={{ zIndex }}
        className="absolute top-0 left-0"
        onPointerDown={() => focusWindow(windowKey)}
      >
        <Component {...props} />
      </section>
    );
  };

  Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
};

export default WindowWrapper;
