const jpegStandaloneMarkers = new Set([
  0x01, 0xd8, 0xd9, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7,
]);

function join(parts: Uint8Array[]) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function uint16be(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function uint32be(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function uint32le(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] +
    bytes[offset + 1] * 0x100 +
    bytes[offset + 2] * 0x10000 +
    bytes[offset + 3] * 0x1000000
  );
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function sanitizeJpeg(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw new Error('Invalid JPEG signature');

  const output = [bytes.slice(0, 2)];
  let offset = 2;
  while (offset < bytes.length) {
    const markerStart = offset;
    if (bytes[offset] !== 0xff) throw new Error('Invalid JPEG marker');
    while (bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) throw new Error('Incomplete JPEG marker');
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9) {
      output.push(bytes.slice(markerStart, offset));
      return join(output);
    }
    if (marker === 0x00) throw new Error('Unexpected JPEG byte stuffing');
    if (jpegStandaloneMarkers.has(marker)) {
      output.push(bytes.slice(markerStart, offset));
      continue;
    }

    if (offset + 2 > bytes.length) throw new Error('Incomplete JPEG segment');
    const segmentLength = uint16be(bytes, offset);
    if (segmentLength < 2) throw new Error('Invalid JPEG segment length');
    const segmentEnd = offset + segmentLength;
    if (segmentEnd > bytes.length) throw new Error('JPEG segment exceeds file length');

    if (marker === 0xda) {
      output.push(bytes.slice(markerStart, segmentEnd));
      offset = segmentEnd;
      const scanStart = offset;
      while (offset < bytes.length - 1) {
        if (bytes[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        let codeOffset = offset + 1;
        while (bytes[codeOffset] === 0xff) codeOffset += 1;
        const code = bytes[codeOffset];
        if (code === 0x00 || (code >= 0xd0 && code <= 0xd7)) {
          offset = codeOffset + 1;
          continue;
        }
        output.push(bytes.slice(scanStart, offset));
        if (code === 0xd9) {
          output.push(bytes.slice(offset, codeOffset + 1));
          return join(output);
        }
        // Progressive JPEGs can return to ordinary marker segments between scans.
        break;
      }
      if (offset >= bytes.length - 1) throw new Error('JPEG is missing an end marker');
      continue;
    }

    // APP1 carries EXIF/XMP, APP2 commonly carries ICC/FlashPix, APP13 carries IPTC,
    // and COM is arbitrary text. JFIF and Adobe color-transform markers stay intact.
    const privateMetadata =
      marker === 0xe1 || marker === 0xe2 || marker === 0xed || marker === 0xfe;
    if (!privateMetadata) output.push(bytes.slice(markerStart, segmentEnd));
    offset = segmentEnd;
  }
  throw new Error('JPEG is missing an end marker');
}

function sanitizePng(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 20 || !signature.every((value, index) => bytes[index] === value))
    throw new Error('Invalid PNG signature');

  const output = [bytes.slice(0, 8)];
  const privateChunks = new Set(['eXIf', 'iTXt', 'tEXt', 'zTXt', 'iCCP', 'tIME']);
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = uint32be(bytes, offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error('PNG chunk exceeds file length');
    const type = ascii(bytes, offset + 4, 4);
    if (!privateChunks.has(type)) output.push(bytes.slice(offset, end));
    offset = end;
    if (type === 'IEND') return join(output);
  }
  throw new Error('PNG is missing an IEND chunk');
}

function writeUint32le(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function sanitizeWebp(bytes: Uint8Array) {
  if (bytes.length < 20 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP')
    throw new Error('Invalid WebP signature');

  const declaredEnd = uint32le(bytes, 4) + 8;
  if (declaredEnd > bytes.length || declaredEnd < 20) throw new Error('Invalid WebP length');
  const chunks: Uint8Array[] = [];
  let offset = 12;
  while (offset + 8 <= declaredEnd) {
    const type = ascii(bytes, offset, 4);
    const length = uint32le(bytes, offset + 4);
    const end = offset + 8 + length + (length % 2);
    if (end > declaredEnd) throw new Error('WebP chunk exceeds file length');
    if (!new Set(['EXIF', 'XMP ', 'ICCP']).has(type)) {
      const chunk = bytes.slice(offset, end);
      if (type === 'VP8X' && length >= 10) chunk[8] &= ~0x2c;
      chunks.push(chunk);
    }
    offset = end;
  }
  if (offset !== declaredEnd) throw new Error('Invalid WebP chunk alignment');

  const body = join(chunks);
  const header = new Uint8Array(12);
  header.set(bytes.slice(0, 12));
  writeUint32le(header, 4, body.length + 4);
  return join([header, body]);
}

export function sanitizeImageMetadata(bytes: Uint8Array, type: string) {
  if (type === 'image/jpeg') return sanitizeJpeg(bytes);
  if (type === 'image/png') return sanitizePng(bytes);
  if (type === 'image/webp') return sanitizeWebp(bytes);
  throw new Error('Unsupported image type');
}
