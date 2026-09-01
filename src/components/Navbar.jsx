import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { navIcons, navLinks } from "#constants";
import useWindowStore from "#store/window";
import useControlStore from "#store/control.js";
import ControlCenter from "#components/ControlCenter.jsx";

/* The Control Center trigger is the toggle icon that ALREADY lives in
   navIcons. Find it by id, by file name, or — last resort — as the
   final icon in the bar (wifi / search / user / toggle). */
const CC_KEYS = [
  "control",
  "control-center",
  "controlcenter",
  "cc",
  "toggle",
  "center",
  "switch",
];
const isCCIcon = ({ id, img }) =>
  CC_KEYS.includes(String(id).toLowerCase()) ||
  CC_KEYS.some((k) =>
    String(img ?? "")
      .toLowerCase()
      .includes(k),
  ) ||
  id === navIcons[navIcons.length - 1]?.id;

/* the menu-bar wifi icon — matches whichever nav icon's id or file
   name says "wifi". Rename the key here if yours is named differently. */
const isWifiIcon = ({ id, img }) =>
  [String(id), String(img ?? "")].some((s) => s.toLowerCase().includes("wifi"));

const LiveTime = ({ format, className }) => {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);
  return <time className={className}>{now.format(format)}</time>;
};

const glyphFor = (type) => {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "size-5",
  };
  switch (type) {
    case "finder":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M12 3v18M9 9h.01M15 9h.01" />
          <path d="M9.5 14a3 3 0 0 0 5 0" />
        </svg>
      );
    case "music":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
        </svg>
      );
    case "photos":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="1.6" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case "contact":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "terminal":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9l3 3-3 3M13 15h4" />
        </svg>
      );
    case "resume":
    case "txt":
      return (
        <svg {...common}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4M9 12h6M9 16h4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
};

const Chevron = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/* menu-bar slot that pops in / folds out instead of hard-unmounting */
const WifiSlot = ({ show, onClick, children }) => {
  const [mounted, setMounted] = useState(show);
  const [leaving, setLeaving] = useState(false);

  if (show && !mounted) {
    setMounted(true);
    setLeaving(false);
  }
  if (!show && mounted && !leaving) {
    setLeaving(true);
  }

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, 220);
    return () => clearTimeout(t);
  }, [leaving]);

  if (!mounted) return null;
  return (
    <li
      className={`nav-wifi ${leaving ? "nav-wifi-out" : "nav-wifi-in"}`}
      onClick={onClick}
    >
      {children}
    </li>
  );
};

const Navbar = () => {
  const { openWindow } = useWindowStore();
  const ccOpen = useControlStore((s) => s.open);
  const setCCOpen = useControlStore((s) => s.setOpen);
  const wifi = useControlStore((s) => s.wifi);
  const toggle = useControlStore((s) => s.toggle);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const [anchorTop, setAnchorTop] = useState(0);

  /* the existing toggle icon, reused wherever we need a trigger */
  const ccIcon = navIcons.find(isCCIcon) ?? navIcons[navIcons.length - 1];

  useLayoutEffect(() => {
    if (!menuOpen) return;
    const measure = () => {
      const r = navRef.current?.getBoundingClientRect();
      setAnchorTop(r ? Math.round(r.bottom) : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [menuOpen]);

  const handleNav = (type) => {
    openWindow(type);
    setMenuOpen(false);
  };

  const handleNavIcon = (icon) => {
    if (isCCIcon(icon)) setCCOpen(!ccOpen);
  };

  return (
    <nav ref={navRef}>
      <div className="nav-left">
        <img src="/images/logo.svg" alt="logo" />
        <p className="font-bold">Tashi's Portfolio</p>
        <ul>
          {navLinks.map(({ id, name, type }) => (
            <li key={id} onClick={() => openWindow(type)}>
              <p>{name}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="nav-right">
        <ul>
          {navIcons.map((icon) =>
            isWifiIcon(icon) ? (
              <WifiSlot
                key={icon.id}
                show={wifi}
                onClick={() => toggle("wifi")}
              >
                <img
                  src={icon.img}
                  className="icon-hover"
                  alt={`icon-${icon.id}`}
                />
              </WifiSlot>
            ) : (
              <li
                key={icon.id}
                className="cursor-pointer"
                onClick={() => handleNavIcon(icon)}
              >
                <img
                  src={icon.img}
                  className="icon-hover"
                  alt={`icon-${icon.id}`}
                />
              </li>
            ),
          )}
        </ul>
        <LiveTime format="ddd MMM D · h:mm A" />
      </div>

      <div className="nav-actions">
        {/* mobile trigger: same existing icon, whitened for the bar —
            not a new glyph */}
        <button
          id="cc-toggle-mobile"
          aria-label="Control Center"
          aria-expanded={ccOpen}
          onClick={() => setCCOpen(!ccOpen)}
        >
          <img
            src={ccIcon?.img}
            alt=""
            draggable={false}
            className="size-6 nav-icon-img"
          />
        </button>
        <button
          id="mobile-nav-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`absolute inset-0 m-auto size-6 transition-all duration-300 ${menuOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`absolute inset-0 m-auto size-6 transition-all duration-300 ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`}
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <button
              id="mobile-nav-backdrop"
              aria-label="Close menu"
              style={{ top: anchorTop }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              id="mobile-nav-menu"
              style={{ top: anchorTop }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <div className="menu-head">
                <span className="mh-title">Menu</span>
                <span className="mh-hint">tap outside to close</span>
              </div>
              <ul>
                {navLinks.map(({ id, name, type }, i) => (
                  <li
                    key={id}
                    style={{ animationDelay: `${0.05 + i * 0.045}s` }}
                  >
                    <button
                      className="link-row"
                      onClick={() => handleNav(type)}
                    >
                      <span className="link-glyph">{glyphFor(type)}</span>
                      <span className="link-name">{name}</span>
                      <span className="link-chev">
                        <Chevron />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="menu-foot">
                <span className="dot" />
                <LiveTime format="ddd MMM D · h:mm:ss A" />
                <span className="mf-build">React · GSAP · Tailwind</span>
              </div>
            </div>
          </>,
          document.body,
        )}
      <ControlCenter />
    </nav>
  );
};

export default Navbar;
