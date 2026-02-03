import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const CountdownTimer = ({ hours, endTime, label = "Time Remaining" }) => {
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
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const isExpired = timeLeft === 0;
  const isLowTime = timeLeft > 0 && timeLeft < 600; // Less than 10 minutes

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
