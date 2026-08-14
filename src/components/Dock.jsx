import { useRef } from "react";
import { Tooltip } from "react-tooltip";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { dockApps } from "#constants/index.js";
import useWindowStore from "#store/window.js";

const Dock = () => {
  const dockRef = useRef(null);
  // subscribe so the running dots track open/minimized state live
  const windows = useWindowStore((state) => state.windows);

  useGSAP(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const icons = dock.querySelectorAll(".dock-icon");
    const animateIcons = (mouseX) => {
      const { left } = dock.getBoundingClientRect();
      icons.forEach((icon) => {
        const { left: iconLeft, width } = icon.getBoundingClientRect();
        const center = iconLeft - left + width / 2;
        const distance = Math.abs(mouseX - center);
        const intensity = Math.exp(-(distance ** 2.5) / 20000);
        gsap.to(icon, {
          scale: 1 + 0.25 * intensity,
          y: -15 * intensity,
          duration: 0.2,
          ease: "power1.out",
          overwrite: true,
        });
      });
    };
    const handleMouseMove = (e) => {
      const { left } = dock.getBoundingClientRect();
      animateIcons(e.clientX - left);
    };
    const resetIcons = () =>
      icons.forEach((icon) =>
        gsap.to(icon, {
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: "power1.out",
          overwrite: true,
        }),
      );
    dock.addEventListener("mousemove", handleMouseMove);
    dock.addEventListener("mouseleave", resetIcons);
    return () => {
      dock.removeEventListener("mousemove", handleMouseMove);
      dock.removeEventListener("mouseleave", resetIcons);
    };
  }, []);

  const toggleApp = (app) => {
    if (!app.canOpen) return;
    // Read fresh state at click time — no subscription, no stale values
    const { windows, openWindow, closeWindow } = useWindowStore.getState();
    const appWindow = windows[app.id];
    if (!appWindow) return;
    // a minimized window is still "running" — the dock restores it
    if (appWindow.isMinimized || !appWindow.isOpen) openWindow(app.id);
    else closeWindow(app.id);
  };

  return (
    <section id="dock">
      <div ref={dockRef} className="dock-container">
        {dockApps.map(({ id, name, icon, canOpen }) => {
          const appWindow = windows[id];
          const isRunning = canOpen && !!appWindow?.isOpen;
          const isMinimized = !!appWindow?.isMinimized;
          return (
            <div key={id} className="relative flex justify-center">
              <button
                type="button"
                className="dock-icon"
                aria-label={name}
                data-tooltip-id="dock-tooltip"
                data-tooltip-content={
                  isMinimized ? `${name} — minimized, click to restore` : name
                }
                data-tooltip-delay-show={150}
                disabled={!canOpen}
                onClick={() => toggleApp({ id, canOpen })}
              >
                <img
                  src={`/images/${icon}`}
                  alt={name}
                  loading="lazy"
                  draggable={false}
                  className={canOpen ? "" : "opacity-60"}
                />
              </button>
              {isRunning && <span className="dock-dot" aria-hidden="true" />}
            </div>
          );
        })}
        <Tooltip id="dock-tooltip" place="top" className="tooltip" />
      </div>
    </section>
  );
};

export default Dock;