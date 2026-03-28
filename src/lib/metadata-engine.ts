/**
 * Universal Metadata Engine for filex
 * Handles extraction, removal, and replacement of metadata across all file types
 */

import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MetadataField {
  key: string;
  value: string | string[];
  category: 'camera' | 'location' | 'identity' | 'org' | 'software' | 'time' | 'technical' | 'signature' | 'encryption';
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
}

export interface FileMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  fields: MetadataField[];
  isEncrypted: boolean;
  hasDigitalSignature: boolean;
  extractedAt: Date;
}

export interface MetadataRemovalOptions {
  removeFields: string[]; // keys of fields to remove
  replaceFields: Record<string, string>; // key -> replacement value
  preserveStructure: boolean; // keep file structure intact
  removeDigitalSignature: boolean;
}

export interface MetadataCopyOptions {
  sourceFile: Buffer;
  targetFile: Buffer;
  fieldsToKeep?: string[];
  fieldsToReplace?: Record<string, string>;
}

/**
 * Extract metadata from any file type
 */
export async function extractMetadata(fileBuffer: Buffer, fileName: string): Promise<FileMetadata> {
  const fileType = getFileType(fileName);
  const fields: MetadataField[] = [];

  try {
    switch (fileType) {
      case 'pdf':
        fields.push(...extractPDFMetadata(fileBuffer));
        break;
      case 'image':
        fields.push(...extractImageMetadata(fileBuffer, fileName));
        break;
      case 'office':
        fields.push(...extractOfficeMetadata(fileBuffer, fileName));
        break;
      case 'archive':
        fields.push(...extractArchiveMetadata(fileBuffer, fileName));
        break;
      case 'video':
        fields.push(...extractVideoMetadata(fileBuffer, fileName));
        break;
      case 'audio':
        fields.push(...extractAudioMetadata(fileBuffer, fileName));
        break;
      default:
        fields.push(...extractGenericMetadata(fileBuffer, fileName));
    }
  } catch (error) {
    console.error(`Error extracting metadata from ${fileName}:`, error);
  }

  const isEncrypted = checkEncryption(fileBuffer);
  const hasDigitalSignature = checkDigitalSignature(fileBuffer, fileType);

  return {
    fileName,
    fileType,
    fileSize: fileBuffer.length,
    fields,
    isEncrypted,
    hasDigitalSignature,
    extractedAt: new Date(),
  };
}

/**
 * Remove/replace metadata from file
 */
export async function removeMetadata(
  fileBuffer: Buffer,
  fileName: string,
  options: MetadataRemovalOptions
): Promise<Buffer> {
  const fileType = getFileType(fileName);

  try {
    switch (fileType) {
      case 'pdf':
        return removePDFMetadata(fileBuffer, options);
      case 'image':
        return removeImageMetadata(fileBuffer, options);
      case 'office':
        return removeOfficeMetadata(fileBuffer, options);
      case 'archive':
        return removeArchiveMetadata(fileBuffer, options);
      case 'video':
        return removeVideoMetadata(fileBuffer, options);
      case 'audio':
        return removeAudioMetadata(fileBuffer, options);
      default:
        return removeGenericMetadata(fileBuffer, options);
    }
  } catch (error) {
    console.error(`Error removing metadata from ${fileName}:`, error);
    throw error;
  }
}

/**
 * Copy metadata from source file to target file
 */
export async function copyMetadata(
  sourceBuffer: Buffer,
  targetBuffer: Buffer,
  sourceFileName: string,
  targetFileName: string,
  options?: MetadataCopyOptions
): Promise<Buffer> {
  const sourceMetadata = await extractMetadata(sourceBuffer, sourceFileName);
  
  // Filter fields to copy
  let fieldsToCopy = sourceMetadata.fields;
  if (options?.fieldsToKeep) {
    fieldsToCopy = fieldsToCopy.filter(f => options.fieldsToKeep!.includes(f.key));
  }

  // Apply replacements if specified
  const replacements = options?.fieldsToReplace || {};
  fieldsToCopy = fieldsToCopy.map(f => ({
    ...f,
    value: replacements[f.key] || f.value,
  }));

  // Apply metadata to target file
  const removalOptions: MetadataRemovalOptions = {
    removeFields: [],
    replaceFields: Object.fromEntries(
      fieldsToCopy.map(f => [f.key, Array.isArray(f.value) ? f.value.join(', ') : String(f.value)])
    ),
    preserveStructure: true,
    removeDigitalSignature: false,
  };

  return removeMetadata(targetBuffer, targetFileName, removalOptions);
}

