import { create } from "zustand";

const useControlStore = create((set) => ({
  open: false,
  wifi: true,
  bluetooth: true,
  airdrop: false,
  airplane: false,
  focus: false,
  dark: false,
  flashlight: false,
  brightness: 100,
  volume: 65,
  playing: false,
  setOpen: (open) => set({ open }),
  toggle: (key) => set((s) => ({ [key]: !s[key] })),
  setBrightness: (brightness) => set({ brightness }),
  setVolume: (volume) => set({ volume }),
}));

export default useControlStore;