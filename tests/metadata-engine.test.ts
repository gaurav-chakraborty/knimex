import { describe, expect, it } from 'vitest';
import { extractMetadata, removeMetadata } from '@/lib/metadata-engine';

describe('metadata-engine: images (EXIF)', () => {
  function buildJpegWithExif() {
    // Minimal JPEG: SOI + APP1(EXIF) marker containing GPS/camera/datetime
    // tag byte-pairs the engine scans for, sized via a real 2-byte length.
    const exifPayload = Buffer.concat([
      Buffer.from([0x88, 0x05]), // GPS Info IFD Pointer
      Buffer.from([0x10, 0x01]), // Model
      Buffer.from([0x32, 0x03]), // DateTime
      Buffer.alloc(10),
    ]);
    const lengthBytes = Buffer.alloc(2);
    lengthBytes.writeUInt16BE(exifPayload.length + 2, 0);

    return Buffer.concat([
      Buffer.from([0xff, 0xd8]), // SOI
      Buffer.from([0xff, 0xe1]), // APP1/EXIF marker
      lengthBytes,
      exifPayload,
      Buffer.from([0xff, 0xd9]), // EOI
    ]);
  }

  it('detects GPS, camera model, and datetime fields', async () => {
    const buffer = buildJpegWithExif();
    const metadata = await extractMetadata(buffer, 'photo.jpg');

    const keys = metadata.fields.map((f) => f.key);
    expect(keys).toContain('gps');
    expect(keys).toContain('camera_model');
    expect(keys).toContain('datetime');

    const gpsField = metadata.fields.find((f) => f.key === 'gps');
    expect(gpsField?.riskLevel).toBe('high');
  });

  it('strips the EXIF segment on removal', async () => {
    const buffer = buildJpegWithExif();
    const cleaned = await removeMetadata(buffer, 'photo.jpg', {
      removeFields: ['gps', 'camera_model', 'datetime'],
      replaceFields: {},
      preserveStructure: true,
      removeDigitalSignature: false,
    });

    // The EXIF APP1 marker (0xFFE1) should no longer be present.
    const hasExifMarker = cleaned.indexOf(Buffer.from([0xff, 0xe1])) !== -1;
    expect(hasExifMarker).toBe(false);
    expect(cleaned.length).toBeLessThan(buffer.length);
  });

  it('returns no fields for an image with no EXIF marker', async () => {
    const plainJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const metadata = await extractMetadata(plainJpeg, 'clean.jpg');
    expect(metadata.fields).toHaveLength(0);
  });
});

describe('metadata-engine: audio (ID3)', () => {
  it('detects and removes ID3 tags from MP3 files', async () => {
    // ID3v2 header: "ID3" + version(2) + flags(1) + synchsafe size(4)
    const tagBody = Buffer.from('some id3 tag data here');
    const size = tagBody.length;
    const synchsafeSize = Buffer.from([
      (size >> 21) & 0x7f,
      (size >> 14) & 0x7f,
      (size >> 7) & 0x7f,
      size & 0x7f,
    ]);
    const header = Buffer.concat([Buffer.from('ID3'), Buffer.from([0x03, 0x00, 0x00]), synchsafeSize]);
    const audioData = Buffer.from('fake mp3 audio frames');
    const buffer = Buffer.concat([header, tagBody, audioData]);

    const metadata = await extractMetadata(buffer, 'song.mp3');
    expect(metadata.fields.map((f) => f.key)).toContain('id3_tags');

    const cleaned = await removeMetadata(buffer, 'song.mp3', {
      removeFields: ['id3_tags'],
      replaceFields: {},
      preserveStructure: true,
      removeDigitalSignature: false,
    });
    expect(cleaned.toString('utf8')).toBe(audioData.toString('utf8'));
  });
});

describe('metadata-engine: PDF', () => {
  it('extracts and removes Author/Title fields', async () => {
    const pdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Info 2 0 R >>\nendobj\n2 0 obj\n<< /Title (Confidential Report) /Author (Jane Doe) >>\nendobj\n'
    );

    const metadata = await extractMetadata(pdf, 'doc.pdf');
    const author = metadata.fields.find((f) => f.key === 'author');
    expect(author?.value).toBe('Jane Doe');
    expect(author?.riskLevel).toBe('high');

    const cleaned = await removeMetadata(pdf, 'doc.pdf', {
      removeFields: ['author', 'title'],
      replaceFields: {},
      preserveStructure: true,
      removeDigitalSignature: false,
    });
    expect(cleaned.toString('latin1')).not.toContain('Jane Doe');
  });
});
