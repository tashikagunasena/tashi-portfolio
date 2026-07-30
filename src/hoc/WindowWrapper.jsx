import useWindowStore from "#store/window.js";
import { useLayoutEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const WindowWrapper = (Component, windowKey) => {
  const Wrapped = (props) => {
    const { focusWindow, windows } = useWindowStore();
    const { isOpen, zIndex } = windows[windowKey];
    const ref = useRef(null);
    const draggableRef = useRef(null);

    // --- OPEN/CLOSE: visibility + dead-center placement, all before paint ---
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;

      el.style.display = isOpen ? "block" : "none";
      if (!isOpen) return;

      // Kill any tween still mid-flight so it can't fight the re-open.
      gsap.killTweensOf(el);

      // offset* reads the layout box (transforms ignored), so this math
      // centers the window regardless of what the stylesheet says.
      // The Math.max clamp keeps taller-than-viewport windows reachable
      // (16px from the top) instead of centering their headers off-screen.
      gsap.set(el, { x: 0, y: 0 });
      const x = (window.innerWidth - el.offsetWidth) / 2 - el.offsetLeft;
      const y =
        Math.max((window.innerHeight - el.offsetHeight) / 2, 16) - el.offsetTop;

      gsap.set(el, { x, y, transformOrigin: "center center" });

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
    }, [isOpen]);

    // --- DRAG: created once, instance cached for the open effect ---
    useGSAP(() => {
      const el = ref.current;
      if (!el) return;
      const [instance] = Draggable.create(el, {
        onPress: () => focusWindow(windowKey),
      });
      draggableRef.current = instance;
      return () => {
        instance.kill();
        draggableRef.current = null;
      };
    }, []);

    return (
      <section
        id={windowKey}
        ref={ref}
        style={{ zIndex }}
        className="absolute top-0 left-0"
      >
        <Component {...props} />
      </section>
    );
  };

  Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
};

export default WindowWrapper;