// ============ FILE TYPE DETECTION ============

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'].includes(ext)) return 'image';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(ext)) return 'office';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) return 'audio';
  
  return 'generic';
}

// ============ ENCRYPTION & SIGNATURE DETECTION ============

function checkEncryption(buffer: Buffer): boolean {
  // Check for common encryption signatures
  const pdfEncryption = buffer.toString('latin1').includes('/Encrypt');
  const zipEncryption = buffer.length > 4 && buffer[3] === 0x03; // ZIP encryption flag
  
  return pdfEncryption || zipEncryption;
}

function checkDigitalSignature(buffer: Buffer, fileType: string): boolean {
  if (fileType === 'pdf') {
    return buffer.toString('latin1').includes('/Sig');
  }
  if (fileType === 'office') {
    return buffer.toString('latin1').includes('DigitalSignatures');
  }
  return false;
}

// ============ PDF METADATA ============

function extractPDFMetadata(buffer: Buffer): MetadataField[] {
  const fields: MetadataField[] = [];
  const pdfStr = buffer.toString('latin1');

  // Extract Info dictionary
  const infoMatch = pdfStr.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
  if (infoMatch) {
    const patterns = [
      { key: 'Title', category: 'identity' as const, risk: 'medium' as const },
      { key: 'Author', category: 'identity' as const, risk: 'high' as const },
      { key: 'Subject', category: 'org' as const, risk: 'medium' as const },
      { key: 'Keywords', category: 'org' as const, risk: 'low' as const },
      { key: 'Creator', category: 'software' as const, risk: 'low' as const },
      { key: 'Producer', category: 'software' as const, risk: 'low' as const },
      { key: 'CreationDate', category: 'time' as const, risk: 'medium' as const },
      { key: 'ModDate', category: 'time' as const, risk: 'medium' as const },
    ];

    patterns.forEach(({ key, category, risk }) => {
      const regex = new RegExp(`\\/${key}\\s*\\(([^)]*)\\)`, 'i');
      const match = pdfStr.match(regex);
      if (match) {
        fields.push({
          key: key.toLowerCase(),
          value: match[1],
          category,
          riskLevel: risk,
          description: `PDF ${key}`,
        });
      }
    });
  }

  return fields;
}

function removePDFMetadata(buffer: Buffer, options: MetadataRemovalOptions): Buffer {
  let pdfStr = buffer.toString('latin1');

  // Remove Info dictionary if specified
  if (options.removeFields.includes('all') || options.removeFields.length > 0) {
    pdfStr = pdfStr.replace(/\/Info\s+\d+\s+\d+\s+R/, '');
    pdfStr = pdfStr.replace(/\/Title\s*\([^)]*\)/gi, '');
    pdfStr = pdfStr.replace(/\/Author\s*\([^)]*\)/gi, '');
    pdfStr = pdfStr.replace(/\/Subject\s*\([^)]*\)/gi, '');
    pdfStr = pdfStr.replace(/\/Keywords\s*\([^)]*\)/gi, '');
    pdfStr = pdfStr.replace(/\/Creator\s*\([^)]*\)/gi, '');
    pdfStr = pdfStr.replace(/\/Producer\s*\([^)]*\)/gi, '');
    pdfStr = pdfStr.replace(/\/CreationDate\s*\([^)]*\)/gi, '');
    pdfStr = pdfStr.replace(/\/ModDate\s*\([^)]*\)/gi, '');
  }

  // Apply replacements
  Object.entries(options.replaceFields).forEach(([key, value]) => {
    const regex = new RegExp(`\\/${key}\\s*\\([^)]*\\)`, 'i');
    pdfStr = pdfStr.replace(regex, `/${key} (${value})`);
  });

  // Remove digital signature if requested
  if (options.removeDigitalSignature) {
    pdfStr = pdfStr.replace(/\/Sig\s+\d+\s+\d+\s+R/g, '');
  }

  return Buffer.from(pdfStr, 'latin1');
}

