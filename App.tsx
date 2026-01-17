import React, { useState, useEffect, useRef } from 'react';
import { 
  ResolutionPreset, 
  OutputFormat, 
  FitMode, 
  ProcessingSettings, 
  RESOLUTIONS 
} from './types';
import { processImage, ProcessedImage } from './services/imageService';

const DEFAULT_SETTINGS: ProcessingSettings = {
  preset: ResolutionPreset.UHD_4K,
  width: 3840,
  height: 2160,
  format: OutputFormat.JPEG,
  quality: 0.9,
  fitMode: FitMode.CONTAIN,
  keepAspectRatio: true,
  backgroundColor: '#000000',
};

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation State
  const isCustom = settings.preset === ResolutionPreset.CUSTOM;
  const widthError = isCustom && settings.width <= 0 ? "Width must be positive" : null;
  const heightError = isCustom && settings.height <= 0 ? "Height must be positive" : null;
  const isValid = !widthError && !heightError;

  useEffect(() => {
    return () => {
      // Cleanup URLs on unmount
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result) URL.revokeObjectURL(result.url);
    };
  }, []);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    // Cleanup old preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) {
      URL.revokeObjectURL(result.url);
      setResult(null);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetChange = (preset: ResolutionPreset) => {
    const newSettings = { ...settings, preset };
    if (preset !== ResolutionPreset.CUSTOM) {
      newSettings.width = RESOLUTIONS[preset].width;
      newSettings.height = RESOLUTIONS[preset].height;
    }
    setSettings(newSettings);
  };

  const handleProcess = async () => {
    if (!file || !isValid) return;
    setIsProcessing(true);
    try {
      // Small delay to allow UI to update to loading state
      await new Promise(r => setTimeout(r, 100));
      const processed = await processImage(file, settings);
      setResult(processed);
    } catch (error) {
      console.error(error);
      alert('Failed to process image. See console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">SecureRes</h1>
            <p className="text-xs text-gray-400">Offline 4K/2K Converter</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-850 rounded-full border border-gray-750">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></div>
          <span className="text-xs font-medium text-gray-300">Browser-only Processing • No Data Upload</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input & Preview */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* File Upload Area */}
          {!file ? (
            <div 
              className={`
                relative h-96 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
                ${dragActive ? 'border-brand-500 bg-brand-500/10' : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-850'}
              `}
              onDragEnter={onDrag} 
              onDragLeave={onDrag} 
              onDragOver={onDrag} 
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-white">Click or drag image here</p>
              <p className="text-sm text-gray-400 mt-2">Supports JPG, PNG, WEBP</p>
            </div>
          ) : (
            <div className="bg-gray-850 rounded-2xl p-1 border border-gray-750 relative group">
              <button 
                onClick={() => setFile(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-colors"
                title="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative aspect-video rounded-xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iIzIyMiI+PHJlY3Qgd2lkdGg9IjgiIGhlaWdodD0iOCIgLz48cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiAvPjwvc3ZnPg==')]">
                 <img 
                   src={previewUrl!} 
                   alt="Original" 
                   className="w-full h-full object-contain"
                 />
                 <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur text-xs rounded text-white font-mono">
                   Original: {file.name}
                 </div>
              </div>
            </div>
          )}

          {/* Result Area */}
          {result && (
            <div className="bg-brand-500/5 rounded-2xl p-6 border border-brand-500/20 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Conversion Ready</h3>
                  <p className="text-sm text-gray-400">
                    {result.width}x{result.height} • {(result.blob.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button 
                  onClick={downloadImage}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-850 rounded-2xl p-6 border border-gray-750 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Configuration
            </h2>

            {/* Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Target Resolution</label>
              <div className="grid grid-cols-2 gap-2">
                {[ResolutionPreset.UHD_4K, ResolutionPreset.QHD_2K, ResolutionPreset.FHD_1080, ResolutionPreset.CUSTOM].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`
                      px-4 py-3 rounded-lg text-sm font-medium text-left border transition-all
                      ${settings.preset === preset 
                        ? 'bg-brand-500/10 border-brand-500 text-brand-400' 
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}
                    `}
                  >
                    {preset}
                    {preset !== ResolutionPreset.CUSTOM && (
                       <span className="block text-xs text-gray-500 font-normal mt-0.5">
                         {RESOLUTIONS[preset].width} x {RESOLUTIONS[preset].height}
                       </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions */}
            {settings.preset === ResolutionPreset.CUSTOM && (
              <div className="mb-6 grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Width (px)</label>
                  <input 
                    type="number"
                    min="1"
                    value={settings.width}
                    onChange={(e) => setSettings({...settings, width: Math.max(0, parseInt(e.target.value) || 0)})}
                    className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-white outline-none focus:ring-1 transition-colors ${widthError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-brand-500 focus:ring-brand-500'}`}
                  />
                  {widthError && <p className="text-red-500 text-xs mt-1.5">{widthError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Height (px)</label>
                  <input 
                    type="number"
                    min="1"
                    value={settings.height}
                    onChange={(e) => setSettings({...settings, height: Math.max(0, parseInt(e.target.value) || 0)})}
                    className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-white outline-none focus:ring-1 transition-colors ${heightError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-brand-500 focus:ring-brand-500'}`}
                  />
                  {heightError && <p className="text-red-500 text-xs mt-1.5">{heightError}</p>}
                </div>
              </div>
            )}

            {/* Fit Mode */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Fit Mode</label>
              <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
                {Object.values(FitMode).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSettings({...settings, fitMode: mode})}
                    className={`
                      flex-1 py-1.5 text-xs font-medium rounded-md transition-all
                      ${settings.fitMode === mode 
                        ? 'bg-gray-700 text-white shadow' 
                        : 'text-gray-400 hover:text-gray-200'}
                    `}
                  >
                    {mode.split(' ')[0]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {settings.fitMode === FitMode.CONTAIN && "Resizes image to fit entirely within the box. Adds background bars."}
                {settings.fitMode === FitMode.COVER && "Fills the entire box. Crops edges of the image."}
                {settings.fitMode === FitMode.STRETCH && "Distorts image to match dimensions exactly."}
              </p>
            </div>

            {/* Background Color (Only for Contain or Transparent logic) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Background Fill</label>
              <div className="flex gap-2">
                {['#000000', '#FFFFFF', 'transparent'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSettings({...settings, backgroundColor: color})}
                    className={`
                      w-8 h-8 rounded-full border-2 flex items-center justify-center
                      ${settings.backgroundColor === color ? 'border-brand-500 scale-110' : 'border-gray-700'}
                    `}
                    style={{ background: color === 'transparent' ? 'none' : color }}
                    title={color}
                  >
                    {color === 'transparent' && <div className="w-full h-0.5 bg-red-500 -rotate-45"></div>}
                  </button>
                ))}
                <input 
                  type="color" 
                  value={settings.backgroundColor === 'transparent' ? '#000000' : settings.backgroundColor}
                  onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})}
                  className="h-8 w-8 rounded overflow-hidden cursor-pointer"
                />
              </div>
            </div>

            {/* Format & Quality */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-400 mb-2">Format</label>
              <select 
                value={settings.format}
                onChange={(e) => setSettings({...settings, format: e.target.value as OutputFormat})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white mb-4 outline-none focus:border-brand-500"
              >
                <option value={OutputFormat.JPEG}>JPEG (Best for photos)</option>
                <option value={OutputFormat.PNG}>PNG (Lossless, larger size)</option>
                <option value={OutputFormat.WEBP}>WEBP (Modern, efficient)</option>
              </select>

              {settings.format !== OutputFormat.PNG && (
                <div>
                   <div className="flex justify-between text-xs text-gray-400 mb-1">
                     <span>Quality</span>
                     <span>{Math.round(settings.quality * 100)}%</span>
                   </div>
                   <input 
                     type="range" 
                     min="0.1" 
                     max="1" 
                     step="0.05"
                     value={settings.quality} 
                     onChange={(e) => setSettings({...settings, quality: parseFloat(e.target.value)})}
                     className="w-full accent-brand-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                   />
                </div>
              )}
            </div>

            {/* Main Action */}
            <button
              onClick={handleProcess}
              disabled={!file || isProcessing || !isValid}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all
                ${!file || !isValid
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : isProcessing 
                    ? 'bg-gray-700 text-gray-300 cursor-wait'
                    : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20 hover:shadow-brand-500/30 hover:-translate-y-0.5'}
              `}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Convert Image'}
            </button>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
             <h4 className="text-blue-200 text-sm font-semibold mb-1">Privacy Guarantee</h4>
             <p className="text-blue-300/80 text-xs">
               All image processing is performed locally in your browser using the HTML5 Canvas API. Your photos never leave your device.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;