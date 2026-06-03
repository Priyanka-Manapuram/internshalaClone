const { parseUserAgent } = require("../utils/parseUserAgent");

function mobileTimeRestriction(req, res, next) {
  const ua = req.headers["user-agent"] || "";
  const { device } = parseUserAgent(ua);

  if (device !== "Mobile") return next();

  const now = new Date();
  
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  const startMinutes = 10 * 60; // 10:00 AM
  const endMinutes = 13 * 60;   // 1:00 PM

  if (totalMinutes >= startMinutes && totalMinutes < endMinutes) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Mobile login is only allowed between 10:00 AM and 1:00 PM IST.",
  });
}

module.exports = { mobileTimeRestriction };