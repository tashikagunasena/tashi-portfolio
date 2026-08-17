import useWindowStore from "#store/window.js";
import { useLayoutEffect, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const MOBILE_QUERY = "(max-width: 640px)";
const RESIZE_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
const MIN_W = 360;
const MIN_H = 240;

const clearPageScroll = () => {
  const main = document.querySelector("main");
  if (main) main.scrollLeft = main.scrollTop = 0;
  document.documentElement.scrollLeft = document.documentElement.scrollTop = 0;
  document.body.scrollLeft = document.body.scrollTop = 0;
};

const WindowWrapper = (Component, windowKey) => {
  const Wrapped = (props) => {
    const { focusWindow, windows } = useWindowStore();
    const { isOpen, zIndex, isMinimized, isMaximized } =
      windows[windowKey] ?? {};
    const ref = useRef(null);
    const draggableRef = useRef(null);
    const homeRect = useRef(null);
    const prev = useRef({ open: false, min: false, max: false });

    const isMobileNow = () => window.matchMedia(MOBILE_QUERY).matches;

    const fullRect = () => ({
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const applyFull = (el, animate) => {
      const r = fullRect();
      const vars = {
        x: r.left - el.offsetLeft,
        y: r.top - el.offsetTop,
        width: r.width,
        height: r.height,
        duration: 0.35,
        ease: "power3.inOut",
        onComplete: () => draggableRef.current?.update(),
      };
      if (animate) gsap.to(el, vars);
      else gsap.set(el, vars);
    };

    const saveHome = (el) => {
      if (homeRect.current) return;
      homeRect.current = {
        x: gsap.getProperty(el, "x"),
        y: gsap.getProperty(el, "y"),
        width: el.offsetWidth,
        height: el.offsetHeight,
      };
    };

    const placeWindow = () => {
      const el = ref.current;
      if (!el) return;
      clearPageScroll();
      if (isMaximized) {
        applyFull(el, false);
        return;
      }
      gsap.set(el, { x: 0, y: 0 });
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const left = el.offsetLeft;
      const top = el.offsetTop;
      const x = (window.innerWidth - w) / 2 - left;
      let y;
      if (isMobileNow()) {
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

    const minimizeAnim = (el) => {
      saveHome(el);
      gsap.to(el, {
        y: window.innerHeight - el.offsetTop + 40,
        scale: 0.1,
        opacity: 0,
        duration: 0.45,
        ease: "power2.in",
        onComplete: () => {
          el.style.display = "none";
        },
      });
    };

    const popIn = (el, fromScale = 0.9) => {
      gsap.fromTo(
        el,
        { opacity: 0, scale: fromScale },
        {
          opacity: 1,
          scale: 1,
          duration: 0.32,
          ease: "back.out(1.4)",
          onComplete: () => draggableRef.current?.update(),
        },
      );
    };

    /* ---------- RESIZE (desktop only) ---------- */
    const startResize = (e, dir) => {
      const el = ref.current;
      if (!el || isMobileNow() || isMaximized || !isOpen || isMinimized) return;
      // capture-phase stop so GSAP Draggable never sees this press
      e.stopPropagation();
      e.preventDefault();
      focusWindow(windowKey);

      const handle = e.currentTarget;
      handle.setPointerCapture(e.pointerId);

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;
      const gx = gsap.getProperty(el, "x");
      const gy = gsap.getProperty(el, "y");

      const move = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let w = startW;
        let h = startH;
        let x = gx;
        let y = gy;
        if (dir.includes("e")) w = startW + dx;
        if (dir.includes("s")) h = startH + dy;
        if (dir.includes("w")) w = startW - dx;
        if (dir.includes("n")) h = startH - dy;
        w = Math.max(MIN_W, Math.min(w, window.innerWidth));
        h = Math.max(MIN_H, Math.min(h, window.innerHeight));
        // keep the opposite edge pinned when dragging west/north
        if (dir.includes("w")) x = gx + (startW - w);
        if (dir.includes("n")) y = gy + (startH - h);
        gsap.set(el, { width: w, height: h, x, y });
      };
      const up = (ev) => {
        handle.releasePointerCapture?.(ev.pointerId);
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
        draggableRef.current?.update?.();
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    };

    /* ---------- OPEN / MINIMIZE / MAXIMIZE ---------- */
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;
      const p = prev.current;
      gsap.killTweensOf(el);

      if (!isOpen) {
        el.style.display = "none";
        el.classList.remove("win-full");
      } else if (isMinimized) {
        if (p.min) {
          el.style.display = "none";
        } else {
          el.style.display = "";
          minimizeAnim(el);
        }
      } else {
        el.style.display = "";
        const entering = !p.open || p.min;

        if (entering) {
          if (p.min && homeRect.current) {
            // restore from minimize
            if (isMaximized) {
              el.classList.add("win-full");
              applyFull(el, false);
              popIn(el);
            } else {
              const h = homeRect.current;
              gsap.set(el, {
                x: h.x,
                y: h.y,
                width: h.width,
                height: h.height,
              });
              gsap.fromTo(
                el,
                { scale: 0.1, opacity: 0 },
                {
                  scale: 1,
                  opacity: 1,
                  duration: 0.35,
                  ease: "back.out(1.4)",
                  onComplete: () => {
                    // mobile must fall back to CSS sheet sizes; desktop
                    // keeps the (possibly user-resized) inline size
                    if (isMobileNow()) gsap.set(el, { width: "", height: "" });
                    draggableRef.current?.update();
                  },
                },
              );
            }
          } else {
            el.classList.remove("win-full");
            placeWindow();
            popIn(el);
          }
        } else if (isMaximized !== p.max) {
          if (isMaximized) {
            // release the CSS clamps FIRST, then glide to full screen
            el.classList.add("win-full");
            saveHome(el);
            applyFull(el, true);
          } else if (homeRect.current) {
            // glide home FIRST, drop the clamps AFTER the tween lands
            const h = homeRect.current;
            gsap.to(el, {
              x: h.x,
              y: h.y,
              width: h.width,
              height: h.height,
              duration: 0.3,
              ease: "power3.inOut",
              onComplete: () => {
                if (isMobileNow()) gsap.set(el, { width: "", height: "" });
                el.classList.remove("win-full");
                homeRect.current = null;
                draggableRef.current?.update();
              },
            });
          } else {
            el.classList.remove("win-full");
          }
        }
      }

      if (draggableRef.current) {
        if (isOpen && !isMinimized && isMaximized)
          draggableRef.current.disable();
        else draggableRef.current.enable();
      }

      prev.current = { open: isOpen, min: isMinimized, max: isMaximized };
    }, [isOpen, isMinimized, isMaximized]);

    /* ---------- stay correct on resize / rotate ---------- */
    useEffect(() => {
      const el = ref.current;
      if (!el || !isOpen || isMinimized) return;
      let raf = 0;
      const ro = new ResizeObserver(() => {
        if (isMaximized || !isMobileNow()) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(placeWindow);
      });
      ro.observe(el);
      const onResize = () => {
        gsap.killTweensOf(el);
        if (isMaximized) {
          applyFull(el, false);
        } else if (isMobileNow()) {
          gsap.set(el, { width: "", height: "" });
          el.classList.remove("win-full");
          homeRect.current = null;
          placeWindow();
        }
        draggableRef.current?.update();
      };
      window.addEventListener("resize", onResize);
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }, [isOpen, isMinimized, isMaximized]);

    /* ---------- DRAG: desktop only ---------- */
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
        {/* Handles render FIRST: several window layouts (#photos, #finder,
            #safari, #contact.win-full) target their body wrapper with
            `> div:last-child`, so the handle wrapper must never be the
            last child of the section. */}
        {!isMaximized && (
          <div aria-hidden="true">
            {RESIZE_DIRS.map((dir) => (
              <div
                key={dir}
                className={`win-rz win-rz-${dir}`}
                onPointerDownCapture={(e) => startResize(e, dir)}
              />
            ))}
          </div>
        )}
        <Component {...props} />
      </section>
    );
  };

  Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
};

export default WindowWrapper;