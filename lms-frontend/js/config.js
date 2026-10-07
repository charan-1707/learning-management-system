/* LearnHub deploy config — the ONLY frontend value you change per environment.
 *
 * Local dev: leave as-is (Spring Boot backend on http://localhost:8080).
 *
 * Deploy (e.g. Vercel frontend + Render backend): set this to your backend's
 * public HTTPS base URL, for example:
 *   window.LH_API_BASE = 'https://learnhub-backend.onrender.com/api';
 *
 * Rules:
 * - Must be https:// when the site itself is served over https (browsers
 *   block http API calls from https pages as mixed content).
 * - No trailing slash handling needed; it is stripped automatically.
 * - Loaded FIRST by js/boot.js and read by js/api/index.js before any other
 *   default, so a stale localhost value saved during development can never
 *   shadow it. An explicit ?api=<url> query parameter still overrides this
 *   for one-off debugging.
 */
window.LH = window.LH || {};
window.LH_API_BASE = 'http://localhost:8080/api';
