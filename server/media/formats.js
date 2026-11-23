const formats = new Map([
  ['image/jpeg', { extension: 'jpg', matches: bytes => bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) }],
  ['image/png', { extension: 'png', matches: bytes => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ['image/webp', { extension: 'webp', matches: bytes => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' }]
]);

export const imageFormat = mimeType => formats.get(mimeType);
export const maxImageSize = 8 * 1024 * 1024;
