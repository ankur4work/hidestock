/**
 * HeroBanner — branded gradient header for the HideStock dashboard.
 * Presentational only; reflects the currently saved status.
 */
export function HeroBanner({ enabled, embedEnabled, shop }) {
  return (
    <>
      <style>{HERO_CSS}</style>
      <div className="hs-hero">
        <div className="hs-hero__glow" aria-hidden="true" />
        <div className="hs-hero__content">
          <div className="hs-hero__brand">
            <div className="hs-hero__logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="2" />
                <path d="M4 20 20 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="hs-hero__name">HideStock</div>
              <div className="hs-hero__tagline">
                Hide prices automatically when products sell out
              </div>
            </div>
          </div>

          <div className="hs-hero__chips">
            <span className={`hs-chip ${enabled ? "hs-chip--on" : "hs-chip--off"}`}>
              <span className="hs-chip__dot" />
              {enabled ? "App enabled" : "App disabled"}
            </span>
            <span
              className={`hs-chip ${embedEnabled ? "hs-chip--on" : "hs-chip--warn"}`}
            >
              <span className="hs-chip__dot" />
              {embedEnabled ? "Storefront active" : "Embed not enabled"}
            </span>
          </div>
        </div>
        {shop && <div className="hs-hero__shop">{shop}</div>}
      </div>
    </>
  );
}

const HERO_CSS = `
.hs-hero {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 28px 28px 26px;
  background: linear-gradient(125deg, #1f1147 0%, #3b1d8f 45%, #7b2ff7 100%);
  color: #fff;
  box-shadow: 0 18px 40px -22px rgba(67, 24, 173, 0.85);
}
.hs-hero__glow {
  position: absolute;
  top: -60%;
  right: -10%;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(255,255,255,0.22), transparent 60%);
  pointer-events: none;
}
.hs-hero__content {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
}
.hs-hero__brand { display: flex; align-items: center; gap: 16px; }
.hs-hero__logo {
  width: 46px; height: 46px;
  display: grid; place-items: center;
  border-radius: 13px;
  background: rgba(255,255,255,0.16);
  backdrop-filter: blur(6px);
}
.hs-hero__logo svg { width: 24px; height: 24px; fill: #fff; }
.hs-hero__name { font-size: 22px; font-weight: 750; letter-spacing: -0.3px; line-height: 1.1; }
.hs-hero__tagline { font-size: 13px; opacity: 0.82; margin-top: 3px; }
.hs-hero__chips { display: flex; flex-wrap: wrap; gap: 10px; }
.hs-chip {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 13px; border-radius: 999px;
  font-size: 12.5px; font-weight: 600;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
}
.hs-chip__dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.hs-chip--on { color: #6ef0b6; }
.hs-chip--off { color: #ffd1d1; }
.hs-chip--warn { color: #ffe08a; }
.hs-hero__shop {
  position: relative;
  margin-top: 16px;
  font-size: 12px;
  opacity: 0.7;
  letter-spacing: 0.2px;
}
`;

export default HeroBanner;
