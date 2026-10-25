// Laptop opens, camera pushes in while orbiting slightly, then holds. A 6 s seamless loop is NOT needed here: it is a one-shot hero.
// Copy this file, change the screen, background and keyframes. Times are in seconds, angles in degrees, 1 unit = 10 cm.
export default {
  duration: 6,
  fps: 30,
  loop: false,
  background: "linear-gradient(135deg, #e0e7ff, #fce7f3)",
  devices: [
    {
      model: "laptop-notch",                       // see `readytogo models`
      screen: { src: "/shot.png", align: "top" },  // image or .webm; omit src for a placeholder
      keys: [
        { t: 0, open: 0 },                          // closed
        { t: 1.8, open: 105, ease: "outCubic" },    // opens
      ],
    },
  ],
  camera: {
    fov: 30,
    keys: [
      { t: 0, az: -35, el: 24, zoom: 0.95, target: [0, 0.1, 0] },
      { t: 6, az: -12, el: 12, zoom: 1.25, target: [0, 0.2, 0], ease: "inOutSine" },
    ],
  },
};
