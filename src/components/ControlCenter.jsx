import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useControlStore from "#store/control.js";
import useWindowStore from "#store/window.js";
import usePlayerStore from "#store/player.js";
import {
  Wifi,
  Bluetooth,
  Rss,
  Moon,
  Sun,
  SunDim,
  Maximize,
  Flashlight,
  Timer,
  Calculator,
  Camera,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Volume2,
  VolumeX,
} from "lucide-react";

const CcSlider = ({ value, onChange }) => {
  const ref = useRef(null);
  const update = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    onChange(Math.round((x / r.width) * 100));
  };
  return (
    <div
      ref={ref}
      className="cc-slider"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.buttons > 0 && update(e)}
    >
      <div className="cc-slider-fill" style={{ width: `${value}%` }} />
      <div className="cc-slider-thumb" style={{ left: `${value}%` }} />
    </div>
  );
};

const ControlCenter = () => {
  const { openWindow } = useWindowStore();
  const [anchorTop, setAnchorTop] = useState(48);

  const isOpen = useControlStore((s) => s.open);
  const dark = useControlStore((s) => s.dark);
  const brightness = useControlStore((s) => s.brightness);
  const wifi = useControlStore((s) => s.wifi);
  const bluetooth = useControlStore((s) => s.bluetooth);
  const airdrop = useControlStore((s) => s.airdrop);
  const focus = useControlStore((s) => s.focus);
  const flashlight = useControlStore((s) => s.flashlight);
  const toggle = useControlStore((s) => s.toggle);
  const setOpen = useControlStore((s) => s.setOpen);
  const setBrightness = useControlStore((s) => s.setBrightness);

  /* music comes from the shared player store — always in sync */
  const playing = usePlayerStore((s) => s.playing);
  const track = usePlayerStore((s) => s.tracks[s.index]);
  const volume = usePlayerStore((s) => s.volume);
  const playerToggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const setVolume = usePlayerStore((s) => s.setVolume);

  const [mounted, setMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  if (isOpen && !mounted) {
    setMounted(true);
    setIsClosing(false);
  }
  if (!isOpen && mounted && !isClosing) {
    setIsClosing(true);
  }

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 360);
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      const r = document.querySelector("nav")?.getBoundingClientRect();
      setAnchorTop(r ? Math.round(r.bottom) + 6 : 48);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, setOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const dim = ((100 - brightness) / 100) * 0.75;

  /* NOTE: no more `if (!mounted) return null` — the brightness overlay
     must stay in the DOM after the panel closes, so the chosen level
     persists like real screen brightness. */
  return createPortal(
    <>
      <div id="cc-dim" style={{ opacity: dim }} />

      {mounted && (
        <>
          <button
            id="cc-backdrop"
            className={isClosing ? "closing" : ""}
            aria-label="Close Control Center"
            onClick={() => setOpen(false)}
          />
          <div
            id="control-center"
            className={isClosing ? "closing" : ""}
            style={{ "--cc-top": `${anchorTop}px` }}
            role="dialog"
            aria-label="Control Center"
          >
            <div className="cc-top">
              <div className="cc-connect cc-glass">
                <button
                  className={`cc-wifi ${wifi ? "on" : ""}`}
                  onClick={() => toggle("wifi")}
                >
                  <span className="cc-wifi-icon">
                    <Wifi className="size-4" />
                  </span>
                  <span className="cc-wifi-text">
                    <span className="cc-wifi-name">Wi‑Fi</span>
                    <span className="cc-wifi-sub">{wifi ? "Home" : "Off"}</span>
                  </span>
                </button>
                <div className="cc-connect-row">
                  <button
                    className={`cc-round ${bluetooth ? "on" : ""}`}
                    title="Bluetooth"
                    onClick={() => toggle("bluetooth")}
                  >
                    <Bluetooth className="size-5" />
                  </button>
                  <button
                    className={`cc-round ${airdrop ? "on" : ""}`}
                    title="AirDrop"
                    onClick={() => toggle("airdrop")}
                  >
                    <Rss className="size-5" />
                  </button>
                </div>
              </div>

              <div className="cc-player cc-glass">
                <div className="cc-player-head">
                  <span className="cc-art">
                    {playing ? (
                      <span className="cc-eq">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      <Music2 className="size-5" />
                    )}
                  </span>
                  <span className="cc-track">
                    <span className="cc-title">{track.title}</span>
                    <span className="cc-artist">
                      {playing ? track.artist : "Not Playing"}
                    </span>
                  </span>
                </div>
                <div className="cc-player-controls">
                  <button aria-label="Previous" onClick={() => prev()}>
                    <SkipBack className="size-5" fill="currentColor" />
                  </button>
                  <button
                    className="cc-play"
                    aria-label={playing ? "Pause" : "Play"}
                    onClick={playerToggle}
                  >
                    {playing ? (
                      <Pause className="size-5" fill="currentColor" />
                    ) : (
                      <Play className="size-5 ml-0.5" fill="currentColor" />
                    )}
                  </button>
                  <button aria-label="Next" onClick={() => next()}>
                    <SkipForward className="size-5" fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>

            <div className="cc-mid">
              <button
                className={`cc-focus cc-glass ${focus ? "on" : ""}`}
                onClick={() => toggle("focus")}
              >
                <span className="cc-focus-icon">
                  <Moon className="size-4" />
                </span>
                Focus
              </button>
              <button
                className={`cc-orb cc-glass ${dark ? "on" : ""}`}
                title="Appearance"
                onClick={() => toggle("dark")}
              >
                {dark ? (
                  <Moon className="size-5" />
                ) : (
                  <Sun className="size-5" />
                )}
              </button>
              <button
                className="cc-orb cc-glass"
                title="Fullscreen"
                onClick={toggleFullscreen}
              >
                <Maximize className="size-5" />
              </button>
            </div>

            <div className="cc-slider-card cc-glass">
              <span className="cc-label">Display</span>
              <div className="cc-slider-row">
                <SunDim className="size-4 text-white/80" />
                <CcSlider value={brightness} onChange={setBrightness} />
                <Sun className="size-5" />
              </div>
            </div>

            <div className="cc-slider-card cc-glass">
              <span className="cc-label">Sound</span>
              <div className="cc-slider-row">
                <VolumeX className="size-4 text-white/80" />
                <CcSlider value={volume} onChange={setVolume} />
                <Volume2 className="size-5" />
              </div>
            </div>

            <div className="cc-bottom">
              <button
                className={`cc-orb cc-glass ${flashlight ? "on-amber" : ""}`}
                title="Flashlight"
                onClick={() => toggle("flashlight")}
              >
                <Flashlight className="size-5" />
              </button>
              <button className="cc-orb cc-glass" title="Timer">
                <Timer className="size-5" />
              </button>
              <button className="cc-orb cc-glass" title="Calculator">
                <Calculator className="size-5" />
              </button>
              <button
                className="cc-orb cc-glass"
                title="Camera"
                onClick={() => {
                  openWindow("photos");
                  setOpen(false);
                }}
              >
                <Camera className="size-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </>,
    document.body,
  );
};

export default ControlCenter;