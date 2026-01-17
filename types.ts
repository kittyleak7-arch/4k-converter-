export enum ResolutionPreset {
  UHD_4K = '4K UHD',
  QHD_2K = '2K QHD',
  FHD_1080 = '1080p FHD',
  HD_720 = '720p HD',
  CUSTOM = 'Custom'
}

export enum OutputFormat {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp'
}

export enum FitMode {
  CONTAIN = 'Contain (Fit)',
  COVER = 'Cover (Fill)',
  STRETCH = 'Stretch'
}

export interface ProcessingSettings {
  preset: ResolutionPreset;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number; // 0 to 1
  fitMode: FitMode;
  keepAspectRatio: boolean;
  backgroundColor: string;
}

export interface ResolutionDef {
  width: number;
  height: number;
}

export const RESOLUTIONS: Record<ResolutionPreset, ResolutionDef> = {
  [ResolutionPreset.UHD_4K]: { width: 3840, height: 2160 },
  [ResolutionPreset.QHD_2K]: { width: 2560, height: 1440 },
  [ResolutionPreset.FHD_1080]: { width: 1920, height: 1080 },
  [ResolutionPreset.HD_720]: { width: 1280, height: 720 },
  [ResolutionPreset.CUSTOM]: { width: 0, height: 0 },
};
