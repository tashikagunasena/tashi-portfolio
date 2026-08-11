import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import useWindowStore from "#store/window.js";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
  Heart,
  MoreHorizontal,
  Music as MusicIcon,
} from "lucide-react";
import { useState } from "react";

const SPOTIFY_URL =
  import.meta.env.VITE_SPOTIFY_URL ??
  "https://spotify-clone-xi-one-47.vercel.app";

const sampleTracks = [
  {
    id: 1,
    title: "Midnight Dreams",
    artist: "Luna Wave",
    duration: "3:45",
    cover: "/images/music1.jpg",
  },
  {
    id: 2,
    title: "Electric Sunset",
    artist: "Neon Pulse",
    duration: "4:12",
    cover: "/images/music2.jpg",
  },
  {
    id: 3,
    title: "Ocean Breeze",
    artist: "Coastal Vibes",
    duration: "3:28",
    cover: "/images/music3.jpg",
  },
  {
    id: 4,
    title: "Urban Jungle",
    artist: "City Beats",
    duration: "3:56",
    cover: "/images/music4.jpg",
  },
];

const Music = () => {
  const { windows } = useWindowStore();
  const dark = windows.music?.isOpen ?? false; // simplified: just use window state for now
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // off, all, one

  const track = sampleTracks[currentTrack];

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () =>
    setCurrentTrack((prev) => (prev + 1) % sampleTracks.length);
  const prevTrack = () =>
    setCurrentTrack((prev) => (prev - 1 + sampleTracks.length) % sampleTracks.length);
  const toggleLike = () => setIsLiked(!isLiked);
  const toggleShuffle = () => setIsShuffled(!isShuffled);
  const cycleRepeat = () => {
    const modes = ["off", "all", "one"];
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  return (
    <>
      <div id="window-header">
        <WindowControls target="music" />

        <div className="flex items-center gap-2 ml-4">
          <MusicIcon className="icon" size={16} />
          <h2 className="text-sm font-medium text-gray-600">Music</h2>
        </div>

        <div className="flex items-center gap-3 mr-2">
          <MoreHorizontal className="icon" size={16} />
        </div>
      </div>

      <div
        className={`music-player ${dark ? "dark" : ""}`}
        style={{
          backgroundColor: dark ? "#121212" : "#fafafa",
        }}
      >
        {/* Now Playing Section */}
        <div className="now-playing">
          <div className="album-art">
            <img
              src={track.cover || "/images/music-default.jpg"}
              alt={track.title}
              onError={(e) => {
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='40'%3E♪%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          <div className="track-info">
            <h3 className="track-title">{track.title}</h3>
            <p className="track-artist">{track.artist}</p>
          </div>

          <button
            onClick={toggleLike}
            className={`like-btn ${isLiked ? "liked" : ""}`}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "35%" }}>
              <div className="progress-thumb" />
            </div>
          </div>
          <div className="time-labels">
            <span>1:18</span>
            <span>{track.duration}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="playback-controls">
          <button
            onClick={toggleShuffle}
            className={`control-btn shuffle ${isShuffled ? "active" : ""}`}
          >
            <Shuffle size={18} />
          </button>

          <button onClick={prevTrack} className="control-btn">
            <SkipBack size={22} fill="currentColor" />
          </button>

          <button onClick={togglePlay} className="control-btn play-btn">
            {isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" />
            )}
          </button>

          <button onClick={nextTrack} className="control-btn">
            <SkipForward size={22} fill="currentColor" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`control-btn repeat ${repeatMode !== "off" ? "active" : ""}`}
          >
            <Repeat size={18} />
            {repeatMode === "one" && <span className="repeat-indicator">1</span>}
          </button>
        </div>

        {/* Volume Control */}
        <div className="volume-section">
          <Volume2 size={16} />
          <div className="volume-bar">
            <div className="volume-fill" style={{ width: "70%" }} />
          </div>
        </div>

        {/* Playlist */}
        <div className="playlist">
          <h4 className="playlist-title">Up Next</h4>
          <div className="playlist-items">
            {sampleTracks.map((t, idx) => (
              <div
                key={t.id}
                className={`playlist-item ${idx === currentTrack ? "active" : ""}`}
                onClick={() => setCurrentTrack(idx)}
              >
                <img
                  src={t.cover || "/images/music-default.jpg"}
                  alt={t.title}
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='40'%3E♪%3C/text%3E%3C/svg%3E";
                  }}
                  className="playlist-cover"
                />
                <div className="playlist-track-info">
                  <p className="playlist-track-title">{t.title}</p>
                  <p className="playlist-track-artist">{t.artist}</p>
                </div>
                <span className="playlist-duration">{t.duration}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Embedded Spotify Frame (fallback/alternative) */}
        <iframe
          src={SPOTIFY_URL}
          title="Spotify Player"
          className="spotify-frame"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </>
  );
};

const MusicWindow = WindowWrapper(Music, "music");

export default MusicWindow;
