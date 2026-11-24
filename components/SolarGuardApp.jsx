'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  loadSolarGuardModel,
  predictImageElement,
  validateImageFile,
} from '@/lib/tfModel';

const metadata = {
  'Bird-drop': {
    rec: 'Partial shading detected. Wash the panel surface to prevent thermal stress and energy loss.',
    urgency: 'Maintenance Needed',
    color: 'bg-amber-100 text-amber-700',
  },
  Clean: {
    rec: 'No surface anomalies found. Energy absorption is at maximum efficiency.',
    urgency: 'Optimal Condition',
    color: 'bg-emerald-100 text-emerald-700',
  },
  Dusty: {
    rec: 'Moderate soiling layer detected. Efficiency is likely reduced by 5-10%.',
    urgency: 'Minor Cleaning',
    color: 'bg-blue-100 text-blue-700',
  },
  'Electrical-damage': {
    rec: 'High Risk: Internal electrical failure detected. Disconnect string to prevent fire hazard.',
    urgency: 'Urgent Danger',
    color: 'bg-red-100 text-red-700',
  },
  'Physical-Damage': {
    rec: 'Cracked glass or cell fractures found. Monitor for water ingress and rapid degradation.',
    urgency: 'Attention',
    color: 'bg-orange-100 text-orange-700',
  },
  'Snow-Covered': {
    rec: 'Total occlusion detected. Output is zero. Surface requires clearing.',
    urgency: 'Obstructed',
    color: 'bg-slate-200 text-slate-700',
  },
};

function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode selected image.'));
    img.src = src;
  });
}

export default function SolarGuardApp() {
  const fileInputRef = useRef(null);
  const [view, setView] = useState('upload'); // 'upload' | 'preview' | 'loading' | 'result'
  const [imageSrc, setImageSrc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState({
    className: 'Result',
    recommendation: '--',
    urgency: '--',
    color: '',
    confidence: 0,
  });

  // Preload TensorFlow.js model in the background on mount
  useEffect(() => {
    loadSolarGuardModel().catch(() => {
      // Errors are surfaced cleanly if the user triggers prediction before the model is available
    });
  }, []);

  function handleFile(file) {
    const check = validateImageFile(file);
    if (!check.valid) {
      alert(`Error: ${check.error}`);
      resetUI();
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setView('preview');
    };
    reader.onerror = () => {
      alert('Error: Failed to read selected image file.');
      resetUI();
    };
    reader.readAsDataURL(file);
  }

  function resetUI() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    setImageSrc('');
    setView('upload');
  }

  function handleDragEvent(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleInputChange(e) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  async function handlePredict() {
    if (!selectedFile || !imageSrc || view === 'loading') return;

    setView('loading');

    try {
      const imgElement = await loadHtmlImage(imageSrc);
      const data = await predictImageElement(imgElement);

      const info = metadata[data.class_name] || {
        rec: 'Standard operation.',
        urgency: 'N/A',
        color: 'bg-slate-100 text-slate-500',
      };

      setResult({
        className: data.class_name || 'Unknown',
        recommendation: info.rec,
        urgency: info.urgency,
        color: info.color,
        confidence: data.confidence || 0,
      });
      setView('result');
    } catch (error) {
      alert(`Error: ${error.message}`);
      resetUI();
    }
  }

  return (
    <>
      <main className="w-full max-w-3xl px-6 flex-grow flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="sun-animation inline-block mb-4">
            <div className="relative inline-block">
              <i className="fas fa-sun text-amber-400 text-5xl"></i>
              <i className="fas fa-search text-emerald-600 text-2xl absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm"></i>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Automated Module Inspection
          </h2>
          <p className="text-slate-500 mt-3 text-lg max-w-xl mx-auto">
            Instantly scan for micro-cracks, soiling, and thermal anomalies to
            ensure every cell operates at peak efficiency.
          </p>
        </div>

        <div className="relative">
          <div
            id="drop-zone"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            onDragOver={handleDragEvent}
            onDragLeave={handleDragEvent}
            onDrop={handleDrop}
            className={`${view === 'upload' ? '' : 'hidden '}solar-glass border-2 border-dashed border-emerald-300 rounded-[3rem] p-16 text-center cursor-pointer upload-area`}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="file-input"
              className="hidden"
              accept="image/*"
              onChange={handleInputChange}
            />
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <i className="fas fa-cloud-arrow-up text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold">Select Module Photo</h3>
            <p className="text-slate-400 text-sm mt-2">
              Supports JPG, JPEG, IMG, and PNG formats
            </p>
          </div>

          <div
            id="preview-container"
            className={`${view === 'preview' ? '' : 'hidden '}space-y-6`}
          >
            <div className="relative solar-glass p-3 rounded-[3rem]">
              {imageSrc && (
                <div className="relative w-full h-96 overflow-hidden rounded-[2.5rem] shadow-sm">
                  <Image
                    id="image-preview"
                    src={imageSrc}
                    alt="Solar module preview"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                </div>
              )}
              <button
                id="remove-btn"
                type="button"
                onClick={resetUI}
                className="absolute top-8 right-8 z-10 bg-white/90 w-12 h-12 rounded-2xl flex items-center justify-center text-red-500 shadow-xl hover:scale-110 transition-transform"
              >
                <i className="fas fa-trash-can"></i>
              </button>
            </div>
            <button
              id="predict-btn"
              type="button"
              onClick={handlePredict}
              className="w-full bg-emerald-700 text-white py-4 rounded-[2rem] font-bold text-lg hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3"
            >
              <i className="fas fa-wand-magic-sparkles"></i> Run AI Analysis
            </button>
          </div>

          <div
            id="loading-state"
            className={`${view === 'loading' ? '' : 'hidden '}py-24 text-center solar-glass rounded-[3rem]`}
          >
            <div className="flex flex-col items-center">
              <div className="loading-ring mb-6"></div>
              <p className="font-bold text-emerald-900 tracking-widest uppercase text-xs">
                Processing Visual Data
              </p>
            </div>
          </div>

          <div
            id="result-section"
            className={`${view === 'result' ? '' : 'hidden '}animate-in fade-in zoom-in duration-500`}
          >
            <div className="solar-glass rounded-[3rem] overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="p-10 flex-grow space-y-6">
                  <div>
                    <div
                      id="urgency-badge"
                      className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${result.color}`}
                    >
                      {result.urgency}
                    </div>
                    <h2
                      id="result-label"
                      className="text-5xl font-extrabold text-emerald-950"
                    >
                      {result.className}
                    </h2>
                  </div>

                  <div className="bg-white/50 p-6 rounded-3xl border border-white/60">
                    <h4 className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-3">
                      Diagnostic Advice
                    </h4>
                    <p
                      id="result-recommendation"
                      className="text-emerald-900 font-medium leading-relaxed italic"
                    >
                      {result.recommendation}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Confidence
                      </span>
                      <span
                        id="confidence-val"
                        className="text-2xl font-black text-emerald-600"
                      >
                        {result.confidence}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={resetUI}
                      className="bg-emerald-50 px-6 py-3 rounded-2xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors uppercase tracking-widest"
                    >
                      New Scan
                    </button>
                  </div>
                </div>
                <div className="relative w-full md:w-64 h-80 md:h-auto border-l border-white/40 shrink-0">
                  {imageSrc && (
                    <Image
                      id="result-image"
                      src={imageSrc}
                      alt="Analyzed solar module"
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 256px"
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
