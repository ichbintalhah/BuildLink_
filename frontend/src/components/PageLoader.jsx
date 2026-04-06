import { useEffect, useState } from "react";
import "./PageLoader.css";

const PageLoader = ({ isLoading = false, message = "Loading..." }) => {
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div className={`page-loader-overlay ${isLoading ? "visible" : "hidden"}`}>
      <div className="page-loader-container">
        {/* Hammer Breaking Rock Animation */}
        <div className="hammer-scene">
          {/* HAMMER */}
          <div className="hammer">
            <div className="hammer-head"></div>
            <div className="hammer-handle"></div>
          </div>

          {/* MOUNTAIN/ROCK */}
          <div className="rock-container">
            <div className="rock">
              <div className="rock-cracks">
                <div className="crack crack-1"></div>
                <div className="crack crack-2"></div>
                <div className="crack crack-3"></div>
              </div>
            </div>
          </div>

          {/* SCATTERED ROCK PIECES */}
          <div className="rock-pieces">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`piece piece-${i}`}></div>
            ))}
          </div>

          {/* IMPACT DUST */}
          <div className="impact-dust">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="dust-particle"></div>
            ))}
          </div>
        </div>

        {/* Loading message */}
        <p className="loader-message">{message}</p>

        {/* Animated dots */}
        <div className="loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
