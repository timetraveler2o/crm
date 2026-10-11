import React from 'react';
import { CardData, CardType } from '../../paymentTypes';
import { getCardBrandName, maskCardNumber } from '../../services/cardService';

interface CreditCardProps {
  data: CardData;
  cardType: CardType;
  isFlipped: boolean;
  isVisible: boolean;
}

const CreditCard: React.FC<CreditCardProps> = ({ data, cardType, isFlipped, isVisible }) => {
  const brandName = getCardBrandName(cardType);

  const getLogo = (type: CardType) => {
    switch (type) {
      case 'visa': 
        return <span className="text-white font-black italic text-2xl tracking-tighter drop-shadow-lg">VISA</span>;
      case 'mastercard': 
        return (
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full bg-red-500 opacity-95 shadow-sm"></div>
            <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-95 shadow-sm"></div>
          </div>
        );
      case 'amex': 
        return (
          <div className="bg-white px-2 py-1 rounded shadow-md flex items-center justify-center border border-slate-100">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" 
              className="h-6 w-auto block" 
              alt="Amex" 
            />
          </div>
        );
      case 'discover': 
        return (
          <div className="flex items-center gap-1">
            <span className="text-white font-extrabold text-xl italic tracking-tighter drop-shadow-md">
              <span className="text-orange-400">D</span>iscover
            </span>
          </div>
        );
      case 'jcb': 
        return (
          <div className="bg-white px-1.5 py-0.5 rounded flex items-center shadow-sm">
             <img src="https://upload.wikimedia.org/wikipedia/commons/4/40/JCB_logo.svg" className="h-5" alt="JCB" />
          </div>
        );
      default: 
        return <span className="text-white/30 font-black italic text-lg uppercase tracking-[0.2em]">CARD</span>;
    }
  };

  const displayNumber = data.number 
    ? (isVisible ? data.number : maskCardNumber(data.number)) 
    : '•••• •••• •••• ••••';

  const holderName = data.name || 'FULL NAME';

  return (
    <div className="gsf-card-wrapper">
      <style>{`
        .gsf-card-wrapper {
          perspective: 1200px;
          width: 100%;
          max-width: 400px;
          height: 240px;
          margin: 0 auto;
        }
        .gsf-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .gsf-card-inner.flipped {
          transform: rotateY(180deg);
        }
        .gsf-card-front, .gsf-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 1.25rem;
          overflow: hidden;
        }
        .gsf-card-back {
          transform: rotateY(180deg);
        }
        .gsf-card-wrapper:hover .gsf-card-inner:not(.flipped) {
          transform: rotateY(-8deg) rotateX(4deg);
        }
        .gsf-card-wrapper:hover .gsf-card-inner.flipped {
          transform: rotateY(172deg) rotateX(4deg);
        }
        @keyframes gsf-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .gsf-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 60%, transparent 100%);
          background-size: 200% 100%;
          animation: gsf-shimmer 3s ease-in-out infinite;
        }
      `}</style>

      <div className={`gsf-card-inner ${isFlipped ? 'flipped' : ''}`}>
        
        {/* Front Side */}
        <div className="gsf-card-front shadow-2xl shadow-orange-900/20 p-7 flex flex-col justify-between text-white"
             style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 80%, #475569 100%)' }}>
          
          {/* Shimmer overlay */}
          <div className="gsf-shimmer absolute inset-0 pointer-events-none rounded-[1.25rem]"></div>
          
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-12 -mb-12"></div>
          
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:24px_24px]"></div>
          </div>

          {/* Top Row */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex flex-col gap-2">
              {/* Chip */}
              <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-lg shadow-lg border border-yellow-200/30 overflow-hidden relative">
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-px opacity-30">
                  {[...Array(12)].map((_, i) => <div key={i} className="border border-black/30"></div>)}
                </div>
              </div>
              {/* NFC icon */}
              <div className="flex gap-0.5 items-center">
                <svg className="w-4 h-4 text-white/40 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12a10 10 0 0 1 10-10"/><path d="M2 12a6 6 0 0 1 6-6"/><path d="M2 12a2 2 0 0 1 2-2"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="min-h-[44px] flex items-center">
                {getLogo(cardType)}
              </div>
              {brandName && (
                <span className="text-[9px] font-black tracking-[0.25em] uppercase text-white/70">
                  {brandName}
                </span>
              )}
            </div>
          </div>

          {/* Card Number */}
          <div className="relative z-10 my-2">
            <p className="text-xl md:text-[1.4rem] font-mono tracking-[0.25em] text-center leading-none drop-shadow-xl"
               style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              {displayNumber}
            </p>
          </div>

          {/* Bottom Row */}
          <div className="flex justify-between items-end relative z-10">
            <div className="flex flex-col min-w-0 flex-1 pr-6">
              <span className="text-[8px] uppercase text-white/40 font-bold mb-1 tracking-[0.2em]">Card Holder</span>
              <span className="text-sm font-bold tracking-[0.1em] uppercase truncate block drop-shadow-md">
                {holderName}
              </span>
            </div>
            <div className="flex flex-col text-right shrink-0">
              <span className="text-[8px] uppercase text-white/40 font-bold mb-1 tracking-[0.2em]">Expires</span>
              <span className="text-sm font-bold tracking-widest drop-shadow-md">
                {data.expiryMonth && data.expiryYear ? `${data.expiryMonth}/${data.expiryYear.slice(-2)}` : 'MM/YY'}
              </span>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="gsf-card-back shadow-2xl shadow-orange-900/20 text-white flex flex-col py-6"
             style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 80%, #475569 100%)' }}>
          
          {/* Magnetic strip */}
          <div className="w-full h-12 bg-black/60 mt-3 mb-6 shadow-lg"></div>
          
          <div className="px-8 flex flex-col space-y-6">
            {/* CVV */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase text-white/50 font-black mb-2 pr-2 tracking-[0.2em]">Security CVV</span>
              <div className="w-full h-11 bg-white/10 backdrop-blur-md flex items-center justify-end px-6 rounded-lg shadow-inner border border-white/10">
                <span className="text-white font-mono font-bold italic tracking-[0.5em] text-xl">
                  {data.cvv || '•••'}
                </span>
              </div>
            </div>
            
            {/* Logo */}
            <div className="flex justify-end pt-1 opacity-80">
                {getLogo(cardType)}
            </div>
          </div>
          
          <div className="mt-auto px-8 pb-4">
             <div className="text-[8px] text-white/25 leading-tight uppercase font-bold tracking-wider">
               Authorized Signature • Not valid unless signed • Payment via Get Set Flight Secure Channel
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreditCard;
