// A laptop with a phone standing in front of it; the screens swap halfway (screens: [{at}, ...]) and a headline fades in
// via the overlay + update hook. Hooks must be pure functions of t.
export default {
  duration: 8,
  loop: false,
  background: "linear-gradient(135deg, #fef3c7, #fde68a)",
  overlay: `<div id="headline" style="position:absolute;left:6%;top:8%;font:800 5vmin/1.1 Inter,system-ui,sans-serif;color:#1f2937;opacity:0">Your work,<br>everywhere.</div>`,
  update(t, { overlay }) {
    const el = overlay.querySelector("#headline");
    if (el) el.style.opacity = String(Math.min(1, Math.max(0, (t - 0.8) / 0.6)));
  },
  devices: [
    {
      model: "laptop-notch",
      screens: [{ at: 0, src: "/shot.png" }, { at: 4, src: "/shot2.png" }],
      pos: [0.2, 0, -0.2],
      keys: [{ t: 0, open: 0 }, { t: 1.6, open: 105, ease: "outCubic" }],
    },
    {
      model: "phone-flat",
      anchor: "bottom",                                  // stands on the same floor as the laptop
      screen: { src: "/shot.png" },
      scale: 0.9,
      keys: [
        { t: 0, pos: [-1.5, -0.8, 0.9], rot: [0, 25, 0] },
        { t: 2, pos: [-1.5, 0, 0.9], rot: [0, 20, 0], ease: "outBack" },
      ],
    },
  ],
  camera: {
    fov: 30,
    keys: [
      { t: 0, az: -24, el: 16, zoom: 0.9 },
      { t: 8, az: -6, el: 10, zoom: 1.1, ease: "inOutSine" },
    ],
  },
};
