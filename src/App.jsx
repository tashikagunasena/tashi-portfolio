import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

import { Dock, Navbar, Welcome, Home, MobileDock } from "#components";
import {
  Finder,
  Resume,
  Music,
  Terminal,
  TxtFile,
  ImgFile,
  Contact,
  Photos,
} from "#windows";

gsap.registerPlugin(Draggable);

const App = () => {
  return (
    <main>
      <Navbar />
      <Welcome />
      <Dock />
      <MobileDock />
      <Terminal />
      <Music />
      <Resume />
      <Finder />
      <TxtFile />
      <ImgFile />
      <Contact />
      <Photos />
      <Home />
    </main>
  );
};

export default App;
