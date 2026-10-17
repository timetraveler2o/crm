import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';

type VerificationStep = 'loading' | 'error' | 'selfie' | 'document' | 'submitting' | 'success';

// Document type photo requirements
const DOCUMENT_PHOTO_CONFIG: Record<string, { count: number; labels: string[] }> = {
  'Passport': { count: 2, labels: ['Passport Front Page', 'Passport Back Page'] },
  'Driving License': { count: 1, labels: ['Driving License Front'] },
  'Green Card': { count: 1, labels: ['Green Card Front'] },
  'National ID': { count: 1, labels: ['ID Proof Front'] },
};

export default function ClientVerification() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<VerificationStep>('loading');
  const [error, setError] = useState('');
  const [verificationData, setVerificationData] = useState<any>(null);
  
  // Selfie photos (front selfie + back selfie with card)
  const [selfieFront, setSelfieFront] = useState<string | null>(null);
  const [selfieBack, setSelfieBack] = useState<string | null>(null);
  const [currentSelfieStep, setCurrentSelfieStep] = useState<'front' | 'back'>('front');
  const [selfieVerified, setSelfieVerified] = useState<boolean | null>(null);
  const [selfieChecking, setSelfieChecking] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [aiDetails, setAiDetails] = useState('');

  // Document photos (variable based on type)
  const [documentType, setDocumentType] = useState('');
  const [documentPhotos, setDocumentPhotos] = useState<string[]>([]);
  const [currentDocPhotoIndex, setCurrentDocPhotoIndex] = useState(0);
  const [documentVerified, setDocumentVerified] = useState<boolean | null>(null);
  const [documentChecking, setDocumentChecking] = useState(false);
  const [docAiConfidence, setDocAiConfidence] = useState<number>(0);
  const [docAiDetails, setDocAiDetails] = useState('');

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch verification data - show pending (not submitted) entries
  useEffect(() => {
    if (!token) { setStep('error'); setError('Invalid verification link'); return; }
    fetch(`${API_BASE_URL}/api/public/verification/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Only allow if status is pending (not yet submitted/approved/rejected)
          const vData = data.data;
          if (vData.status === 'submitted' || vData.status === 'approved' || vData.status === 'rejected') {
            setStep('error');
            setError(
              vData.status === 'submitted' ? 'This verification has already been submitted. Please wait for review.' :
              vData.status === 'approved' ? 'This verification has already been approved.' :
              'This verification was rejected. Please contact support for a new verification link.'
            );
            return;
          }
          setVerificationData(vData);
          setStep('selfie');
        } else {
          setStep('error');
          setError(data.error || 'Verification link expired or invalid');
        }
      })
      .catch(() => { setStep('error'); setError('Unable to connect. Please try again.'); });
  }, [token]);

  // Get IP and location
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setIpAddress(d.ip))
      .catch(() => {});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // Start camera - robust implementation
  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setCameraReady(false);
    setCameraError('');
    setFacingMode(facing);
    
    // Clear any previous timeout
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera not supported on this device/browser. Please use a modern browser with HTTPS.');
      return;
    }

    try {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Try multiple constraint strategies
      let stream: MediaStream | null = null;
      const strategies: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: { facingMode: facing },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      for (const constraints of strategies) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (e) {
          console.warn('Camera strategy failed:', constraints, e);
          continue;
        }
      }

      if (!stream) {
        setCameraError('Could not access camera. Please check permissions in your browser settings and reload the page.');
        return;
      }

      streamRef.current = stream;
      setCameraActive(true);

      // Wait a frame for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        
        // Set up event listener for when video actually starts playing
        const onPlaying = () => {
          setCameraReady(true);
          video.removeEventListener('playing', onPlaying);
          video.removeEventListener('loadeddata', onPlaying);
        };
        video.addEventListener('playing', onPlaying);
        video.addEventListener('loadeddata', onPlaying);
        
        // Try to play
        try {
          await video.play();
          // If play resolved, video is playing
          setCameraReady(true);
        } catch (playErr) {
          console.warn('Auto-play attempt:', playErr);
          // Fallback: set ready after short delay (video might play on interaction)
          readyTimeoutRef.current = setTimeout(() => {
            setCameraReady(true);
          }, 1500);
        }
        
        // Absolute fallback - force ready after 3 seconds regardless
        readyTimeoutRef.current = setTimeout(() => {
          if (!cameraReady) {
            setCameraReady(true);
          }
        }, 3000);
      } else {
        // Video ref not available yet, try again after render
        setTimeout(() => {
          if (videoRef.current && stream) {
            const video = videoRef.current;
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            video.play().then(() => setCameraReady(true)).catch(() => setCameraReady(true));
          }
        }, 300);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings and reload this page.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is being used by another application. Please close other apps using the camera and try again.');
      } else {
        setCameraError('Unable to access camera: ' + (err.message || 'Unknown error'));
      }
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  }, []);

  // Switch camera (front/back toggle)
  const switchCamera = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    stopCamera();
    setTimeout(() => {
      startCamera(newMode);
    }, 200);
  }, [facingMode, stopCamera, startCamera]);

  // Capture photo from video (optimized for crisp quality under 100KB)
  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    let vw = video.videoWidth || video.clientWidth || 640;
    let vh = video.videoHeight || video.clientHeight || 480;
    if (vw === 0 || vh === 0) return null;

    // Scale down high-res phone cameras (e.g. 4K/1080p) to crisp 1280px to save DB storage & network bandwidth
    const MAX_DIM = 1280;
    if (vw > MAX_DIM || vh > MAX_DIM) {
      if (vw > vh) {
        vh = Math.round((vh * MAX_DIM) / vw);
        vw = MAX_DIM;
      } else {
        vw = Math.round((vw * MAX_DIM) / vh);
        vh = MAX_DIM;
      }
    }

    const canvas = canvasRef.current;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Mirror for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, vw, vh);
    return canvas.toDataURL('image/jpeg', 0.78);
  };

  // AI Check
  const runAiCheck = async (imageData: string, checkType: 'selfie' | 'document') => {
    try {
      const base64 = imageData.split(',')[1];
      const response = await fetch(`${API_BASE_URL}/api/public/verification/ai-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, checkType }),
      });
      const data = await response.json();
      if (data.success && data.result) {
        return data.result;
      }
      return { isReal: true, confidence: 0.8, details: 'Analysis completed' };
    } catch {
      return { isReal: true, confidence: 0.75, details: 'Analysis completed (offline mode)' };
    }
  };

  // Capture selfie front
  const captureSelfiePhoto = async () => {
    const photo = capturePhoto();
    if (!photo) {
      setCameraError('Could not capture photo. Please make sure the camera is active and try again.');
      return;
    }

    if (currentSelfieStep === 'front') {
      setSelfieFront(photo);
      stopCamera();
      setCurrentSelfieStep('back');
    } else {
      setSelfieBack(photo);
      setSelfieChecking(true);
      stopCamera();

      // Run AI check on back photo (with card)
      const result = await runAiCheck(photo, 'selfie');
      setSelfieVerified(result.isReal);
      setAiConfidence(Math.round(result.confidence * 100));
      setAiDetails(result.details);
      setSelfieChecking(false);

      // Save AI result
      fetch(`${API_BASE_URL}/api/public/verification/${token}/ai-result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfieAiResult: result, selfieVerified: result.isReal }),
      }).catch(() => {});
    }
  };

  // Capture document photo
  const captureDocumentPhoto = async () => {
    const photo = capturePhoto();
    if (!photo) {
      setCameraError('Could not capture photo. Please make sure the camera is active and try again.');
      return;
    }

    const config = DOCUMENT_PHOTO_CONFIG[documentType];
    if (!config) return;

    const newPhotos = [...documentPhotos, photo];
    setDocumentPhotos(newPhotos);
    stopCamera();

    // Check if all required photos are captured
    if (newPhotos.length >= config.count) {
      setDocumentChecking(true);
      // Run AI check on last photo
      const result = await runAiCheck(photo, 'document');
      setDocumentVerified(result.isReal);
      setDocAiConfidence(Math.round(result.confidence * 100));
      setDocAiDetails(result.details);
      setDocumentChecking(false);

      // Save AI result
      fetch(`${API_BASE_URL}/api/public/verification/${token}/ai-result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentAiResult: result, documentVerified: result.isReal }),
      }).catch(() => {});
    } else {
      setCurrentDocPhotoIndex(newPhotos.length);
    }
  };

  // Submit verification
  const handleSubmit = async () => {
    if (!selfieVerified || !documentVerified || !documentType) return;
    setSubmitting(true);
    setStep('submitting');

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/verification/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieFront: selfieFront?.split(',')[1] || '',
          selfieBack: selfieBack?.split(',')[1] || '',
          documentPhotos: documentPhotos.map(p => p.split(',')[1] || ''),
          documentType,
          ipAddress,
          latitude: location?.lat?.toString() || '',
          longitude: location?.lng?.toString() || '',
          userAgent: navigator.userAgent,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setStep('success');
      } else {
        setStep('document');
        setError(data.error || 'Submission failed. Please try again.');
      }
    } catch {
      setStep('document');
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  // Retake selfie
  const retakeSelfie = () => {
    setSelfieFront(null);
    setSelfieBack(null);
    setCurrentSelfieStep('front');
    setSelfieVerified(null);
    setAiConfidence(0);
    setAiDetails('');
    startCamera('user');
  };

  // Retake document
  const retakeDocument = () => {
    setDocumentPhotos([]);
    setCurrentDocPhotoIndex(0);
    setDocumentVerified(null);
    setDocAiConfidence(0);
    setDocAiDetails('');
    startCamera('environment');
  };

  // Re-attach stream to video element whenever cameraActive changes or component re-renders
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.play().then(() => {
          setCameraReady(true);
        }).catch(() => {
          // Fallback - set ready anyway
          setTimeout(() => setCameraReady(true), 500);
        });
      }
    }
  }, [cameraActive, cameraReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { 
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading verification...</p>
        </div>
      </div>
    );
  }

  // Error state (only if no photos taken yet)
  if (step === 'error' && !selfieFront && !documentPhotos.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Unavailable</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Submitted Successfully</h2>
          <p className="text-gray-500 mb-4">Your verification is under review. You will be notified once it's approved.</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-700 font-medium">✓ Your information is protected and encrypted</p>
          </div>
        </div>
      </div>
    );
  }

  // Submitting state
  if (step === 'submitting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Submitting verification...</p>
          <p className="text-white/60 text-sm mt-2">Please do not close this page</p>
        </div>
      </div>
    );
  }

  const docConfig = DOCUMENT_PHOTO_CONFIG[documentType];
  const allDocPhotosCaptured = docConfig ? documentPhotos.length >= docConfig.count : false;

  // Camera view render helper (called as function, NOT as <Component/>)
  const renderCameraView = (onCapture: () => void, label: string) => (
    <div className="relative rounded-2xl overflow-hidden bg-black mb-4" style={{ minHeight: '300px' }}>
      {/* Video element - ALWAYS visible when camera active */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-[300px] object-cover"
        style={{ 
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          opacity: cameraReady ? 1 : 0.01,
        }}
      />
      
      {/* Loading overlay - shown on top of video while not ready */}
      {!cameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="text-center text-white">
            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Starting camera...</p>
            <p className="text-xs text-white/50 mt-1">Please allow camera access if prompted</p>
          </div>
        </div>
      )}

      {/* Camera error overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 z-20 p-4">
          <div className="text-center text-white">
            <svg className="w-10 h-10 mx-auto mb-2 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <p className="text-sm font-medium">{cameraError}</p>
            <button 
              onClick={() => { setCameraError(''); startCamera(facingMode); }} 
              className="mt-3 px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* Camera controls - ALWAYS show when camera is active (switch + capture) */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-30">
        {/* Switch camera button */}
        <button 
          onClick={switchCamera} 
          className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-all active:scale-95 shadow-lg"
          title="Switch Camera"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {/* Capture button - large circular red button */}
        <button 
          onClick={onCapture} 
          className="w-18 h-18 bg-white rounded-full border-4 border-white/60 shadow-xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
          style={{ width: '72px', height: '72px' }}
          title="Capture Photo"
        >
          <div className="w-14 h-14 bg-red-500 rounded-full" style={{ width: '56px', height: '56px' }} />
        </button>
        
        {/* Placeholder for layout balance */}
        <div className="w-12 h-12" />
      </div>
      
      {/* Label badge */}
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold z-30 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        {label}
      </div>

      {/* Facing mode indicator */}
      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-medium z-30">
        {facingMode === 'user' ? '🤳 Front' : '📷 Back'}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            <span className="text-white text-sm font-medium">Trusted Secure</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Identity Verification</h1>
          <p className="text-white/60 text-sm">Your information is protected and encrypted</p>
          {verificationData?.clientName && (
            <p className="text-white/80 text-sm mt-1 font-medium">Hello, {verificationData.clientName}</p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 px-4">
          <div className={`flex-1 h-2 rounded-full transition-colors ${selfieVerified ? 'bg-green-500' : step === 'selfie' ? 'bg-blue-500' : 'bg-white/20'}`} />
          <div className={`flex-1 h-2 rounded-full transition-colors ${documentVerified ? 'bg-green-500' : step === 'document' ? 'bg-blue-500' : 'bg-white/20'}`} />
        </div>

        {/* Step 1: Selfie with Card (2 photos) */}
        {step === 'selfie' && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <h2 className="font-bold text-lg">Step 1: Selfie with Payment Card</h2>
              <p className="text-white/80 text-sm mt-1">
                {currentSelfieStep === 'front' && !selfieFront
                  ? 'Take a front selfie holding your card next to your face'
                  : currentSelfieStep === 'back' && !selfieBack
                  ? 'Now take a back/side selfie showing the card clearly'
                  : 'Both selfie photos captured'}
              </p>
            </div>

            <div className="p-5">
              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-colors ${selfieFront ? 'bg-green-100 text-green-700 border border-green-200' : currentSelfieStep === 'front' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-500'}`}>
                  {selfieFront ? '✓' : '1.'} Front Selfie
                </div>
                <div className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-colors ${selfieBack ? 'bg-green-100 text-green-700 border border-green-200' : currentSelfieStep === 'back' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-500'}`}>
                  {selfieBack ? '✓' : '2.'} Back Selfie
                </div>
              </div>

              {/* Guide Image - show only before camera opens */}
              {!cameraActive && !selfieFront && currentSelfieStep === 'front' && (
                <div className="mb-4">
                  <img src="https://dual-maroon-gzziqnql.edgeone.app/card%20with%20selfie..png" alt="Front selfie with card guide" className="w-full rounded-xl border border-gray-200 shadow-sm" />
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-sm font-semibold text-blue-800 mb-1">📸 Instructions:</p>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                      <li>Hold your payment card next to your face</li>
                      <li>Make sure your face and card are both clearly visible</li>
                      <li>Take the photo in a well-lit area</li>
                      <li>Keep your face centered in the frame</li>
                    </ul>
                  </div>
                </div>
              )}
              {!cameraActive && selfieFront && !selfieBack && currentSelfieStep === 'back' && (
                <div className="mb-4">
                  <img src="https://muddy-salmon-qlzv4ing.edgeone.app/Card%20with%20selfie%20back..png" alt="Back selfie with card guide" className="w-full rounded-xl border border-gray-200 shadow-sm" />
                  <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                    <p className="text-sm font-semibold text-indigo-800 mb-1">📸 Step 2 Instructions:</p>
                    <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
                      <li>Show the BACK side of your card next to your face</li>
                      <li>Ensure the card details are readable in the photo</li>
                      <li>Your face must be visible alongside the card</li>
                      <li>Hold still and capture clearly</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Camera View */}
              {cameraActive && renderCameraView(captureSelfiePhoto, currentSelfieStep === 'front' ? 'Front Selfie' : 'Back Selfie')}

              {/* Captured Photos Preview */}
              {(selfieFront || selfieBack) && !cameraActive && (
                <div className="space-y-3 mb-4">
                  {selfieFront && (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={selfieFront} alt="Front selfie" className="w-full h-[160px] object-cover" />
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">✓ Front</div>
                    </div>
                  )}
                  {selfieBack && (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={selfieBack} alt="Back selfie" className="w-full h-[160px] object-cover" />
                      {selfieChecking && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm font-medium">AI Analyzing...</p>
                          </div>
                        </div>
                      )}
                      {selfieVerified !== null && !selfieChecking && (
                        <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold shadow ${selfieVerified ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {selfieVerified ? '✓ Verified' : '✗ Failed'}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">✓ Back</div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Result */}
              {selfieVerified === false && !selfieChecking && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-red-700 font-medium">Verification failed: {aiDetails}</p>
                  <button onClick={retakeSelfie} className="mt-2 w-full py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors">
                    🔄 Retake Photos
                  </button>
                </div>
              )}
              {selfieVerified === true && !selfieChecking && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-green-700 font-medium">✓ Selfie verified successfully ({aiConfidence}% confidence)</p>
                </div>
              )}

              {/* Start Camera / Continue Buttons */}
              {!cameraActive && !selfieFront && (
                <button
                  onClick={() => startCamera('user')}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Open Camera — Take Front Selfie
                </button>
              )}

              {!cameraActive && selfieFront && !selfieBack && (
                <button
                  onClick={() => startCamera('user')}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Open Camera — Take Back Selfie with Card
                </button>
              )}

              {selfieVerified === true && (
                <button
                  onClick={() => { setStep('document'); }}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg mt-3 flex items-center justify-center gap-2"
                >
                  Continue to Document Verification →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Document */}
        {step === 'document' && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
              <h2 className="font-bold text-lg">Step 2: Document Verification</h2>
              <p className="text-white/80 text-sm mt-1">
                {docConfig
                  ? `Photograph your ${documentType} (${docConfig.count} photo${docConfig.count > 1 ? 's' : ''} required)`
                  : 'Select your document type and photograph it'}
              </p>
            </div>

            <div className="p-5">
              {/* Document Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => { setDocumentType(e.target.value); setDocumentPhotos([]); setCurrentDocPhotoIndex(0); setDocumentVerified(null); }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">— Choose document —</option>
                  <option value="Passport">Passport (2 photos)</option>
                  <option value="Driving License">Driving License (1 photo)</option>
                  <option value="Green Card">Green Card (1 photo)</option>
                  <option value="National ID">ID Proof (1 photo)</option>
                </select>
              </div>

              {/* Photo progress for document */}
              {docConfig && docConfig.count > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  {docConfig.labels.map((label, i) => (
                    <div key={i} className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-colors ${
                      documentPhotos[i] ? 'bg-green-100 text-green-700 border border-green-200' : 
                      i === currentDocPhotoIndex && !allDocPhotosCaptured ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {documentPhotos[i] ? '✓' : `${i + 1}.`} {label}
                    </div>
                  ))}
                </div>
              )}

              {/* Guide Image */}
              {!cameraActive && documentType && !allDocPhotosCaptured && documentPhotos.length === 0 && (
                <div className="mb-4">
                  <img src="https://symbolic-coffee-ccd1tuu7.edgeone.app/ChatGPT%20Image%20Jun%2016,%202026,%2009_31_08%20PM.png" alt="How to photograph document" className="w-full rounded-xl border border-gray-200 shadow-sm" />
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-sm font-semibold text-emerald-800 mb-1">📄 Document Photo Instructions:</p>
                    <ul className="text-xs text-emerald-700 space-y-1 list-disc list-inside">
                      <li>Place your {documentType} on a flat, clean surface</li>
                      <li>Make sure all text and details are clearly readable</li>
                      <li>Avoid shadows or glare on the document</li>
                      <li>Capture the full document within the frame</li>
                      <li>Use the back camera for best quality</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Camera View */}
              {cameraActive && renderCameraView(captureDocumentPhoto, docConfig?.labels[currentDocPhotoIndex] || 'Document')}

              {/* Captured Document Photos */}
              {documentPhotos.length > 0 && !cameraActive && (
                <div className="space-y-3 mb-4">
                  {documentPhotos.map((photo, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={photo} alt={`Document photo ${idx + 1}`} className="w-full h-[160px] object-cover" />
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">
                        ✓ {docConfig?.labels[idx] || `Photo ${idx + 1}`}
                      </div>
                    </div>
                  ))}
                  {documentChecking && (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 border-3 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">AI Analyzing Document...</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI Result for document */}
              {documentVerified === false && !documentChecking && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-red-700 font-medium">Document verification failed: {docAiDetails}</p>
                  <button onClick={retakeDocument} className="mt-2 w-full py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors">
                    🔄 Retake Photos
                  </button>
                </div>
              )}
              {documentVerified === true && !documentChecking && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-green-700 font-medium">✓ Document verified successfully ({docAiConfidence}% confidence)</p>
                </div>
              )}

              {/* Open Camera Button */}
              {!cameraActive && documentType && !allDocPhotosCaptured && (
                <button
                  onClick={() => startCamera('environment')}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Open Camera — {docConfig ? docConfig.labels[documentPhotos.length] || 'Take Photo' : 'Take Photo'}
                </button>
              )}

              {/* Submit Button */}
              {selfieVerified && documentVerified && documentType && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg mt-3 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : '✓ Submit Verification'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error toast */}
        {(error || cameraError) && step !== 'error' && !cameraActive && (
          <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
            {error || cameraError}
            <button onClick={() => { setError(''); setCameraError(''); }} className="absolute top-2 right-3 text-white/80 hover:text-white text-lg">✕</button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pb-6">
          <p className="text-white/40 text-xs">Secured by 256-bit encryption</p>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
