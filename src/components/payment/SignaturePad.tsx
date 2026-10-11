import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string) => void;
  label?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange, label = "Signature" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set background to white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a'; // slate-900
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setIsEmpty(false);
    }
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
    saveSignature();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onSignatureChange('');
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && !isEmpty) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  return (
    <div className="space-y-2 w-full">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label} *</label>
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white relative shadow-sm transition-all focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-50">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full h-[150px] cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 font-medium italic flex items-center gap-1 pointer-events-none">
          Powered by <span className="text-orange-600 font-bold not-italic">right Signature</span>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearSignature}
          className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
