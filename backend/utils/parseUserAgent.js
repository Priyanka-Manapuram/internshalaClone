/**
 * parseUserAgent
 * Extracts browser, OS, and device type from a User-Agent string.
 * No external dependency needed — keeps the same lightweight style as the project.
 */
function parseUserAgent(ua = "") {
  // ---------- OS ----------
  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  // ---------- Browser ----------
  let browser = "Unknown";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = "Opera";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/chrome/i.test(ua)) browser = "Chrome";

  // ---------- Device type ----------
  // "Mobile" = any phone/tablet UA; "Chrome" = desktop Chrome; "Other" = everything else
  let device = "Other";
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    device = "Mobile";
  } else if (/chrome/i.test(ua) && !/edg\//i.test(ua) && !/opr\//i.test(ua)) {
    device = "Chrome";
  }

  return { browser, os, device };
}

module.exports = { parseUserAgent };