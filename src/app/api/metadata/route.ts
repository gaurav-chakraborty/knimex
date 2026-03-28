import { NextRequest, NextResponse } from 'next/server';
import {
  extractMetadata,
  removeMetadata,
  copyMetadata,
  type MetadataRemovalOptions,
  type MetadataCopyOptions,
} from '@/lib/metadata-engine';

/**
 * POST /api/metadata/extract
 * Extract metadata from uploaded files (batch up to 10)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;

    if (action === 'extract') {
      return handleExtract(formData);
    } else if (action === 'remove') {
      return handleRemove(formData);
    } else if (action === 'copy') {
      return handleCopy(formData);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Metadata API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract metadata from files
 */
async function handleExtract(formData: FormData) {
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: 'No files provided' },
      { status: 400 }
    );
  }

  if (files.length > 10) {
    return NextResponse.json(
      { error: 'Maximum 10 files allowed per batch' },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const metadata = await extractMetadata(
          Buffer.from(buffer),
          file.name
        );
        return metadata;
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      files: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Extraction failed: ${String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * Remove/replace metadata from files
 */
async function handleRemove(formData: FormData) {
  const files = formData.getAll('files') as File[];
  const removeFieldsStr = formData.get('removeFields') as string;
  const replaceFieldsStr = formData.get('replaceFields') as string;
  const removeSignature = formData.get('removeSignature') === 'true';

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: 'No files provided' },
      { status: 400 }
    );
  }

  if (files.length > 10) {
    return NextResponse.json(
      { error: 'Maximum 10 files allowed per batch' },
      { status: 400 }
    );
  }

  try {
    const removeFields = removeFieldsStr ? JSON.parse(removeFieldsStr) : [];
    const replaceFields = replaceFieldsStr ? JSON.parse(replaceFieldsStr) : {};

    const options: MetadataRemovalOptions = {
      removeFields,
      replaceFields,
      preserveStructure: true,
      removeDigitalSignature: removeSignature,
    };

    const results = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const cleanedBuffer = await removeMetadata(
          Buffer.from(buffer),
          file.name,
          options
        );

        return {
          fileName: file.name,
          originalSize: buffer.byteLength,
          cleanedSize: cleanedBuffer.length,
          sizeReduction: buffer.byteLength - cleanedBuffer.length,
          data: cleanedBuffer.toString('base64'),
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      files: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Removal failed: ${String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * Copy metadata from source file to target file
 */
async function handleCopy(formData: FormData) {
  const sourceFile = formData.get('sourceFile') as File;
  const targetFiles = formData.getAll('targetFiles') as File[];
  const fieldsToKeepStr = formData.get('fieldsToKeep') as string;
  const replaceFieldsStr = formData.get('replaceFields') as string;

  if (!sourceFile) {
    return NextResponse.json(
      { error: 'Source file not provided' },
      { status: 400 }
    );
  }

  if (!targetFiles || targetFiles.length === 0) {
    return NextResponse.json(
      { error: 'No target files provided' },
      { status: 400 }
    );
  }

  if (targetFiles.length > 10) {
    return NextResponse.json(
      { error: 'Maximum 10 target files allowed per batch' },
      { status: 400 }
    );
  }

  try {
    const sourceBuffer = Buffer.from(await sourceFile.arrayBuffer());
    const fieldsToKeep = fieldsToKeepStr ? JSON.parse(fieldsToKeepStr) : undefined;
    const replaceFields = replaceFieldsStr ? JSON.parse(replaceFieldsStr) : undefined;

    const results = await Promise.all(
      targetFiles.map(async (targetFile) => {
        const targetBuffer = Buffer.from(await targetFile.arrayBuffer());

        const options: MetadataCopyOptions = {
          sourceFile: sourceBuffer,
          targetFile: targetBuffer,
          fieldsToKeep,
          fieldsToReplace: replaceFields,
        };

        const resultBuffer = await copyMetadata(
          sourceBuffer,
          targetBuffer,
          sourceFile.name,
          targetFile.name,
          options
        );

        return {
          fileName: targetFile.name,
          originalSize: targetBuffer.length,
          resultSize: resultBuffer.length,
          data: resultBuffer.toString('base64'),
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      files: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Metadata copy failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
