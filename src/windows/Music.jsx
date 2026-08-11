import { useState } from "react";
import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Music2, ListMusic, Heart, Clock, Search, User, Disc3, Radio, Volume2
} from "lucide-react";

const tracks = [
  { id: 1, title: "Neon Nights", artist: "Synthwave Collective", album: "Retrowave", duration: "3:42" },
  { id: 2, title: "Deep Focus", artist: "Lo-Fi Dreamers", album: "Study Beats", duration: "4:15" },
  { id: 3, title: "Midnight Code", artist: "Cyber Ambience", album: "Dev Mode", duration: "5:01" },
  { id: 4, title: "Solar Flare", artist: "Astro Beats", album: "Space Journey", duration: "3:28" },
  { id: 5, title: "Rainy Window", artist: "Chillhop Essentials", album: "Rainy Days", duration: "2:54" },
];

const Music = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const track = tracks[currentTrack];

  const handleTrackSelect = (idx) => {
    setCurrentTrack(idx);
    setIsPlaying(true);
  };

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
              <li className="active"><Music2 /> Listen Now</li>
              <li><Radio /> Browse</li>
              <li><User /> Artists</li>
            </ul>
          </div>
          <div className="sidebar-group">
            <h3>Library</h3>
            <ul>
              <li><Disc3 /> Albums</li>
              <li><ListMusic /> Songs</li>
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
              <p className="hero-meta">Lo-fi & Synthwave • 42 songs, 2 hr 14 min</p>
              <div className="hero-actions">
                <button className="btn-play" onClick={() => setIsPlaying(true)}>
                  <Play className="size-4 mr-1.5 ml-0.5" fill="currentColor" /> Play
                </button>
                <button className="btn-shuffle">Shuffle</button>
              </div>
            </div>
          </div>

          <div className="music-tracks">
            <div className="tracks-header">
              <span className="col-num">#</span>
              <span className="col-title">Title</span>
              <span className="col-album">Album</span>
              <span className="col-time"><Clock className="size-3.5" /></span>
            </div>
            <ul>
              {tracks.map((t, idx) => (
                <li
                  key={t.id}
                  className={`track-row ${idx === currentTrack ? "active" : ""}`}
                  onClick={() => handleTrackSelect(idx)}
                >
                  <span className="col-num">
                    {idx === currentTrack && isPlaying ? (
                      <span className="eq-bars">
                        <span></span><span></span><span></span>
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
                    <Heart className="col-like size-3.5" fill={idx === currentTrack && isLiked ? "currentColor" : "none"} onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }} />
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
          <Heart className="size-4 text-gray-400 hover:text-red-500 transition ml-auto cursor-pointer" fill={isLiked ? "currentColor" : "none"} />
        </div>

        <div className="np-controls">
          <div className="np-buttons">
            <button><Shuffle className="size-4" /></button>
            <button onClick={() => setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length)}>
              <SkipBack className="size-5" fill="currentColor" />
            </button>
            <button className="play-btn" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={() => setCurrentTrack((prev) => (prev + 1) % tracks.length)}>
              <SkipForward className="size-5" fill="currentColor" />
            </button>
            <button><Repeat className="size-4" /></button>
          </div>
          <div className="np-progress">
            <span className="time">1:18</span>
            <div className="bar">
              <div className="fill" style={{ width: "35%" }} />
            </div>
            <span className="time">{track.duration}</span>
          </div>
        </div>

        <div className="np-volume">
          <Volume2 className="size-4" />
          <div className="vol-bar">
            <div className="fill" style={{ width: "70%" }} />
          </div>
        </div>
      </div>
    </>
  );
};

const MusicWindow = WindowWrapper(Music, "music");
export default MusicWindow;
