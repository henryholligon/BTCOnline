interface BitcoinLogoProps {
  size?: number;  // diameter in px (drives 3D geometry)
  spin?: boolean;
}

const SEGMENTS = 14;   // cylinder edge facets — smooth enough at this scale
const THICKNESS = 3;   // coin depth in px
const EDGE_COLOR = '#c07000';   // lit side of the rim
const BACK_COLOR = '#a85c00';   // back face, darker

const BTC_PATH =
  'M22.283 14.325c.312-2.086-1.278-3.208-3.452-3.957l.705-2.827-1.72-.428-.686 2.752c-.453-.113-.918-.218-1.38-.324l.69-2.768-1.718-.428-.705 2.825c-.375-.085-.743-.17-1.1-.259v-.009l-2.371-.592-.457 1.837s1.278.293 1.25.311c.697.174.823.635.801 1.001l-.803 3.22c.048.012.11.03.178.057l-.181-.045-1.126 4.516c-.085.212-.302.53-.789.41.017.025-1.25-.312-1.25-.312l-.855 1.966 2.237.557c.416.104.824.213 1.226.316l-.712 2.858 1.718.428.705-2.829c.47.127.927.244 1.374.354l-.703 2.813 1.72.428.712-2.852c2.936.556 5.145.331 6.076-2.324.749-2.138-.037-3.371-1.582-4.176 1.125-.26 1.973-1.001 2.198-2.531zm-3.934 5.516c-.532 2.138-4.133.982-5.302.692l.946-3.79c1.168.292 4.917.868 4.356 3.098zm.533-5.543c-.485 1.948-3.48.958-4.453.716l.858-3.438c.973.243 4.109.697 3.595 2.722z';

export default function BitcoinLogo({ size = 14, spin = false }: BitcoinLogoProps) {
  const r = size / 2;
  // arc length per segment — slightly oversized to prevent gaps between facets
  const arcLen = (2 * Math.PI * r) / SEGMENTS + 0.5;
  const halfT = THICKNESS / 2;

  return (
    <div
      className={`relative shrink-0${spin ? ' animate-btc-spin' : ''}`}
      style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
    >
      {/* ── Rim: cylinder edge segments ── */}
      {spin && Array.from({ length: SEGMENTS }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: arcLen,
            height: THICKNESS,
            left: r - arcLen / 2,
            top: r - halfT,
            background: EDGE_COLOR,
            transform: `rotateY(${(i / SEGMENTS) * 360}deg) translateZ(${r}px)`,
          }}
        />
      ))}

      {/* ── Front face ── */}
      <svg
        viewBox="0 0 32 32"
        aria-label="Bitcoin"
        style={{
          position: 'absolute', inset: 0, display: 'block',
          transform: `translateZ(${halfT + 0.5}px)`,
        }}
      >
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path fill="#fff" d={BTC_PATH} />
      </svg>

      {/* ── Back face (shown when coin flips 180°) ── */}
      {spin && (
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, display: 'block',
            transform: `translateZ(-${halfT + 0.5}px) rotateY(180deg)`,
          }}
        >
          <circle cx="16" cy="16" r="16" fill={BACK_COLOR} />
        </svg>
      )}
    </div>
  );
}
