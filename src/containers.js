// .ico and .icns writers that embed PNGs (ported from the web app's tools/ico.ts).
export function buildIco(images) {
  const headerSize = 6 + 16 * images.length;
  const out = Buffer.alloc(headerSize + images.reduce((n, i) => n + i.png.length, 0));
  out.writeUInt16LE(1, 2); // type: icon
  out.writeUInt16LE(images.length, 4);
  let offset = headerSize;
  images.forEach(({ size, png }, i) => {
    const e = 6 + i * 16;
    out[e] = size >= 256 ? 0 : size; // 0 means 256
    out[e + 1] = size >= 256 ? 0 : size;
    out.writeUInt16LE(1, e + 4); // color planes
    out.writeUInt16LE(32, e + 6); // bits per pixel
    out.writeUInt32LE(png.length, e + 8);
    out.writeUInt32LE(offset, e + 12);
    png.copy(out, offset);
    offset += png.length;
  });
  return out;
}

// PNG-backed .icns entries (macOS 10.7+): type code -> pixel size.
export const ICNS_TYPES = [
  ["icp4", 16], ["icp5", 32], ["ic11", 32], ["ic12", 64], ["ic07", 128],
  ["ic08", 256], ["ic13", 256], ["ic09", 512], ["ic14", 512], ["ic10", 1024],
];

// "icns" + total length, then per entry its 4-char type, length (incl. 8-byte header) and PNG. Big-endian.
export function buildIcns(entries) {
  const total = 8 + entries.reduce((n, e) => n + 8 + e.png.length, 0);
  const out = Buffer.alloc(total);
  out.write("icns", 0, "ascii");
  out.writeUInt32BE(total, 4);
  let offset = 8;
  for (const { type, png } of entries) {
    out.write(type, offset, "ascii");
    out.writeUInt32BE(8 + png.length, offset + 4);
    png.copy(out, offset + 8);
    offset += 8 + png.length;
  }
  return out;
}
