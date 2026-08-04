import { useState, useEffect } from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import { locations } from "#constants";
import useWindowStore from "#store/window.js";
import useLocationStore from "#store/location.js";
import Widgets from "#components/Widgets.jsx";

const projects = locations.work?.children ?? [];

/* ✏️ Edit your hero copy in one place. Paste your own bio into `tagline`. */
const HERO = {
  line: "HI, Welcome to my",
  wordmark: "portfolio",
  tagline:
    "I'm Tashi. A web dev in sri lanka. Do be aware in order to get the full MacOS experiance view this porfolio in a larger screen",
};

const Ticker = ({ format, className }) => {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className={className}>{now.format(format)}</span>;
};

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const Home = () => {
  const { setActiveLocation } = useLocationStore();
  const { openWindow } = useWindowStore();

  const handleOpenProjectFinder = (project) => {
    setActiveLocation(project);
    openWindow("finder");
  };

  // desktop folders AND widgets stay draggable
  useGSAP(() => {
    Draggable.create(".folder, .widget");
  }, []);

  return (
    <>
      {/* ---------- Desktop home: widget stack + clickable, draggable folders ---------- */}
      <section id="home">
        <Widgets />
        <ul>
          {projects.map((project) => (
            <li
              key={project.id}
              className={clsx("group folder", project.windowPosition)}
              onClick={() => handleOpenProjectFinder(project)}
            >
              <img src="/images/folder.png" alt={project.name} />
              <p>{project.name}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Mobile home: status strip + hero + tiles + CTA ---------- */}
      <section id="mobile-home">
        <div className="ambient" aria-hidden="true">
          <span className="streak" />
        </div>
        <div className="home-inner">
          <div className="home-status rise" style={{ animationDelay: "0s" }}>
            <Ticker format="h:mm:ss A" className="hs-clock" />
            <span className="hs-pill">
              <span className="dot" />
              Available
            </span>
          </div>
          <header className="home-hero">
            <p className="kicker rise" style={{ animationDelay: "0.06s" }}>
              {HERO.kicker}
            </p>
            <h1 className="rise" style={{ animationDelay: "0.12s" }}>
              <span className="line">{HERO.line}</span>
              <span className="wordmark">{HERO.wordmark}</span>
            </h1>
            <p className="tagline rise" style={{ animationDelay: "0.18s" }}>
              {HERO.tagline}
            </p>
          </header>
          <div
            className="mobile-section-label rise"
            style={{ animationDelay: "0.24s" }}
          >
            Projects
          </div>
          <ul className="projects-grid">
            {projects.map((project, i) => (
              <li
                key={project.id}
                className="project-tile rise"
                style={{ animationDelay: `${0.3 + i * 0.05}s` }}
                onClick={() => handleOpenProjectFinder(project)}
              >
                <span className="tile-media">
                  <img src="/images/folder.png" alt={project.name} />
                  <span className="tile-go">
                    <ArrowIcon />
                  </span>
                </span>
                <span className="tile-name">{project.name}</span>
              </li>
            ))}
          </ul>
          <button
            className="cta rise"
            style={{ animationDelay: "0.5s" }}
            onClick={() => openWindow("contact")}
          >
            <span className="cta-sheen" aria-hidden="true" />
            <span className="cta-copy">
              <span className="cta-title">Let's work together</span>
              <span className="cta-sub">Open the contact window</span>
            </span>
            <span className="cta-arrow">
              <ArrowIcon />
            </span>
          </button>
        </div>
      </section>
    </>
  );
};

export default Home;
