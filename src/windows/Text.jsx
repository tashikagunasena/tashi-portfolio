import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { WindowControls } from "#components/index.js";
import useWindowStore from "#store/window.js";

const TxtFile = () => {
  const { windows } = useWindowStore();
  const data = windows.txtfile.data;

  if (!data) return null;

  const { name, image, subtitle, description } = data;

  return (
    <>
      <div id="window-header">
        <WindowControls target="txtfile" />
        <h2>{name}</h2>
      </div>

      <div className="p-4 overflow-auto h-full">
        {image && (
          <img
            src={image}
            alt={name}
            className="w-full h-48 object-cover rounded mb-4"
          />
        )}

        {subtitle && <h3 className="text-lg font-semibold mb-2">{subtitle}</h3>}

        {description && Array.isArray(description) && (
          <div className="space-y-3">
            {description.map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const TxtFileWindow = WindowWrapper(TxtFile, "txtfile");

export default TxtFileWindow;
