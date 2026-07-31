import useWindowStore from "#store/window.js";
import { useLayoutEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

// Keep in sync with the `sm:` breakpoint used across index.css.
const MOBILE_QUERY = "(max-width: 640px)";

const WindowWrapper = (Component, windowKey) => {
  const Wrapped = (props) => {
    const { focusWindow, windows } = useWindowStore();
    const { isOpen, zIndex } = windows[windowKey];
    const ref = useRef(null);
    const draggableRef = useRef(null);

    // Places the window for the CURRENT viewport and returns the coords.
    // offset* reads the layout box (transforms ignored), so this math
    // works regardless of what the stylesheet says.
    const placeWindow = () => {
      const el = ref.current;
      if (!el) return null;

      gsap.set(el, { x: 0, y: 0 });

      const isMobile = window.matchMedia(MOBILE_QUERY).matches;
      const x = (window.innerWidth - el.offsetWidth) / 2 - el.offsetLeft;
      let y;

      if (isMobile) {
        // Mobile: windows act as bottom sheets, pinned just above the
        // mobile dock instead of floating dead-center over it.
        const dock = document.querySelector("#mobile-dock");
        const gap = (dock?.offsetHeight ?? 72) + 12;
        y = window.innerHeight - el.offsetHeight - gap - el.offsetTop;
        // Sheets taller than the available space pin 12px from the top
        // so the header and close button stay reachable.
        y = Math.max(y, 12);
      } else {
        // Desktop: dead-center, clamped 16px from the top for windows
        // taller than the viewport.
        y =
          Math.max((window.innerHeight - el.offsetHeight) / 2, 16) -
          el.offsetTop;
      }

      gsap.set(el, { x, y, transformOrigin: "center center" });
      return { x, y };
    };

    // --- OPEN/CLOSE: visibility + placement, all before paint ---
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;

      // "" (not "block") — an inline `display: block` would squash the
      // stylesheet's `display: flex` that the mobile layouts rely on.
      el.style.display = isOpen ? "" : "none";
      if (!isOpen) return;

      // Kill any tween still mid-flight so it can't fight the re-open.
      gsap.killTweensOf(el);

      const pos = placeWindow();
      const isMobile = window.matchMedia(MOBILE_QUERY).matches;

      if (isMobile) {
        // Sheets slide up from the dock — x stays put, only y moves.
        gsap.fromTo(
          el,
          { opacity: 0, y: pos.y + 72, scale: 1 },
          { opacity: 1, y: pos.y, scale: 1, duration: 0.4, ease: "power3.out" },
        );
      } else {
        // Flourish uses ONLY opacity + scale — never x or y — so the
        // entrance animation can't nudge the window off center.
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.88 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.35,
            ease: "back.out(1.5)",
            onComplete: () => draggableRef.current?.update(),
          },
        );
      }

      // Re-place on rotation / resize / breakpoint crossing while open.
      const onResize = () => {
        gsap.killTweensOf(el);
        placeWindow();
        draggableRef.current?.update();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [isOpen]);

    // --- DRAG: desktop only. On touch, Draggable would swallow the very
    // gestures the gallery needs to scroll, so sheets stay put instead. ---
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
