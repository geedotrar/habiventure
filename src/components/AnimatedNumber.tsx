"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 500,
  className = "",
  style,
  prefix = "",
  suffix = "",
  formatter,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isBouncing, setIsBouncing] = useState(false);
  const previousValueRef = useRef<number>(value);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = value;

    if (startValue === endValue) return;

    let bounceTimer: NodeJS.Timeout | null = null;
    if (endValue > startValue) {
      setIsBouncing(true);
      bounceTimer = setTimeout(() => setIsBouncing(false), 450);
    }

    const startTime = performance.now();

    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startValue + (endValue - startValue) * easeOut);

      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateNumber);

    return () => {
      if (bounceTimer) clearTimeout(bounceTimer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = formatter ? formatter(displayValue) : displayValue.toLocaleString();

  return (
    <span
      className={`${className} ${isBouncing ? "animate-number-bounce" : ""}`}
      style={{
        display: isBouncing ? "inline-block" : "inline",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ...style,
      }}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
