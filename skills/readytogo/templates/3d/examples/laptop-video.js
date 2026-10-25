// A screen recording plays on the laptop. Use a .webm (convert with `readytogo video in.mp4 --out in.webm`).
// The recording is sampled frame-exactly from the timeline, so the video and the camera never drift apart.
export default {
  duration: 8,
  loop: false,
  background: "transparent",                         // render with --transparent for a WebM with alpha
  shadow: true,
  devices: [
    {
      model: "laptop-slim",
      open: 105,
      screen: { src: "/recording.webm", start: 0, rate: 1, loop: true },
    },
  ],
  camera: {
    fov: 26,
    keys: [
      { t: 0, az: -18, el: 14, zoom: 1.0 },
      { t: 8, az: 14, el: 10, zoom: 1.2, ease: "inOutSine" },
    ],
  },
};
