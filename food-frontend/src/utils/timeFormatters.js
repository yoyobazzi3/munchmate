/** Converts a military-time string (e.g. "1430") to "2:30 PM". */
export const formatTime = (timeString) => {
  if (!timeString) return "";

  const hours = timeString.substring(0, 2);
  const minutes = timeString.substring(2);

  let period = "AM";
  let hour = parseInt(hours);

  if (hour >= 12) {
    period = "PM";
    if (hour > 12) hour -= 12;
  }
  if (hour === 0) hour = 12;

  return `${hour}:${minutes} ${period}`;
};
