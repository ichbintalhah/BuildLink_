import { Hammer } from "lucide-react";

const BrandLogo = ({
  showText = true,
  iconSize = 28,
  textSize = "text-2xl",
  className = "",
  iconClassName = "text-primary",
  textClassName = "text-primary",
  strokeWidth = 2.5,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Hammer
        size={iconSize}
        strokeWidth={strokeWidth}
        className={iconClassName}
      />
      {showText && (
        <span
          className={`font-extrabold tracking-tight ${textSize} ${textClassName}`}
        >
          BuildLink
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
