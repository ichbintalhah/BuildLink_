import { useEffect, useState } from "react";

const getInitials = (name) => {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ChatAvatar = ({
  imageUrl,
  name,
  sizeClass = "h-10 w-10",
  textClass = "text-xs",
  frameClass = "",
  wrapperClass = "",
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  const initials = getInitials(name);
  const shouldShowImage = Boolean(imageUrl) && !hasImageError;

  if (shouldShowImage) {
    return (
      <div className={`avatar ${wrapperClass}`}>
        <div
          className={`${sizeClass} rounded-full overflow-hidden border border-base-300 bg-base-200 shadow-sm ${frameClass}`}
        >
          <img
            src={imageUrl}
            alt={`${name || "User"} avatar`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`avatar placeholder ${wrapperClass}`}>
      <div
        className={`${sizeClass} rounded-full border border-base-300 bg-base-200 text-base-content shadow-sm ${frameClass}`}
      >
        <span className={`font-semibold ${textClass}`}>{initials}</span>
      </div>
    </div>
  );
};

export default ChatAvatar;
