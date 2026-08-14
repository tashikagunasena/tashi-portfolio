import useWindowStore from "#store/window.js";

const WindowControls = ({ target }) => {
  const { closeWindow, minimizeWindow, toggleMaximize } = useWindowStore();

  return (
    <div id="window-controls">
      <div
        className="close"
        title="Close"
        onClick={() => closeWindow(target)}
      />
      <div
        className="minimize"
        title="Minimize"
        onClick={() => minimizeWindow(target)}
      />
      <div
        className="maximize"
        title="Zoom"
        onClick={() => toggleMaximize(target)}
      />
    </div>
  );
};

export default WindowControls;
