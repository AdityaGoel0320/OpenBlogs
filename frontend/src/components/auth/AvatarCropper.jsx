import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiMinus, FiPlus, FiX } from "react-icons/fi";

const OUTPUT_SIZE = 512;

function clampOffset(offset, frameSize, imageWidth, imageHeight) {
  return {
    x: Math.max(
      -(imageWidth - frameSize) / 2,
      Math.min((imageWidth - frameSize) / 2, offset.x)
    ),
    y: Math.max(
      -(imageHeight - frameSize) / 2,
      Math.min((imageHeight - frameSize) / 2, offset.y)
    ),
  };
}

function AvatarCropper({ file, onCancel, onApply }) {
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [imageUrl, setImageUrl] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImageLoad = (event) => {
    const stageSize = stageRef.current?.getBoundingClientRect().width;
    if (!stageSize) {
      setError("The crop area couldn't be opened. Please choose the image again.");
      return;
    }

    const { naturalWidth, naturalHeight } = event.currentTarget;
    const baseScale = Math.max(stageSize / naturalWidth, stageSize / naturalHeight);
    setMetrics({
      stageSize,
      baseScale,
      naturalWidth,
      naturalHeight,
    });
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setError("");
  };

  const renderedWidth = metrics ? metrics.naturalWidth * metrics.baseScale * zoom : 0;
  const renderedHeight = metrics ? metrics.naturalHeight * metrics.baseScale * zoom : 0;

  const handlePointerDown = (event) => {
    if (!metrics || isSaving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || !metrics) return;
    setOffset(
      clampOffset(
        {
          x: dragRef.current.offsetX + event.clientX - dragRef.current.pointerX,
          y: dragRef.current.offsetY + event.clientY - dragRef.current.pointerY,
        },
        metrics.stageSize,
        renderedWidth,
        renderedHeight
      )
    );
  };

  const finishDragging = () => {
    dragRef.current = null;
  };

  const handleZoomChange = (event) => {
    const nextZoom = Number(event.target.value);
    setZoom(nextZoom);
    if (metrics) {
      setOffset((current) =>
        clampOffset(
          current,
          metrics.stageSize,
          metrics.naturalWidth * metrics.baseScale * nextZoom,
          metrics.naturalHeight * metrics.baseScale * nextZoom
        )
      );
    }
  };

  const handleApply = () => {
    const image = imageRef.current;
    if (!image || !metrics || isSaving) {
      setError("Wait for your photo to finish loading, then try again.");
      return;
    }

    setIsSaving(true);
    setError("");
    const scale = metrics.baseScale * zoom;
    const imageLeft = (metrics.stageSize - renderedWidth) / 2 + offset.x;
    const imageTop = (metrics.stageSize - renderedHeight) / 2 + offset.y;
    const sourceX = (0 - imageLeft) / scale;
    const sourceY = (0 - imageTop) / scale;
    const sourceSize = metrics.stageSize / scale;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");

    if (!context) {
      setIsSaving(false);
      setError("Your browser couldn't prepare this photo. Try a different image.");
      return;
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setIsSaving(false);
          setError("Your browser couldn't prepare this photo. Try a different image.");
          return;
        }

        onApply(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSaving) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onCancel]);

  return (
    <div
      className="avatar-crop-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onCancel();
      }}
    >
      <section
        className="avatar-crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
      >
        <div className="avatar-crop-heading">
          <div>
            <span className="section-kicker">Make it yours</span>
            <h2 id="avatar-crop-title">Crop your photo</h2>
          </div>
          <button
            type="button"
            className="auth-icon-button"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="Cancel photo crop"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <p className="avatar-crop-help">Drag to reposition. Use the slider to zoom in or out.</p>
        <div
          ref={stageRef}
          className="avatar-crop-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDragging}
          onPointerCancel={finishDragging}
          onLostPointerCapture={finishDragging}
          role="img"
          aria-label="Drag the photo to choose which part appears in your avatar"
        >
          {imageUrl && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt=""
              draggable="false"
              onLoad={handleImageLoad}
              onError={() => setError("We couldn't read this photo. Please choose another one.")}
              style={{
                width: `${renderedWidth}px`,
                height: `${renderedHeight}px`,
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
          {!metrics && <span className="auth-spinner" aria-label="Loading photo" />}
          <div className="avatar-crop-window" aria-hidden="true" />
        </div>
        <label className="avatar-zoom-control">
          <FiMinus aria-hidden="true" />
          <span className="sr-only">Zoom photo</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={handleZoomChange}
            disabled={!metrics || isSaving}
          />
          <FiPlus aria-hidden="true" />
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="avatar-crop-actions">
          <button
            type="button"
            className="auth-secondary-button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="auth-primary-button"
            onClick={handleApply}
            disabled={!metrics || isSaving}
          >
            {isSaving ? <><span className="auth-spinner" /> Preparing photo...</> : "Use this photo"}
          </button>
        </div>
      </section>
    </div>
  );
}

AvatarCropper.propTypes = {
  file: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default AvatarCropper;
