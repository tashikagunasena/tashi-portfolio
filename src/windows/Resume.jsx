import { useEffect, useRef, useState } from "react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { WindowControls } from "#components/index.js";
import { Download, FileWarning } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import useWindowStore from "#store/window";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MOBILE_QUERY = "(max-width: 640px)";

/* One PDF viewer for every pdf in the Finder — resume AND certifications.
   Which file it shows comes from the window's `data`. */
const Resume = () => {
  const { windows } = useWindowStore();
  const data = windows?.resume?.data;

  const fileSrc = data?.href || "files/resume.pdf";
  const fileName = data?.name || "Resume.pdf";

  return (
    <>
      <div id="window-header">
        <WindowControls target="resume" />
        <h2>{fileName}</h2>
        <a
          href={fileSrc}
          download
          className="resume-download"
          title={`Download ${fileName}`}
        >
          <Download className="size-4" />
          <span>Save</span>
        </a>
      </div>

      {/* key = file path: switching PDFs remounts the sheet, resetting
          loading / error / sizing state with no effects needed */}
      <PdfSheet key={fileSrc} fileSrc={fileSrc} fileName={fileName} />
    </>
  );
};

const PdfSheet = ({ fileSrc, fileName }) => {
  const bodyRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches,
  );
  const [pageWidth, setPageWidth] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const w =
        el.clientWidth -
        parseFloat(cs.paddingLeft || "0") -
        parseFloat(cs.paddingRight || "0");
      const next = Math.max(0, Math.floor(w));
      setPageWidth((prev) => (prev !== next ? next : prev));
    };
    const raf = requestAnimationFrame(measure);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [isMobile]);

  const loaded = numPages != null;
  const showSkeleton = !errored && (!loaded || (isMobile && !pageWidth));
  const canRenderPage = !isMobile || !!pageWidth;

  return (
    <div className="resume-scroll" ref={bodyRef}>
      {showSkeleton && <ResumeSkeleton />}

      {!errored ? (
        <Document
          file={fileSrc}
          loading={null}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => setErrored(true)}
        >
          {canRenderPage && (
            <Page
              pageNumber={1}
              renderTextLayer
              renderAnnotationLayer
              loading={null}
              {...(isMobile ? { width: pageWidth } : { scale: 1 })}
            />
          )}
        </Document>
      ) : (
        <ResumeError fileSrc={fileSrc} fileName={fileName} />
      )}

      {loaded && numPages > 1 && (
        <p className="resume-pages">Showing page 1 of {numPages}</p>
      )}
    </div>
  );
};

const ResumeSkeleton = () => (
  <div className="resume-skeleton" aria-hidden="true">
    <div className="sk-line sk-w-40" />
    <div className="sk-line sk-w-72" />
    <div className="sk-line sk-w-full" />
    <div className="sk-line sk-w-full" />
    <div className="sk-line sk-w-56" />
    <div className="sk-block" />
    <div className="sk-line sk-w-full" />
    <div className="sk-line sk-w-80" />
  </div>
);

const ResumeError = ({ fileSrc, fileName }) => (
  <div className="resume-error">
    <FileWarning className="size-7" />
    <p className="title">Couldn't render the PDF</p>
    <p className="sub">The preview didn't load — grab a local copy instead.</p>
    <a href={fileSrc} download className="resume-download solid">
      <Download className="size-4" />
      <span>Download {fileName}</span>
    </a>
  </div>
);

const ResumeWindow = WindowWrapper(Resume, "resume");
export default ResumeWindow;