// ============ IMAGE METADATA (EXIF) ============

function extractImageMetadata(buffer: Buffer, fileName: string): MetadataField[] {
  const fields: MetadataField[] = [];

  // Simple EXIF extraction (production would use exifparser library)
  const exifMarker = buffer.indexOf(Buffer.from([0xFF, 0xE1]));
  if (exifMarker !== -1) {
    // Markers for common EXIF tags
    const gpsMarker = buffer.indexOf(Buffer.from([0x88, 0x05])); // GPS Info IFD Pointer
    if (gpsMarker !== -1) {
      fields.push({
        key: 'gps',
        value: '[GPS coordinates found]',
        category: 'location',
        riskLevel: 'high',
        description: 'GPS coordinates embedded in image',
      });
    }

    const cameraMarker = buffer.indexOf(Buffer.from([0x10, 0x01])); // Model
    if (cameraMarker !== -1) {
      fields.push({
        key: 'camera_model',
        value: '[Camera model found]',
        category: 'camera',
        riskLevel: 'medium',
        description: 'Camera/device model information',
      });
    }

    const dateMarker = buffer.indexOf(Buffer.from([0x32, 0x03])); // DateTime
    if (dateMarker !== -1) {
      fields.push({
        key: 'datetime',
        value: '[Timestamp found]',
        category: 'time',
        riskLevel: 'medium',
        description: 'Photo capture date and time',
      });
    }
  }

  return fields;
}

function removeImageMetadata(buffer: Buffer, options: MetadataRemovalOptions): Buffer {
  // Strip EXIF data by finding and removing EXIF marker
  let result = buffer;

  // Find EXIF marker (0xFFE1)
  const exifMarkerIndex = buffer.indexOf(Buffer.from([0xFF, 0xE1]));
  if (exifMarkerIndex !== -1) {
    // Get EXIF length (2 bytes after marker)
    const lengthBytes = buffer.readUInt16BE(exifMarkerIndex + 2);
    // Remove EXIF segment
    result = Buffer.concat([
      buffer.slice(0, exifMarkerIndex),
      buffer.slice(exifMarkerIndex + 2 + lengthBytes),
    ]);
  }

  return result;
}

// ============ OFFICE METADATA ============

function extractOfficeMetadata(buffer: Buffer, fileName: string): MetadataField[] {
  const fields: MetadataField[] = [];

  // Office files are ZIP archives with XML metadata
  const xmlStr = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));

  const patterns = [
    { key: 'creator', category: 'identity' as const, risk: 'high' as const },
    { key: 'lastModifiedBy', category: 'identity' as const, risk: 'high' as const },
    { key: 'created', category: 'time' as const, risk: 'medium' as const },
    { key: 'modified', category: 'time' as const, risk: 'medium' as const },
    { key: 'company', category: 'org' as const, risk: 'high' as const },
  ];

  patterns.forEach(({ key, category, risk }) => {
    const regex = new RegExp(`<${key}>([^<]*)</${key}>`, 'i');
    const match = xmlStr.match(regex);
    if (match) {
      fields.push({
        key,
        value: match[1],
        category,
        riskLevel: risk,
        description: `Office document ${key}`,
      });
    }
  });

  return fields;
}

