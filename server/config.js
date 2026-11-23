import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..');
export const DATA = resolve(process.env.SECELT_DATA_DIR || join(ROOT, 'data'));
export const MEDIA_DIR = join(DATA, 'media');
export const mapsPhotosEnabled = process.env.GOOGLE_MAPS_PHOTOS_ENABLED === 'true' && !!process.env.GOOGLE_MAPS_API_KEY;
