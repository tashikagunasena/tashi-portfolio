import { dockApps } from "#constants/index.js";
import useWindowStore from "#store/window.js";

const MobileDock = () => {
  const { openWindow, closeWindow, windows } = useWindowStore();

  const toggleApp = (app) => {
    if (!app.canOpen) return;
    const appWindow = windows[app.id];
    if (!appWindow) return;
    if (appWindow.isOpen) {
      closeWindow(app.id);
    } else {
      openWindow(app.id);
    }
  };

  return (
    <section id="mobile-dock">
      <div className="mobile-dock-container">
        {dockApps
          .filter((app) => app.canOpen)
          .map(({ id, name, icon }) => (
            <button
              key={id}
              type="button"
              className="mobile-dock-icon"
              aria-label={name}
              onClick={() => toggleApp({ id, canOpen: true })}
            >
              <img
                src={`/images/${icon}`}
                alt={name}
                loading="lazy"
                draggable={false}
              />
            </button>
          ))}
      </div>
    </section>
  );
};

export default MobileDock;