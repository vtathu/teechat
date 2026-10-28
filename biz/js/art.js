const AWNING_A = '#f7b6bd';
const AWNING_B = '#fff2ea';

function awningStripes() {
  const n = 12;
  const x0 = 36;
  const w = 328;
  const seg = w / n;
  let out = '';
  for (let i = 0; i < n; i += 1) {
    out += `<rect x="${(x0 + i * seg).toFixed(2)}" y="92" width="${(seg + 0.5).toFixed(2)}" height="46" fill="${i % 2 ? AWNING_B : AWNING_A}"/>`;
  }
  return out;
}

function awningScallops() {
  const n = 12;
  const x0 = 36;
  const w = 328;
  const seg = w / n;
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const cx = x0 + seg / 2 + i * seg;
    out += `<circle cx="${cx.toFixed(2)}" cy="138" r="${(seg / 2 + 0.2).toFixed(2)}" fill="${i % 2 ? AWNING_B : AWNING_A}"/>`;
    out += `<circle cx="${cx.toFixed(2)}" cy="140.5" r="${(seg / 2 - 1).toFixed(2)}" fill="rgba(0,0,0,.05)"/>`;
  }
  return out;
}

function chiliInner() {
  return `
    <ellipse cx="60" cy="130" rx="30" ry="5" fill="#000" opacity=".16"/>
    <path d="M56 40c-6-12-16-16-26-18 5 9 10 15 16 20-8 0-14 2-19 5 9 3 18 4 27 2z" fill="#5aa84a"/>
    <path d="M58 39c-2-13-1-21 4-29 5 9 6 17 3 27z" fill="#69b957"/>
    <path d="M60 38C36 38 22 58 23 82c1 24 18 42 38 42 21 0 38-18 39-42 1-24-13-44-40-44z" fill="#e8563f"/>
    <path d="M28 78c2-18 13-30 28-34-13 8-19 20-20 35-1 10 1 20 6 29-10-7-15-18-14-30z" fill="#f47a63" opacity=".75"/>
    <path d="M60 38C36 38 22 58 23 82c1 24 18 42 38 42 21 0 38-18 39-42 1-24-13-44-40-44z" fill="none" stroke="#c93f2c" stroke-width="2.4"/>
    <ellipse cx="47" cy="76" rx="6" ry="7" fill="#3a1a18"/>
    <ellipse cx="74" cy="76" rx="6" ry="7" fill="#3a1a18"/>
    <circle cx="49" cy="73.5" r="2.1" fill="#fff"/>
    <circle cx="76" cy="73.5" r="2.1" fill="#fff"/>
    <ellipse cx="35" cy="92" rx="7" ry="4.5" fill="#ff9d8c" opacity=".65"/>
    <ellipse cx="85" cy="92" rx="7" ry="4.5" fill="#ff9d8c" opacity=".65"/>
    <path d="M53 94c3 6 11 7 15 1" stroke="#3a1a18" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M24 84c-7-1-12-5-14-11" stroke="#c93f2c" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M98 84c7-1 12-5 14-11" stroke="#c93f2c" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M44 120c-2 6-1 8 2 9" stroke="#c93f2c" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M76 120c2 6 1 8-2 9" stroke="#c93f2c" stroke-width="4" stroke-linecap="round" fill="none"/>
  `;
}

export function chiliSVG(className = 'chili-art') {
  return `<svg class="${className}" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${chiliInner()}</svg>`;
}

