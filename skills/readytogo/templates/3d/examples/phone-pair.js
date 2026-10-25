// Two different phones side by side in opposite phase, camera dollying slowly. Seamless loop.
export default {
  duration: 6,
  loop: true,
  background: "linear-gradient(160deg, #1e1b4b, #312e81)",
  devices: [
    {
      model: "phone-island",
      screen: { src: "/shot.png" },
      pos: [-0.55, 0, 0],
      keys: [
        { t: 0, rot: [0, 22, 0], pos: [-0.55, 0, 0] },
        { t: 3, rot: [0, 30, 0], pos: [-0.55, 0.06, 0] },
        { t: 6, rot: [0, 22, 0], pos: [-0.55, 0, 0] },
      ],
    },
    {
      model: "phone-punchhole",
      screen: { src: "/shot.png" },
      keys: [
        { t: 0, rot: [0, -22, 0], pos: [0.55, 0.1, -0.15] },
        { t: 3, rot: [0, -30, 0], pos: [0.55, 0.04, -0.15] },
        { t: 6, rot: [0, -22, 0], pos: [0.55, 0.1, -0.15] },
      ],
    },
  ],
  camera: {
    fov: 30,
    keys: [
      { t: 0, az: -6, el: 6, zoom: 1.05 },
      { t: 3, az: 6, el: 8, zoom: 1.12 },
      { t: 6, az: -6, el: 6, zoom: 1.05 },
    ],
  },
};
