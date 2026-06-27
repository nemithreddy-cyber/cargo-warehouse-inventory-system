import { useState, useEffect } from 'react';

/**
 * A custom hook to count up to a number.
 * Supports values with prefix/suffix (e.g. "+18.4%", "12.3t", "12 items").
 * Respects prefers-reduced-motion automatically.
 *
 * @param {string|number} endValue The final value to count up to.
 * @param {number} duration The duration of the animation in milliseconds.
 */
export default function useCountUp(endValue, duration = 1200) {
  const strVal = String(endValue !== undefined && endValue !== null ? endValue : '0');
  
  // Regex to extract optional sign, numeric part, and suffix
  const match = strVal.match(/([-+]?)([0-9]*\.?[0-9]+)/);
  const sign = match ? match[1] : '';
  const numericVal = match ? parseFloat(match[2]) : 0;
  const prefix = strVal.substring(0, match ? match.index : 0);
  const suffix = match ? strVal.substring(match.index + match[0].length) : '';
  const decimalPlaces = (match && match[2].includes('.')) ? match[2].split('.')[1].length : 0;

  const [count, setCount] = useState(0);

  useEffect(() => {
    // If user prefers reduced motion, don't animate, just set to final value
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(numericVal);
      return;
    }

    let startTimestamp = null;
    let cancelled = false;

    const step = (timestamp) => {
      if (cancelled) return;
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Cubic easeOut transition
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentCount = easeProgress * numericVal;
      setCount(currentCount);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(numericVal);
      }
    };

    window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
    };
  }, [numericVal, duration]);

  // Format count back into string
  const formattedCount = count.toFixed(decimalPlaces);
  return `${prefix}${sign}${formattedCount}${suffix}`;
}
