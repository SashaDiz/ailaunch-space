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
  const targetTimeRef = useRef(null);

  // Helper function to get timezone offset in minutes
  const getTimezoneOffset = (timezone) => {
    const timezoneMap = {
      PST: -8 * 60, // Pacific Standard Time (UTC-8)
      PDT: -7 * 60, // Pacific Daylight Time (UTC-7)
      EST: -5 * 60, // Eastern Standard Time (UTC-5)
      EDT: -4 * 60, // Eastern Daylight Time (UTC-4)
      UTC: 0,
    };
    return timezoneMap[timezone?.toUpperCase()] || 0;
  };

  // Convert date string to proper timezone-aware timestamp
  const getTimezoneAwareTime = (dateString, timezone) => {
    if (!dateString) return null;
    
    // Parse the date string (should be ISO format from database)
    const date = new Date(dateString);
    
    // Get the timezone offset
    const tzOffset = getTimezoneOffset(timezone);
    
    // Adjust for timezone (convert to UTC)
    const adjustedDate = new Date(date.getTime() - (tzOffset * 60 * 1000));
    
    return adjustedDate.getTime();
  };

  // Calculate time remaining
  const calculateTimeLeft = () => {
    if (!targetTimeRef.current) return null;

    const now = new Date().getTime();
    const difference = targetTimeRef.current - now;

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

  // Initialize the countdown with competition data
  useEffect(() => {
    if (!competitionData) return;

    const timezone = competitionData.timezone || "PST";
    const now = new Date().getTime();
    
    // Get timezone-aware timestamps
    const startTime = getTimezoneAwareTime(competitionData.start_date, timezone);
    const endTime = getTimezoneAwareTime(competitionData.end_date, timezone);
    
    // Determine if we're before start or during competition
    if (startTime && now < startTime) {
      // Competition hasn't started yet - countdown to start
      targetTimeRef.current = startTime;
      setIsBeforeStart(true);
      setIsExpired(false);
    } else if (endTime) {
      // Competition is active or ended - countdown to end
      targetTimeRef.current = endTime;
      setIsBeforeStart(false);
      setIsExpired(now >= endTime);
    }

    // Calculate initial time
    const initial = calculateTimeLeft();
    if (initial) {
      setTimeLeft(initial);
      if (targetTimeRef.current && now >= targetTimeRef.current) {
        setIsExpired(true);
      }
    }
  }, [competitionData]);

  // Update countdown every second
  useEffect(() => {
    if (!targetTimeRef.current) return;

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
        if (newTimeLeft.totalMs <= 0) {
          setIsExpired(true);
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
