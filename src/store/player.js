import { create } from "zustand";

/* ✏️ Your real library — edit titles/artists freely.
   ⚠️ "Hell In Heaven" was truncated in your explorer screenshot;
   if that one 404s, match `src` to the exact filename on disk. */
const TRACKS = [
  {
    id: 1,
    title: "Hell In Heaven",
    artist: "Local Library",
    album: "My Mix",
    src: "/music/Hell In Heaven.opus",
  },
  {
    id: 2,
    title: "Hwaa",
    artist: "Local Library",
    album: "My Mix",
    src: "/music/Hwaa.opus",
  },
  {
    id: 3,
    title: "memM",
    artist: "Local Library",
    album: "My Mix",
    src: "/music/memM.opus",
  },
  {
    id: 4,
    title: "Vengeance",
    artist: "Local Library",
    album: "My Mix",
    src: "/music/Vengeance.opus",
  },
  {
    id: 5,
    title: "Wife",
    artist: "Local Library",
    album: "My Mix",
    src: "/music/Wife.opus",
  },
];

/* One shared Audio element for the whole app — this is what makes
   the Music window and the Control Center stay in sync for free. */
const canPlay = typeof window !== "undefined" && typeof Audio !== "undefined";
const AUDIO = canPlay ? new Audio() : null;
if (AUDIO) AUDIO.preload = "metadata";

export const formatTime = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
};

const usePlayerStore = create((set, get) => ({
  tracks: TRACKS,
  index: 0,
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 65,
  shuffle: false,
  repeat: "off", // off -> all -> one

  loadTrack: (i, autoplay = false) => {
    if (!AUDIO) return;
    const t = get().tracks[i];
    if (!t) return;
    AUDIO.src = encodeURI(t.src);
    AUDIO.load();
    set({ index: i, currentTime: 0, duration: 0 });
    if (autoplay) AUDIO.play().catch(() => set({ playing: false }));
  },

  /* clicking the already-active track = play/pause */
  playTrack: (i) => {
    if (i === get().index) return get().toggle();
    get().loadTrack(i, true);
  },

  toggle: () => {
    if (!AUDIO) return;
    if (!AUDIO.src) return get().loadTrack(get().index, true);
    if (AUDIO.paused) AUDIO.play().catch(() => set({ playing: false }));
    else AUDIO.pause();
  },

  next: (auto = false) => {
    const { tracks, index, shuffle, repeat } = get();
    if (auto && repeat === "one") {
      AUDIO.currentTime = 0;
      AUDIO.play().catch(() => {});
      return;
    }
    let i;
    if (shuffle && tracks.length > 1) {
      do i = Math.floor(Math.random() * tracks.length);
      while (i === index);
    } else {
      i = index + 1;
      if (i >= tracks.length) {
        if (auto && repeat === "off") return get().loadTrack(0, false); // stop at end
        i = 0;
      }
    }
    get().loadTrack(i, true);
  },

  prev: () => {
    const { index, tracks, currentTime } = get();
    // >3s in (or single track) = restart, like every real player
    if (currentTime > 3 || tracks.length === 1) {
      if (AUDIO) AUDIO.currentTime = 0;
      return;
    }
    get().loadTrack((index - 1 + tracks.length) % tracks.length, true);
  },

  seek: (t) => {
    if (AUDIO && Number.isFinite(t)) AUDIO.currentTime = t;
  },

  setVolume: (v) => {
    const clamped = Math.min(Math.max(v, 0), 100);
    if (AUDIO) AUDIO.volume = clamped / 100;
    set({ volume: clamped });
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    })),
}));

/* wire the element -> store once, at module scope */
if (AUDIO) {
  AUDIO.volume = usePlayerStore.getState().volume / 100;
  AUDIO.src = encodeURI(TRACKS[0].src);

  AUDIO.addEventListener("play", () =>
    usePlayerStore.setState({ playing: true }),
  );
  AUDIO.addEventListener("pause", () =>
    usePlayerStore.setState({ playing: false }),
  );
  AUDIO.addEventListener("timeupdate", () =>
    usePlayerStore.setState({ currentTime: AUDIO.currentTime }),
  );
  AUDIO.addEventListener("loadedmetadata", () =>
    usePlayerStore.setState({ duration: AUDIO.duration || 0 }),
  );
  AUDIO.addEventListener("ended", () => usePlayerStore.getState().next(true));
}

export default usePlayerStore;