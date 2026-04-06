import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const CountdownTimer = ({
  hours,
  endTime,
  progressStartTime,
  showMilestoneJourney = false,
  label = "Time Remaining",
}) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    // Prefer absolute endTime so the timer survives reloads; fallback to hours if missing
    if (endTime) {
      const target = new Date(endTime).getTime();
      const seconds = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setTimeLeft(seconds);
    } else if (hours && hours > 0) {
      const totalSeconds = hours * 3600;
      setTimeLeft(totalSeconds);
    }
  }, [hours, endTime]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  };

  const isExpired = timeLeft === 0;
  const isLowTime = timeLeft > 0 && timeLeft < 600; // Less than 10 minutes

  const getJourneyProgress = () => {
    if (!showMilestoneJourney || !progressStartTime || !endTime) return 0;

    const start = new Date(progressStartTime).getTime();
    const end = new Date(endTime).getTime();
    const now = Date.now();

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return 0;
    }

    const progress = (now - start) / (end - start);
    return Math.max(0, Math.min(1, progress));
  };

  const journeyProgress = getJourneyProgress();
  const movingDotHue = Math.round((1 - journeyProgress) * 120); // 120 (green) -> 0 (red)
  const movingDotColor = `hsl(${movingDotHue} 85% 50%)`;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
        isExpired
          ? "bg-error/10 border-error"
          : isLowTime
            ? "bg-warning/10 border-warning"
            : "bg-info/10 border-info"
      }`}
    >
      <Clock
        size={24}
        className={`${
          isExpired ? "text-error" : isLowTime ? "text-warning" : "text-info"
        }`}
      />
      <div className="flex-1">
        <p className="text-xs uppercase font-bold opacity-70">{label}</p>

        {showMilestoneJourney && (
          <div className="relative mt-2 mb-2 h-5">
            <div className="absolute left-2 right-2 top-2 h-1 rounded-full bg-base-300" />

            <div className="absolute left-2 top-0.5 w-4 h-4 rounded-full bg-success border-2 border-base-100 shadow" />
            <div className="absolute right-2 top-0.5 w-4 h-4 rounded-full bg-error border-2 border-base-100 shadow" />

            <div
              className="absolute top-0.5 w-4 h-4 rounded-full border-2 border-base-100 shadow-lg transition-all duration-700"
              style={{
                left: `calc(0.5rem + (100% - 2rem) * ${journeyProgress})`,
                backgroundColor: movingDotColor,
              }}
            >
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: movingDotColor, opacity: 0.4 }}
              />
            </div>
          </div>
        )}

        <p
          className={`text-2xl font-bold font-mono ${
            isExpired ? "text-error" : isLowTime ? "text-warning" : "text-info"
          }`}
        >
          {timeLeft !== null ? formatTime(timeLeft) : "Loading..."}
        </p>
      </div>
      {isExpired && (
        <div className="text-xs font-bold text-error uppercase">EXPIRED</div>
      )}
    </div>
  );
};

export default CountdownTimer;
