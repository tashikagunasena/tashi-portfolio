import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import useWindowStore from "#store/window";

gsap.registerPlugin(Draggable);

/* ✏️ Tweak me --------------------------------------------------------- */
const CITY = { name: "Colombo", lat: 6.9271, lon: 79.8612 };
const PHOTO = "/images/carousel.jpg"; // your single widget photo
/* -------------------------------------------------------------------- */

const FALLBACK_WEATHER = { temp: 30, hi: 32, lo: 26, code: 2 };

const describeWeather = (code) => {
  if (code == null) return { label: "Partly Cloudy", icon: "🌤️" };
  if (code === 0) return { label: "Clear Sky", icon: "☀️" };
  if (code <= 2) return { label: "Partly Cloudy", icon: "🌤️" };
  if (code === 3) return { label: "Overcast", icon: "☁️" };
  if (code <= 48) return { label: "Foggy", icon: "🌫️" };
  if (code <= 57) return { label: "Drizzle", icon: "🌦️" };
  if (code <= 67) return { label: "Rain", icon: "🌧️" };
  if (code <= 77) return { label: "Snow", icon: "❄️" };
  if (code <= 82) return { label: "Showers", icon: "🌧️" };
  return { label: "Thunderstorm", icon: "⛈️" };
};

const CalendarWidget = () => {
  const now = dayjs();
  const lead = now.startOf("month").day();
  const days = now.daysInMonth();
  return (
    <div className="widget-card cal">
      <p className="cal-month">{now.format("MMMM")}</p>
      <div className="cal-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`dow-${i}`} className="cal-dow">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => (
          <span
            key={i}
            className={i + 1 === now.date() ? "cal-date today" : "cal-date"}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
};

const WeatherWidget = () => {
  const [w, setW] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${CITY.lat}&longitude=${CITY.lon}` +
        `&current_weather=true&daily=temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=1`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setW({
          temp: Math.round(d.current_weather.temperature),
          code: d.current_weather.weathercode,
          hi: Math.round(d.daily.temperature_2m_max[0]),
          lo: Math.round(d.daily.temperature_2m_min[0]),
        });
      })
      .catch(() => alive && setW(FALLBACK_WEATHER));
    return () => {
      alive = false;
    };
  }, []);
  const { label, icon } = describeWeather(w?.code);
  return (
    <div className="widget-card weather">
      <p className="w-city">{CITY.name}</p>
      <p className="w-temp">{w ? `${w.temp}°` : "–"}</p>
      <div className="w-foot">
        <span>
          {icon} {label}
        </span>
        <span>
          H:{w?.hi ?? "–"}° L:{w?.lo ?? "–"}°
        </span>
      </div>
    </div>
  );
};

const PhotoWidget = () => {
  const { openWindow } = useWindowStore();
  return (
    <button
      type="button"
      className="widget-card photo"
      onClick={() => openWindow("photos")}
      title="Open Photos"
    >
      <img src={PHOTO} alt="From my photo library" />
      <span className="photo-tag">Photos</span>
    </button>
  );
};

const Widgets = () => {
  const rootRef = useRef(null);

  /* ---------- desktop-only drag + entrance-animation cleanup ---------- */
  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 641px)", () => {
      const cleanups = [];
      root.querySelectorAll(".widget").forEach((el) => {
        // 1) retire the entrance animation the moment it finishes…
        const onAnimEnd = (e) => {
          if (e.target === el) el.style.animation = "none";
        };

        // 2) …or the moment it's pressed, BEFORE Draggable measures.
        //    A press mid-pop used to bake the in-flight translateY into
        //    inline styles, and fill-mode kept it → the "drop" on click.
        //    Only runs once (first press); later presses keep drag offsets.
        const onPointerDown = () => {
          if (el.style.animation !== "none") {
            el.style.animation = "none";
            gsap.set(el, { clearProps: "transform" });
          }
        };

        // register BEFORE Draggable.create so this runs first on press
        el.addEventListener("animationend", onAnimEnd);
        el.addEventListener("pointerdown", onPointerDown);

        const [instance] = Draggable.create(el, {
          type: "x,y",
          onPress: () => gsap.killTweensOf(el),
        });

        // double-click snaps the widget back to its grid slot
        const onDblClick = () =>
          gsap.to(el, { x: 0, y: 0, duration: 0.35, ease: "power2.out" });
        el.addEventListener("dblclick", onDblClick);

        cleanups.push(() => {
          el.removeEventListener("animationend", onAnimEnd);
          el.removeEventListener("pointerdown", onPointerDown);
          el.removeEventListener("dblclick", onDblClick);
          instance.kill();
        });
      });
      return () => cleanups.forEach((fn) => fn());
    });
    return () => mm.revert();
  }, []);

  return (
    <div id="widgets" ref={rootRef}>
      <div className="widget">
        <CalendarWidget />
      </div>
      <div className="widget">
        <WeatherWidget />
      </div>
      <div className="widget">
        <PhotoWidget />
      </div>
    </div>
  );
};

export default Widgets;
