import { WindowControls } from "#components";
import { Search } from "lucide-react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { locations } from "#constants/index.js";
import useLocationStore from "#store/location";
import clsx from "clsx";
import useWindowStore from "#store/window";
import { useEffect, useRef } from "react";

const Finder = () => {
  const { openWindow } = useWindowStore();
  const { activeLocation, setActiveLocation } = useLocationStore();
  const sidebarRef = useRef(null);

  // ids repeat ACROSS the two sidebar lists (Favorites reuses 1,2,3… and so
  // does Work), so an id-only check lights up two pills at once. Match the
  // item itself instead — exactly one pill can ever be active.
  const isActive = (item) =>
    item === activeLocation ||
    (item.id === activeLocation?.id && item.name === activeLocation?.name);

  // Keep the active pill centered on the horizontal mobile rail — by scrolling
  // the rail ONLY. (scrollIntoView would also nudge overflow:hidden ancestors
  // like <main>, which slides the absolutely-positioned window sideways.)
  useEffect(() => {
    const rail = sidebarRef.current;
    const active = rail?.querySelector(".active");
    if (!rail || !active) return;
    if (!window.matchMedia("(max-width: 640px)").matches) return;
    const railRect = rail.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const center =
      rail.scrollLeft +
      (activeRect.left - railRect.left) -
      (railRect.width - activeRect.width) / 2;
    rail.scrollTo({ left: Math.max(0, center), behavior: "smooth" });
    // depend on the whole object, not just id — two different folders can
    // share an id, and the rail must re-center on every real change
  }, [activeLocation]);

  const openItem = (item) => {
    if (item.fileType === "pdf") return openWindow("resume", item);
    if (item.kind === "folder") return setActiveLocation(item);
    if (["fig", "url"].includes(item.fileType) && item.href)
      return window.open(item.href, "_blank");
    openWindow(`${item.fileType}${item.kind}`, item);
  };

  const renderList = (name, items) => (
    <div>
      <h3>{name}</h3>
      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => setActiveLocation(item)}
            className={clsx(isActive(item) ? "active" : "not-active")}
          >
            <img src={item.icon} className="w-4" alt={item.name} />
            <p className="text-sm font-medium truncate">{item.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <div id="window-header">
        <WindowControls target="finder" />
        <h2>{activeLocation?.name}</h2>
        <Search className="icon" />
      </div>
      <div className="bg-white flex h-full">
        <div className="sidebar" ref={sidebarRef}>
          {renderList("Favorites", Object.values(locations))}
          {renderList("Work", locations.work.children)}
        </div>
        <ul className="content">
          {activeLocation?.children.map((item) => (
            <li
              key={item.id}
              className={item.position}
              onClick={() => openItem(item)}
            >
              <img src={item.icon} alt={item.name} />
              <p>{item.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

const FinderWindow = WindowWrapper(Finder, "finder");
export default FinderWindow;

