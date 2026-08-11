import "server-only";

import QRCode from "qrcode";

export async function generateQrSvg(value: string) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "H",
    color: { dark: "#0b2740", light: "#0000" },
  });
  return svg.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"');
}
