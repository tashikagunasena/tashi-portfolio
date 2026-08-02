import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { photosLinks, gallery } from "#constants/index.js";
import useWindowStore from "#store/window.js";
import clsx from "clsx";

const Photos = () => {
  const { openWindow } = useWindowStore();

  const handleImageClick = (image) => {
    openWindow("imgfile", {
      name: image.img.split("/").pop(),
      imageUrl: image.img,
    });
  };

  return (
    <>
      <div id="window-header">
        <WindowControls target="photos" />
      </div>

      <div className="bg-white flex h-full">
        <div className="sidebar">
          <ul>
            {photosLinks.map(({ id, icon, title }) => (
              <li key={id} className={clsx(id === 1 ? "active" : "")}>
                <img src={icon} alt={title} />
                <p>{title}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="gallery">
          <ul>
            {gallery.map((image) => (
              <li key={image.id} onClick={() => handleImageClick(image)}>
                <img src={image.img} alt={`Gallery image ${image.id}`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

const PhotosWindow = WindowWrapper(Photos, "photos");

export default PhotosWindow;
