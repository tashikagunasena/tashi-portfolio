import { useRef, useState } from "react";
import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import usePlayerStore, { formatTime } from "#store/player.js";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Music2,
  ListMusic,
  Heart,
  Clock,
  Search,
  User,
  Disc3,
  Radio,
  Volume2,
  VolumeX,
} from "lucide-react";

/* draggable/clickable progress bar bound to the shared player */
const SeekBar = () => {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const ref = useRef(null);
  const pct = duration ? Math.min((currentTime / duration) * 100, 100) : 0;

  const update = (e) => {
    const r = ref.current.getBoundingClientRect();
    const f = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    seek(f * (duration || 0));
  };

  return (
    <div
      ref={ref}
      className="bar"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.buttons > 0 && update(e)}
    >
      <div className="fill" style={{ width: `${pct}%` }} />
    </div>
  );
};

const VolumeBar = () => {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const ref = useRef(null);

  const update = (e) => {
    const r = ref.current.getBoundingClientRect();
    const f = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    setVolume(Math.round(f * 100));
  };

  return (
    <div
      ref={ref}
      className="vol-bar"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.buttons > 0 && update(e)}
    >
      <div className="fill" style={{ width: `${volume}%` }} />
    </div>
  );
};

const Music = () => {
  const tracks = usePlayerStore((s) => s.tracks);
  const index = usePlayerStore((s) => s.index);
  const playing = usePlayerStore((s) => s.playing);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const volume = usePlayerStore((s) => s.volume);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const [liked, setLiked] = useState({});
  const track = tracks[index];

  const toggleLike = (id) => setLiked((p) => ({ ...p, [id]: !p[id] }));

  return (
    <>
      <div id="window-header">
        <WindowControls target="music" />
        <h2>Music</h2>
        <Search className="icon" />
      </div>

      <div className="music-body">
        <aside className="music-sidebar">
          <div className="sidebar-group">
            <h3>Apple Music</h3>
            <ul>
              <li className="active">
                <Music2 /> Listen Now
              </li>
              <li>
                <Radio /> Browse
              </li>
              <li>
                <User /> Artists
              </li>
            </ul>
          </div>
          <div className="sidebar-group">
            <h3>Library</h3>
            <ul>
              <li>
                <Disc3 /> Albums
              </li>
              <li>
                <ListMusic /> Songs
              </li>
            </ul>
          </div>
        </aside>

        <main className="music-main">
          <div className="music-hero">
            <div className="hero-art">
              <div className="art-placeholder" />
            </div>
            <div className="hero-info">
              <span className="hero-tag">PLAYLIST</span>
              <h1>Midnight Coding</h1>
              <p className="hero-meta">
                Lo-fi & Synthwave • {tracks.length} songs, local library
              </p>
              <div className="hero-actions">
                <button className="btn-play" onClick={toggle}>
                  {playing ? (
                    <Pause className="size-4 mr-1.5" fill="currentColor" />
                  ) : (
                    <Play
                      className="size-4 mr-1.5 ml-0.5"
                      fill="currentColor"
                    />
                  )}
                  {playing ? "Pause" : "Play"}
                </button>
                <button className="btn-shuffle" onClick={toggleShuffle}>
                  Shuffle
                </button>
              </div>
            </div>
          </div>

          <div className="music-tracks">
            <div className="tracks-header">
              <span className="col-num">#</span>
              <span className="col-title">Title</span>
              <span className="col-album">Album</span>
              <span className="col-time">
                <Clock className="size-3.5" />
              </span>
            </div>
            <ul>
              {tracks.map((t, idx) => (
                <li
                  key={t.id}
                  className={`track-row ${idx === index ? "active" : ""}`}
                  onClick={() => playTrack(idx)}
                >
                  <span className="col-num">
                    {idx === index && playing ? (
                      <span className="eq-bars">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="col-title">
                    <span className="track-name">{t.title}</span>
                    <span className="track-artist">{t.artist}</span>
                  </span>
                  <span className="col-album">{t.album}</span>
                  <span className="col-time">
                    {t.duration}
                    <Heart
                      className="col-like size-3.5"
                      fill={liked[t.id] ? "currentColor" : "none"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(t.id);
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>

      <div className="music-player-bar">
        <div className="np-info">
          <div className="np-art">
            <div className="np-placeholder" />
          </div>
          <div className="np-text">
            <span className="np-title">{track.title}</span>
            <span className="np-artist">{track.artist}</span>
          </div>
          <Heart
            className="size-4 text-gray-400 hover:text-red-500 transition ml-auto cursor-pointer"
            fill={liked[track.id] ? "currentColor" : "none"}
            onClick={() => toggleLike(track.id)}
          />
        </div>

        <div className="np-controls">
          <div className="np-buttons">
            <button
              className={shuffle ? "active" : ""}
              onClick={toggleShuffle}
              title="Shuffle"
            >
              <Shuffle className="size-4" />
            </button>
            <button onClick={() => prev()}>
              <SkipBack className="size-5" fill="currentColor" />
            </button>
            <button className="play-btn" onClick={toggle}>
              {playing ? (
                <Pause className="size-4" fill="currentColor" />
              ) : (
                <Play className="size-4 ml-0.5" fill="currentColor" />
              )}
            </button>
            <button onClick={() => next()}>
              <SkipForward className="size-5" fill="currentColor" />
            </button>
            <button
              className={repeat !== "off" ? "active" : ""}
              onClick={cycleRepeat}
              title={`Repeat: ${repeat}`}
            >
              <Repeat className="size-4" />
            </button>
          </div>
          <div className="np-progress">
            <span className="time">{formatTime(currentTime)}</span>
            <SeekBar />
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="np-volume">
          {volume === 0 ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
          <VolumeBar />
        </div>
      </div>
    </>
  );
};

const MusicWindow = WindowWrapper(Music, "music");
export default MusicWindow;