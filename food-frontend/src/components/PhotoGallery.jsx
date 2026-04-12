import { useState } from "react";

const PhotoGallery = ({ photos }) => {
  const [activePhoto, setActivePhoto] = useState(0);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="photo-gallery">
      <div className="main-photo" style={{ backgroundImage: `url(${photos[activePhoto]})` }}>
        {photos.length > 1 && (
          <>
            <button
              className="photo-nav prev"
              onClick={() => setActivePhoto((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              className="photo-nav next"
              onClick={() => setActivePhoto((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="photo-thumbnails">
          {photos.map((photo, i) => (
            <div
              key={i}
              className={`thumbnail ${i === activePhoto ? "active" : ""}`}
              style={{ backgroundImage: `url(${photo})` }}
              onClick={() => setActivePhoto(i)}
              aria-label={`Photo ${i + 1} of ${photos.length}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
