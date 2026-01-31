import emailValidator from "email-validator";
import fs from "fs/promises";
import path from "path";
import dns from "dns/promises";
import { RateLimiterMemory } from "rate-limiter-flexible";
import useragent from "useragent";
import geoip from "geoip-lite";
import https from "https";

// Paths
const blocklistPath = path.resolve("./disposable-domains.json");

// Domains set
let disposableDomains = new Set();
const customBlocklist = new Set(["forcrack.com", "tempmail.lol"]); // You can add more

// Fetch disposable domains list from remote
async function updateDisposableDomains() {
  const url = "https://rawcdn.githack.com/disposable/disposable-email-domains/master/domains.json";

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", async () => {
        try {
          const parsed = JSON.parse(data);
          await fs.writeFile(blocklistPath, JSON.stringify(parsed, null, 2));
          console.log("Disposable domain list updated.");
          resolve();
        } catch (err) {
          console.error("Failed to fetch valid JSON for disposable domain list:", err.message);
          reject(err);
        }
      });
    }).on("error", (err) => {
      console.error("HTTPS request failed:", err.message);
      reject(err);
    });
  });
}

// Load domains into memory
async function loadDomains() {
  try {
    const data = await fs.readFile(blocklistPath, "utf-8");
    const json = JSON.parse(data);
    disposableDomains = new Set(json);
    console.log(`Loaded ${disposableDomains.size} disposable domains`);
  } catch (err) {
    console.warn("Failed to load disposable domains list:", err.message);
    disposableDomains = new Set();
  }
}

// Check file age and update only if needed
async function ensureDomainListIsFresh() {
  try {
    const stats = await fs.stat(blocklistPath);
    const age = Date.now() - stats.mtimeMs;
    const oneDay = 24 * 60 * 60 * 1000;
    if (age > oneDay) {
      await updateDisposableDomains();
    }
  } catch (err) {
    console.warn("Could not check domain list age, forcing update.");
    await updateDisposableDomains();
  }
  await loadDomains();
}

// Run once at startup
await ensureDomainListIsFresh();

// Schedule daily update
setInterval(async () => {
  try {
    await updateDisposableDomains();
    await loadDomains();
  } catch (err) {
    console.warn("Scheduled domain update failed:", err.message);
  }
}, 24 * 60 * 60 * 1000); // 24h

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 10,
  execEvenly: true,
});

// Blocked countries
const blockedCountries = new Set(["CN", "RU", "KP"]);

export const protect = async (req, options = {}) => {
  const { email } = options;
  const result = {
    denied: false,
    reason: null,
    isDenied() {
      return this.denied;
    },
    message() {
      return this.reason;
    },
  };

  // Bot detection
  const agent = useragent.parse(req.headers["user-agent"] || "");
  const isBot = agent.isBot && !["Googlebot", "Bingbot"].some(a => agent.source.includes(a));
  if (isBot) {
    result.denied = true;
    result.reason = "Bot traffic not allowed";
    return result;
  }

  // Rate limiting
  try {
    await rateLimiter.consume(req.ip);
  } catch {
    result.denied = true;
    result.reason = "Too many requests";
    return result;
  }

  // Geolocation block
  const geo = geoip.lookup(req.ip);
  if (geo && blockedCountries.has(geo.country)) {
    result.denied = true;
    result.reason = `Access from ${geo.country} is blocked`;
    return result;
  }

  // Email checks
  if (email) {
    if (!emailValidator.validate(email)) {
      result.denied = true;
      result.reason = "Invalid email address";
      return result;
    }

    const domain = email.split("@")[1].toLowerCase();

    if (disposableDomains.has(domain) || customBlocklist.has(domain)) {
      result.denied = true;
      result.reason = "Please use a valid, permanent email address.";
      return result;
    }

    try {
      const mx = await dns.resolveMx(domain);
      if (!mx || mx.length === 0) {
        result.denied = true;
        result.reason = "Email domain has no MX records";
        return result;
      }
    } catch {
      result.denied = true;
      result.reason = "Failed to resolve email domain";
      return result;
    }
  }

  return result;
};
