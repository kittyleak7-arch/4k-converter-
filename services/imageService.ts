import { ProcessingSettings, FitMode, ResolutionPreset, RESOLUTIONS } from '../types';

export interface ProcessedImage {
  blob: Blob;
  url: string;
  filename: string;
  width: number;
  height: number;
}

export const processImage = async (
  sourceFile: File,
  settings: ProcessingSettings
): Promise<ProcessedImage> => {
  // 1. Load image securely into memory
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(sourceFile);
  } catch (e) {
    // Fallback for browsers that might have issues with createImageBitmap for certain types
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
           const processed = await renderToCanvas(img, sourceFile.name, settings);
           resolve(processed);
        } catch(err) {
           reject(err);
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(sourceFile);
    });
  }

  return renderToCanvas(bitmap, sourceFile.name, settings);
};

const renderToCanvas = async (
  imageSource: CanvasImageSource,
  originalFilename: string,
  settings: ProcessingSettings
): Promise<ProcessedImage> => {
    // 2. Determine target dimensions
    let targetWidth = settings.width;
    let targetHeight = settings.height;
  
    if (settings.preset !== ResolutionPreset.CUSTOM) {
      const presetDims = RESOLUTIONS[settings.preset];
      targetWidth = presetDims.width;
      targetHeight = presetDims.height;
    }
    
    // Safety check
    if (!targetWidth || targetWidth <= 0) targetWidth = (imageSource as any).width || 1920;
    if (!targetHeight || targetHeight <= 0) targetHeight = (imageSource as any).height || 1080;
  
    // 3. Create Canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
  
    // 4. High Quality Settings for upscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  
    // 5. Draw Background (default black if not specified, or white/transparent based on needs)
    // For JPEG, transparent becomes black, so we fill based on setting
    if (settings.format === 'image/jpeg' && settings.backgroundColor === 'transparent') {
        ctx.fillStyle = '#000000'; // Default to black for JPEGs if transparent chosen
    } else {
        ctx.fillStyle = settings.backgroundColor;
    }
    
    // Clear/Fill
    if (settings.backgroundColor !== 'transparent') {
        ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
    }
  
    // 6. Calculate Draw Position (Fit Mode)
    let drawX = 0;
    let drawY = 0;
    let drawW = targetWidth;
    let drawH = targetHeight;
  
    const srcW = (imageSource as any).width;
    const srcH = (imageSource as any).height;
    const srcRatio = srcW / srcH;
    const dstRatio = targetWidth / targetHeight;
  
    if (settings.fitMode === FitMode.CONTAIN) {
      if (srcRatio > dstRatio) {
        // Source is wider than dest: fit to width
        drawW = targetWidth;
        drawH = targetWidth / srcRatio;
        drawY = (targetHeight - drawH) / 2;
      } else {
        // Source is taller than dest: fit to height
        drawH = targetHeight;
        drawW = targetHeight * srcRatio;
        drawX = (targetWidth - drawW) / 2;
      }
    } else if (settings.fitMode === FitMode.COVER) {
      if (srcRatio > dstRatio) {
        // Source is wider: crop sides
        drawH = targetHeight;
        drawW = targetHeight * srcRatio;
        drawX = (targetWidth - drawW) / 2;
      } else {
        // Source is taller: crop top/bottom
        drawW = targetWidth;
        drawH = targetWidth / srcRatio;
        drawY = (targetHeight - drawH) / 2;
      }
    } 
    // STRETCH is default (0,0,w,h)
  
    // 7. Draw Image
    ctx.drawImage(imageSource, drawX, drawY, drawW, drawH);
  
    // 8. Export
    // Quality mapping: 0.0 to 1.0. PNG ignores quality.
    const quality = settings.format === 'image/png' ? undefined : settings.quality;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob failed'));
            return;
          }
          const url = URL.createObjectURL(blob);
          
          // Generate filename
          const nameParts = originalFilename.split('.');
          if (nameParts.length > 1) nameParts.pop(); // remove extension
          const baseName = nameParts.join('.');
          
          let ext = 'jpg';
          if (settings.format === 'image/png') ext = 'png';
          if (settings.format === 'image/webp') ext = 'webp';
          
          const filename = `${baseName}_${targetWidth}x${targetHeight}_${settings.preset.replace(/\s/g,'')}.${ext}`;
  
          resolve({
            blob,
            url,
            filename,
            width: targetWidth,
            height: targetHeight
          });
        },
        settings.format,
        quality
      );
    });
}
