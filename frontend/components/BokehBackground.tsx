/**
 * ─────────────────────────────────────────────────────────────────────
 *  AMBIENT BACKGROUND
 * ─────────────────────────────────────────────────────────────────────
 *  Pehle yaha 6 `<span>` the, har ek `filter: blur(44px)` ke saath,
 *  position fixed aur 18–30s ka infinite animation.
 *
 *  Wo kitna mehnga tha:
 *    - blur() ek GPU filter hai. Animated element par browser har frame
 *      us layer ko dobara blur karta hai.
 *    - `position: fixed` matlab wo poore viewport ko cover karte hain,
 *      to blur ka area = poori screen, 6 baar, har frame.
 *    - Yeh scroll ke saath compete karta hai → mobile par direct jank.
 *
 *  Ab yeh ek server-rendered static CSS gradient hai:
 *    - Zero JavaScript (client component bhi nahi)
 *    - Zero animation, zero filter, zero repaint
 *    - Compositor ise ek baar paint karke bhool jaata hai
 *
 *  Dikhne me farak? Orbs itni dheere aur itni transparent (6% opacity)
 *  chal rahi thi ki koi notice hi nahi karta tha. Warmth wahi hai,
 *  cost zero ho gayi.
 */
export default function BokehBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background: `
          radial-gradient(60rem 40rem at 12% 8%,  rgba(118,159,205,0.10), transparent 60%),
          radial-gradient(45rem 32rem at 88% 42%, rgba(185,215,234,0.14), transparent 62%),
          radial-gradient(50rem 36rem at 45% 92%, rgba(214,230,242,0.16), transparent 60%)
        `,
      }}
    />
  );
}