function removeOfficeMetadata(buffer: Buffer, options: MetadataRemovalOptions): Buffer {
  let xmlStr = buffer.toString('utf8');

  // Remove metadata XML tags
  xmlStr = xmlStr.replace(/<creator>[^<]*<\/creator>/gi, '');
  xmlStr = xmlStr.replace(/<lastModifiedBy>[^<]*<\/lastModifiedBy>/gi, '');
  xmlStr = xmlStr.replace(/<created>[^<]*<\/created>/gi, '');
  xmlStr = xmlStr.replace(/<modified>[^<]*<\/modified>/gi, '');
  xmlStr = xmlStr.replace(/<company>[^<]*<\/company>/gi, '');

  // Apply replacements
  Object.entries(options.replaceFields).forEach(([key, value]) => {
    const regex = new RegExp(`<${key}>[^<]*</${key}>`, 'gi');
    xmlStr = xmlStr.replace(regex, `<${key}>${value}</${key}>`);
  });

  return Buffer.from(xmlStr, 'utf8');
}

// ============ ARCHIVE METADATA ============

function extractArchiveMetadata(buffer: Buffer, fileName: string): MetadataField[] {
  const fields: MetadataField[] = [];

  // ZIP file metadata (central directory)
  const zipSignature = buffer.readUInt32LE(0);
  if (zipSignature === 0x04034b50) { // Local file header signature
    fields.push({
      key: 'archive_type',
      value: 'ZIP',
      category: 'technical',
      riskLevel: 'low',
      description: 'Archive file type',
    });

    // Extract file timestamps from local headers
    let offset = 0;
    while (offset < buffer.length) {
      const sig = buffer.readUInt32LE(offset);
      if (sig === 0x04034b50) {
        const modTime = buffer.readUInt16LE(offset + 10);
        const modDate = buffer.readUInt16LE(offset + 12);
        if (modTime > 0 || modDate > 0) {
          fields.push({
            key: 'archive_timestamp',
            value: `[Timestamp: ${modDate}/${modTime}]`,
            category: 'time',
            riskLevel: 'medium',
            description: 'Archive file modification timestamp',
          });
          break;
        }
      }
      offset += 4;
    }
  }

  return fields;
}

function removeArchiveMetadata(buffer: Buffer, options: MetadataRemovalOptions): Buffer {
  // For archives, we'd need to re-compress without timestamps
  // This is a simplified version - production would use a ZIP library
  return buffer;
}

// ============ VIDEO/AUDIO METADATA ============

function extractVideoMetadata(buffer: Buffer, fileName: string): MetadataField[] {
  const fields: MetadataField[] = [];

  // Look for common metadata atoms (MP4, MOV)
  const metaMarker = buffer.indexOf(Buffer.from('meta'));
  if (metaMarker !== -1) {
    fields.push({
      key: 'video_metadata',
      value: '[Video metadata found]',
      category: 'technical',
      riskLevel: 'low',
      description: 'Video file contains embedded metadata',
    });
  }

  return fields;
}

function removeVideoMetadata(buffer: Buffer, options: MetadataRemovalOptions): Buffer {
  // Simplified - production would use ffmpeg or similar
  return buffer;
}

function extractAudioMetadata(buffer: Buffer, fileName: string): MetadataField[] {
  const fields: MetadataField[] = [];

  // Look for ID3 tags (MP3)
  if (buffer.toString('utf8', 0, 3) === 'ID3') {
    fields.push({
      key: 'id3_tags',
      value: '[ID3 tags found]',
      category: 'identity',
      riskLevel: 'medium',
      description: 'Audio file contains ID3 metadata tags',
    });
  }

  return fields;
}

function removeAudioMetadata(buffer: Buffer, options: MetadataRemovalOptions): Buffer {
  // Remove ID3 tags
  if (buffer.toString('utf8', 0, 3) === 'ID3') {
    // Skip ID3 header (10 bytes) + size
    const size = ((buffer[6] & 0x7f) << 21) | ((buffer[7] & 0x7f) << 14) | ((buffer[8] & 0x7f) << 7) | (buffer[9] & 0x7f);
    return buffer.slice(10 + size);
  }
  return buffer;
}

// ============ GENERIC METADATA ============

function extractGenericMetadata(buffer: Buffer, fileName: string): MetadataField[] {
  return [{
    key: 'file_name',
    value: fileName,
    category: 'identity',
    riskLevel: 'low',
    description: 'Original file name',
  }];
}

function removeGenericMetadata(buffer: Buffer, options: MetadataRemovalOptions): Buffer {
  return buffer;
}
