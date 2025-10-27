"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function CountdownTimer({ competitionData }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const [isBeforeStart, setIsBeforeStart] = useState(false);
  const timerRef = useRef(null);

  // Simplified timestamp conversion
  const getTimeStamp = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.getTime();
  };

  // Recalculate target time on each tick
  const getTargetTime = () => {
    const now = new Date().getTime();
    const startTime = getTimeStamp(competitionData.start_date);
    const endTime = getTimeStamp(competitionData.end_date);
    
    if (startTime && now < startTime) {
      setIsBeforeStart(true);
      setIsExpired(false);
      return startTime;
    } else if (endTime) {
      setIsBeforeStart(false);
      setIsExpired(now >= endTime);
      return endTime;
    }
    return null;
  };

  // Calculate time remaining
  const calculateTimeLeft = (targetTime) => {
    if (!targetTime) return null;

    const now = new Date().getTime();
    const difference = targetTime - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      totalMs: difference,
    };
  };

  // Consolidated countdown logic
  useEffect(() => {
    if (!competitionData) return;

    // Calculate initial time
    const targetTime = getTargetTime();
    const initial = calculateTimeLeft(targetTime);
    if (initial) {
      setTimeLeft(initial);
    }

    // Update countdown every second
    const interval = setInterval(() => {
      const currentTargetTime = getTargetTime();
      const newTimeLeft = calculateTimeLeft(currentTargetTime);
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
        if (newTimeLeft.totalMs <= 0) {
          setIsExpired(true);
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [competitionData]);

  // Determine heading text
  const getHeading = () => {
    if (isExpired) {
      return "Competition ended";
    } else if (isBeforeStart) {
      return "Next launch in";
    } else {
      return "New launches in";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 bg-[#ed0d7912] rounded-2xl mb-8 gap-4 sm:gap-0">
      <div className="text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-medium mb-1 text-base-content/80">
          {getHeading()}
        </h2>
        <p className="text-sm text-base-content/60">
          Top 3 weekly products win badges and get dofollow backlinks.{" "}
          <Link href="/faq" className="link" style={{ color: '#ed0d79' }}>
            More details.
          </Link>
        </p>
      </div>
      <div
        ref={timerRef}
        className="flex justify-center items-center space-x-2 countdown-timer"
      >
        {isExpired ? (
          <div className="text-center">
            <div className="text-lg font-medium text-base-content/60">
              Competition Ended
            </div>
            <div className="text-xs text-base-content/50">
              Winners will be announced soon
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-xl font-semibold leading-none timer-digit text-[#ed0d79]">
                {String(timeLeft.days).padStart(2, "0")}
              </div>
              <div className="text-xs text-base-content/60">days</div>
            </div>
            <span className="text-xl font-semibold text-base-content/40">
              :
            </span>
            <div className="text-center">
              <div className="text-xl font-semibold leading-none timer-digit text-[#ed0d79]">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <div className="text-xs text-base-content/60">hours</div>
            </div>
            <span className="text-xl font-semibold text-base-content/40">
              :
            </span>
            <div className="text-center">
              <div className="text-xl font-semibold leading-none timer-digit text-[#ed0d79]">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="text-xs text-base-content/60">mins</div>
            </div>
            <span className="text-xl font-semibold text-base-content/40">
              :
            </span>
            <div className="text-center">
              <div className="text-xl font-semibold leading-none timer-digit text-[#ed0d79]">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <div className="text-xs text-base-content/60">secs</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