export function shopSVG() {
  return `
  <svg class="shop-art" viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tiệm mì cay nhỏ với mái hiên sọc hồng và đèn lồng đỏ">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f8b3bb"/>
        <stop offset="1" stop-color="#ee97a2"/>
      </linearGradient>
      <linearGradient id="innerGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5a2b2c"/>
        <stop offset="1" stop-color="#8c4a3f"/>
      </linearGradient>
      <linearGradient id="doorGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d6a271"/>
        <stop offset="1" stop-color="#c1854f"/>
      </linearGradient>
      <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ffdca6" stop-opacity=".95"/>
        <stop offset="1" stop-color="#ffdca6" stop-opacity="0"/>
      </radialGradient>
      <clipPath id="awningClip">
        <rect x="36" y="90" width="328" height="48" rx="8"/>
      </clipPath>
      <clipPath id="windowClip">
        <rect x="66" y="150" width="200" height="104" rx="10"/>
      </clipPath>
    </defs>

    <ellipse cx="200" cy="344" rx="172" ry="12" fill="#3a1420" opacity=".35"/>

    <rect x="44" y="104" width="312" height="236" rx="20" fill="#c98b5a"/>
    <rect x="50" y="110" width="300" height="224" rx="16" fill="#b87a4c"/>
    <rect x="54" y="114" width="292" height="216" rx="13" fill="url(#wallGrad)"/>

    <!-- window opening -->
    <rect x="64" y="148" width="204" height="108" rx="12" fill="#a8693f"/>
    <g clip-path="url(#windowClip)">
      <rect x="66" y="150" width="200" height="104" fill="url(#innerGrad)"/>
      <ellipse cx="150" cy="176" rx="70" ry="34" fill="#ffcf8a" opacity=".18"/>
      <rect x="76" y="196" width="180" height="7" rx="3.5" fill="#c98b5a"/>
      <rect x="86" y="176" width="16" height="20" rx="4" fill="#e9d3b4"/>
      <rect x="108" y="180" width="12" height="16" rx="3" fill="#d9b98f"/>
      <path d="M228 176c-8 0-13 5-13 12s12 12 13 12 13-5 13-12-5-12-13-12z" fill="#f0a05a" opacity=".8"/>
      <path d="M212 174c0-8 5-14 12-14" stroke="#f0a05a" stroke-width="3" fill="none" opacity=".7"/>
      <g transform="translate(150,166)">
        <path d="M0 -18v10" stroke="#e6c9a4" stroke-width="3"/>
        <path d="M-13 4c0-6 10-6 10 0z" fill="#f7d9a8"/>
        <path d="M-16 4h32l-6 12h-20z" fill="#f2b06a"/>
        <circle cx="0" cy="6" r="26" fill="url(#lampGlow)"/>
      </g>
      <path d="M66 168c26 10 54 10 82 0 28-10 60-10 86 0 12 4 22 5 32 4" stroke="#52302a" stroke-width="2" fill="none" opacity=".5"/>
      <g fill="#ffdf9e">
        <circle cx="96" cy="176" r="3.4"/><circle cx="126" cy="180" r="3.4"/><circle cx="158" cy="177" r="3.4"/>
        <circle cx="190" cy="175" r="3.4"/><circle cx="220" cy="179" r="3.4"/><circle cx="248" cy="181" r="3.4"/>
      </g>
    </g>
    <rect x="64" y="148" width="204" height="108" rx="12" fill="none" stroke="#a8693f" stroke-width="6"/>

    <!-- awning -->
    <g clip-path="url(#awningClip)">${awningStripes()}</g>
    ${awningScallops()}
    <rect x="30" y="84" width="340" height="12" rx="6" fill="#b87a4c"/>
    <rect x="30" y="84" width="340" height="5" rx="2.5" fill="#d6a271"/>

    <!-- lanterns -->
    <g transform="translate(52,128)">
      <path d="M0 -26v14" stroke="#8a5a34" stroke-width="2.5"/>
      <rect x="-7" y="-14" width="14" height="6" rx="2" fill="#f2c14e"/>
      <ellipse cx="0" cy="4" rx="19" ry="22" fill="#e8563f"/>
      <ellipse cx="0" cy="4" rx="19" ry="22" fill="none" stroke="#c33d2c" stroke-width="2"/>
      <path d="M-19 4h38" stroke="#c33d2c" stroke-width="1.6" opacity=".55"/>
      <rect x="-7" y="24" width="14" height="6" rx="2" fill="#f2c14e"/>
      <path d="M0 30v9" stroke="#e8563f" stroke-width="3"/>
      <circle cx="0" cy="42" r="3.6" fill="#f2c14e"/>
    </g>
    <g transform="translate(352,128)">
      <path d="M0 -26v14" stroke="#8a5a34" stroke-width="2.5"/>
      <rect x="-7" y="-14" width="14" height="6" rx="2" fill="#f2c14e"/>
      <ellipse cx="0" cy="4" rx="19" ry="22" fill="#e8563f"/>
      <ellipse cx="0" cy="4" rx="19" ry="22" fill="none" stroke="#c33d2c" stroke-width="2"/>
      <path d="M-19 4h38" stroke="#c33d2c" stroke-width="1.6" opacity=".55"/>
      <rect x="-7" y="24" width="14" height="6" rx="2" fill="#f2c14e"/>
      <path d="M0 30v9" stroke="#e8563f" stroke-width="3"/>
      <circle cx="0" cy="42" r="3.6" fill="#f2c14e"/>
    </g>

    <!-- door -->
    <path d="M284 326V208a30 30 0 0 1 60 0v118z" fill="#b87a4c"/>
    <path d="M290 326V211a24 24 0 0 1 48 0v115z" fill="url(#doorGrad)"/>
    <path d="M298 322V216a16 16 0 0 1 32 0v106z" fill="#ffdf9e"/>
    <path d="M298 322V216a16 16 0 0 1 32 0v106z" fill="none" stroke="#a8693f" stroke-width="3"/>
    <path d="M314 200v122M298 258h32" stroke="#a8693f" stroke-width="3"/>
    <circle cx="303" cy="274" r="3.2" fill="#7b4a2a"/>

    <!-- counter front -->
    <rect x="60" y="252" width="212" height="14" rx="7" fill="#b87a4c"/>
    <rect x="60" y="252" width="212" height="5" rx="2.5" fill="#d6a271"/>
    <rect x="66" y="266" width="200" height="56" rx="8" fill="#f19aa2"/>
    <g fill="#e8868f">
      <rect x="76" y="266" width="9" height="56"/>
      <rect x="96" y="266" width="9" height="56"/>
      <rect x="116" y="266" width="9" height="56"/>
      <rect x="136" y="266" width="9" height="56"/>
      <rect x="156" y="266" width="9" height="56"/>
      <rect x="176" y="266" width="9" height="56"/>
      <rect x="196" y="266" width="9" height="56"/>
      <rect x="216" y="266" width="9" height="56"/>
      <rect x="236" y="266" width="9" height="56"/>
    </g>

    <!-- big bowl -->
    <g class="bowl-art-svg">
      <ellipse cx="166" cy="258" rx="52" ry="7" fill="#000" opacity=".18"/>
      <path d="M114 222c2 26 24 36 52 36s50-10 52-36z" fill="#4b1c24"/>
      <path d="M114 222c2 26 24 36 52 36s50-10 52-36z" fill="none" stroke="#33131a" stroke-width="3"/>
      <ellipse cx="166" cy="222" rx="52" ry="13" fill="#e8563f"/>
      <ellipse cx="166" cy="222" rx="44" ry="9.5" fill="#f5a45c"/>
      <ellipse cx="166" cy="223" rx="41" ry="7.5" fill="#f7b26a"/>
      <path d="M132 220c10-4 20-2 27 2 8 4 15 5 24 0 7-4 15-4 22-1" stroke="#f9d78d" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M136 226c9-4 18-2 25 2 7 3 14 3 20-1 8-5 17-4 25 0" stroke="#f9c977" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="188" cy="216" rx="11" ry="8" fill="#fff6e6"/>
      <circle cx="188" cy="216" r="5" fill="#f5a623"/>
      <path d="M141 216c6-4 13-4 18 0-5 5-13 5-18 0z" fill="#5aa84a"/>
      <path d="M150 221c4-3 9-3 12 1-4 3-9 3-12-1z" fill="#79c05e"/>
      <path d="M124 236c14 6 30 9 42 9" stroke="#f08a71" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>
      <path d="M154 250h24v3a12 12 0 0 1-24 0z" fill="#33131a" opacity=".45"/>
      <g class="steam">
        <path class="steam-line s1" d="M148 206c-9-12 7-19 1-32" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".6"/>
        <path class="steam-line s2" d="M166 202c-8-13 8-21 2-36" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".5"/>
        <path class="steam-line s3" d="M186 206c-8-12 7-19 1-31" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".55"/>
      </g>
    </g>

    <!-- plant left -->
    <g transform="translate(72,286)">
      <ellipse cx="0" cy="42" rx="24" ry="5" fill="#000" opacity=".14"/>
      <path d="M-18 18h36l-4 24h-28z" fill="#d97b6a"/>
      <rect x="-20" y="14" width="40" height="8" rx="4" fill="#e8857a"/>
      <path d="M0 14C0 2-10-4-18-8c2 10 8 16 16 20z" fill="#5aa84a"/>
      <path d="M0 14C0 2 10-4 18-8c-2 10-8 16-16 20z" fill="#69b957"/>
      <path d="M0 16C-2 4 2-6 8-12c1 10-2 18-8 28z" fill="#4e9a42"/>
    </g>

    <!-- plant right -->
    <g transform="translate(346,300)">
      <ellipse cx="0" cy="34" rx="20" ry="4" fill="#000" opacity=".14"/>
      <path d="M-15 12h30l-4 20h-22z" fill="#c96f5f"/>
      <rect x="-17" y="8" width="34" height="7" rx="3.5" fill="#db7f6e"/>
      <path d="M0 8C-2-4 4-14 12-20c-1 12-4 22-12 30z" fill="#5aa84a"/>
      <path d="M0 8C2-2-6-10-14-14c1 10 6 18 14 24z" fill="#78c161"/>
    </g>

    <!-- cat -->
    <g transform="translate(262,312)">
      <ellipse cx="0" cy="16" rx="30" ry="5" fill="#000" opacity=".16"/>
      <ellipse cx="0" cy="0" rx="28" ry="15" fill="#f2b06a"/>
      <path d="M-18-6c6 3 12 3 18 0M6-8c5 3 11 3 16 0" stroke="#dc9450" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="20" cy="-7" r="13" fill="#f7c188"/>
      <path d="M11-16l-3-9 8 5z" fill="#f7c188"/>
      <path d="M27-17l4-8 4 7z" fill="#f7c188"/>
      <path d="M14-8c1.5 2 4 2 5.5 0M24-8c1.5 2 4 2 5.5 0" stroke="#7b4a2a" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M22-3l2 2 2-2" stroke="#e8857a" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M-26 4c-10 2-14-2-12-8" stroke="#dc9450" stroke-width="6" stroke-linecap="round" fill="none"/>
    </g>

    <!-- chili mascot -->
    <g transform="translate(6,236) scale(0.62)">${chiliInner()}</g>
  </svg>`;
}
