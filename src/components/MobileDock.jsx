import { dockApps } from "#constants/index.js";
import useWindowStore from "#store/window.js";

const MobileDock = () => {
  const { openWindow, closeWindow, windows } = useWindowStore();

  const toggleApp = (app) => {
    if (!app.canOpen) return;
    const appWindow = windows[app.id];
    if (!appWindow) return;
    // minimized = still running → restore instead of close
    if (appWindow.isMinimized || !appWindow.isOpen) openWindow(app.id);
    else closeWindow(app.id);
  };

  return (
    <section id="mobile-dock">
      <div className="mobile-dock-container">
        {dockApps
          .filter((app) => app.canOpen)
          .map(({ id, name, icon }) => {
            const isRunning = !!windows[id]?.isOpen;
            return (
              <button
                key={id}
                type="button"
                className="mobile-dock-icon relative"
                aria-label={name}
                onClick={() => toggleApp({ id, canOpen: true })}
              >
                <img
                  src={`/images/${icon}`}
                  alt={name}
                  loading="lazy"
                  draggable={false}
                />
                {isRunning && <span className="dock-dot" aria-hidden="true" />}
              </button>
            );
          })}
      </div>
    </section>
  );
};

export default MobileDock;