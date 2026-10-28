/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  X,
  Scan,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  SwitchCamera,
  Flashlight,
  VideoOff,
  Video
} from 'lucide-react';
import { MaterialItem, MachineEquipment } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (code: string) => void;
  materials: MaterialItem[];
  machines: MachineEquipment[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
  materials,
  machines
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedMessage, setScannedMessage] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setTorchOn(false);
  }, []);

  // Request Camera with progressive fallback
  const startCamera = useCallback(async (preferredFacing: 'environment' | 'user' = facingMode, deviceId?: string) => {
    setIsInitializing(true);
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Este navegador não possui suporte para acesso direto à câmera (WebRTC mediaDevices). Utilize a simulação rápida ou digitação.');
      setIsInitializing(false);
      return;
    }

    try {
      // 1. Try with deviceId if explicitly selected, or with ideal facingMode
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: preferredFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn('Initial constraint failed, falling back to basic { video: true }', firstErr);
        // Fallback to any camera available (laptops without environment camera)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Required for iOS Safari and mobile Chrome
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;

        await videoRef.current.play();
        setStreamActive(true);
      }

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as any;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      }

      // Enumerate cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
      } catch {
        // Ignore
      }

      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera request error:', err);
      let message = 'Não foi possível acessar a câmera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Permissão de acesso à câmera foi negada. Permita o uso da câmera nas configurações do navegador ou utilize os botões de simulação rápida abaixo.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Nenhuma câmera foi detectada neste computador ou dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'A câmera está sendo utilizada por outro aplicativo no momento.';
      }
      setCameraError(message);
      setIsInitializing(false);
    }
  }, [facingMode, stopCamera]);

  // Handle detection from camera frames
  const handleSelectCode = useCallback((code: string) => {
    if (scannedMessage) return; // Prevent double trigger
    setScannedMessage(`Código detectado: ${code}`);

    // Audio beep simulation via Web Audio API if available
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880; // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Ignore
    }

    setTimeout(() => {
      stopCamera();
      onScanResult(code);
      onClose();
    }, 600);
  }, [scannedMessage, stopCamera, onScanResult, onClose]);

  // Real-time camera optical scan loop with Native BarcodeDetector (Supported in modern Chrome/Android)
  useEffect(() => {
    let active = true;

    if (streamActive && videoRef.current && 'BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'code_39', 'data_matrix']
        });

        const checkFrame = async () => {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) {
            scanLoopRef.current = requestAnimationFrame(checkFrame);
            return;
          }

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const detectedValue = barcodes[0].rawValue;
              if (detectedValue) {
                handleSelectCode(detectedValue.trim());
                return;
              }
            }
          } catch {
            // Ignore frame decode errors
          }

          if (active) {
            scanLoopRef.current = requestAnimationFrame(checkFrame);
          }
        };

        scanLoopRef.current = requestAnimationFrame(checkFrame);
      } catch (err) {
        console.warn('BarcodeDetector error:', err);
      }
    }

    return () => {
      active = false;
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    };
  }, [streamActive, handleSelectCode]);

  // Start on modal open
  useEffect(() => {
    if (isOpen) {
      setScannedMessage(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Toggle Front / Back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Toggle Torch if supported
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } catch {
        // Torch constraint failed
      }
    }
  };

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSelectCode(manualCode.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-4">
        {/* Header */}
        <div className="bg-blue-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Scan className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-bold text-sm">Leitor Óptico de QR Code & Código de Barras</h3>
              <p className="text-[11px] text-blue-200">Sensor óptico em tempo real para prateleiras e materiais</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 text-blue-200 hover:text-white rounded-lg hover:bg-blue-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Feed Area */}
        <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
          {/* Real Video Element */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-300 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
            playsInline
            autoPlay
            muted
          />

          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Loading or Error Fallback */}
          {!streamActive && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center text-slate-300 space-y-3 bg-slate-900">
              {isInitializing ? (
                <>
                  <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                  <p className="text-xs text-slate-300 font-semibold">
                    Iniciando sensor óptico da câmera...
                  </p>
                </>
              ) : (
                <>
                  <VideoOff className="w-10 h-10 text-slate-500" />
                  <div className="max-w-xs space-y-1">
                    <p className="text-xs text-slate-200 font-bold">
                      {cameraError ? 'Aviso do Sensor de Vídeo' : 'Câmera não conectada'}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {cameraError || 'Clique no botão abaixo para tentar conectar a câmera do seu dispositivo.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Video className="w-4 h-4" />
                    <span>Conectar / Permitir Câmera</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Optical Targeting Reticle & Scanning Laser Line */}
          {streamActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 border-2 border-red-500 rounded-2xl relative shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-red-600 rounded-tl-md"></div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-red-600 rounded-tr-md"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-red-600 rounded-bl-md"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-red-600 rounded-br-md"></div>

                {/* Animated Red Laser Scanning Line */}
                <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse"></div>

                {/* Hint Text */}
                <div className="absolute -bottom-7 left-0 right-0 text-center">
                  <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded shadow">
                    Aponte para o QR Code da prateleira
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Camera Controls Overlay (Top Right of Video) */}
          {streamActive && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-full backdrop-blur-md transition ${
                    torchOn ? 'bg-amber-500 text-white' : 'bg-black/50 text-white/80 hover:bg-black/70'
                  }`}
                  title="Lanterna / Flash"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/90 transition"
                title={`Alternar Câmera (${facingMode === 'environment' ? 'Traseira' : 'Frontal'})`}
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Detection Overlay */}
          {scannedMessage && (
            <div className="absolute inset-0 bg-emerald-950/85 flex items-center justify-center p-4 z-20">
              <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-2xl animate-bounce">
                <CheckCircle className="w-6 h-6" />
                <span>{scannedMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Camera Selector Dropdown (if multiple video devices detected) */}
        {availableCameras.length > 1 && (
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Câmera ativa:</span>
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                startCamera(facingMode, e.target.value);
              }}
              className="p-1 rounded border border-slate-300 text-xs bg-white text-slate-800 font-medium max-w-[200px] truncate"
            >
              {availableCameras.map((cam, idx) => (
                <option key={cam.deviceId || idx} value={cam.deviceId}>
                  {cam.label || `Câmera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Simulated Barcode Buttons (Guarantees testing in dev environments / laptops without cameras) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Simular Leitura Óptica Instantânea (1-Clique)
            </span>
            <span className="text-[10px] text-slate-400">Clique para testar</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {materials.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectCode(item.code)}
                className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-[10px] font-bold text-blue-900 group-hover:text-blue-700">{item.code}</div>
                <div className="text-[11px] text-slate-700 truncate font-medium">{item.name}</div>
                <div className="text-[9px] text-slate-400">{item.shelfLocation}</div>
              </button>
            ))}

            {machines.slice(0, 2).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectCode(m.code)}
                className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-[10px] font-bold text-blue-900 group-hover:text-blue-700">{m.code}</div>
                <div className="text-[11px] text-slate-700 truncate font-medium">{m.name}</div>
                <div className="text-[9px] text-slate-400">{m.status}</div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleSelectCode('PRAT-A01-N2')}
              className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
            >
              <div className="text-[10px] font-bold text-red-700">PRAT-A01-N2</div>
              <div className="text-[11px] text-slate-700 truncate font-medium">Nicho da Prateleira</div>
              <div className="text-[9px] text-slate-400">Setor A - Central</div>
            </button>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleManualSubmit} className="pt-1 flex gap-2">
            <input
              type="text"
              placeholder="Ou digite o código manual (Ex: MAT-EPI-01, MAQ-001)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase font-mono"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shrink-0"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
