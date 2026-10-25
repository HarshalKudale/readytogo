// One phone turning a full revolution; the camera stays put. Seamless loop: the last key equals the first plus 360.
export default {
  duration: 8,
  loop: true,
  background: "#0f172a",
  devices: [
    {
      model: "phone-island",
      color: "#3b82f6",                              // tints every part named "Body"
      finish: "gloss",                               // titanium (default) | matte | gloss
      screen: { src: "/shot.png" },
      keys: [
        { t: 0, rot: [-4, 0, 0], ease: "linear" },
        { t: 8, rot: [-4, 360, 0], ease: "linear" },
      ],
    },
  ],
  camera: { fov: 28, keys: [{ t: 0, az: 0, el: 6, zoom: 1.1 }] },
};
