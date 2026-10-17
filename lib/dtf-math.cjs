// Pure DTF sizing utility. Does not read or modify artwork.
'use strict';
const DPI = 300;
function pxForCm(cm, dpi = DPI) {
  if (!Number.isFinite(cm) || cm <= 0 || !Number.isFinite(dpi) || dpi <= 0) throw new RangeError('Invalid dimensions');
  return Math.round(cm * dpi / 2.54);
}
function contain(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  for (const n of [sourceWidth, sourceHeight, targetWidth, targetHeight]) {
    if (!Number.isFinite(n) || n <= 0) throw new RangeError('Invalid dimensions');
  }
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale, height = sourceHeight * scale;
  return {width, height, x:(targetWidth-width)/2, y:(targetHeight-height)/2};
}
module.exports = {DPI, pxForCm, contain};
