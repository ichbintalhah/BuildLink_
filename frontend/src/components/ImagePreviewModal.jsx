import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const ImagePreviewModal = ({ imageUrl, alt = "Preview", onClose }) => {
  useEffect(() => {
    if (!imageUrl) return undefined;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousTouchAction = document.body.style.touchAction;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.overscrollBehavior = "contain";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.body.style.touchAction = previousTouchAction;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 sm:p-6"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="relative flex w-full max-w-6xl items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
      >
        <button
          type="button"
          className="btn btn-circle btn-sm absolute right-2 top-2 z-10 bg-base-100/90"
          onClick={onClose}
          aria-label="Close image preview"
        >
          <X size={16} />
        </button>

        <img
          src={imageUrl}
          alt={alt}
          className="max-h-[calc(100vh-5rem)] w-auto max-w-full rounded-xl border border-base-300 bg-base-100 object-contain shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ImagePreviewModal;
