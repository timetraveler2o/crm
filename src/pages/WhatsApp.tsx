import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, Send, QrCode, Monitor, X, Smartphone, ExternalLink } from 'lucide-react';

export default function WhatsApp() {
  const [whatsAppWindow, setWhatsAppWindow] = useState<Window | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const checkInterval = useRef<number | null>(null);

  useEffect(() => {
    if (whatsAppWindow) {
      checkInterval.current = window.setInterval(() => {
        if (whatsAppWindow.closed) {
          setIsWindowOpen(false);
          setWhatsAppWindow(null);
          if (checkInterval.current) clearInterval(checkInterval.current);
        }
      }, 1000);
    }
    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [whatsAppWindow]);

  const openWhatsAppWeb = () => {
    const width = 1200;
    const height = 800;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    const win = window.open(
      'https://web.whatsapp.com',
      'whatsapp_crm',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );
    if (win) {
      setWhatsAppWindow(win);
      setIsWindowOpen(true);
    }
  };

  const focusWhatsAppWindow = () => {
    if (whatsAppWindow && !whatsAppWindow.closed) {
      whatsAppWindow.focus();
    } else {
      openWhatsAppWeb();
    }
  };

  const closeWhatsAppWindow = () => {
    if (whatsAppWindow && !whatsAppWindow.closed) {
      whatsAppWindow.close();
    }
    setIsWindowOpen(false);
    setWhatsAppWindow(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <MessageCircle size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp CRM</h1>
            <p className="text-gray-500 text-sm">Chat with customers directly from your CRM workspace</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
          isWindowOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isWindowOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          {isWindowOpen ? 'WhatsApp Window Active' : 'Not Connected'}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <MessageCircle size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">WhatsApp</p>
          <p className="text-emerald-100 text-xs mt-0.5">Messaging Hub</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <Users size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">Direct</p>
          <p className="text-blue-100 text-xs mt-0.5">Customer Chat</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
          <Send size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">Fast</p>
          <p className="text-purple-100 text-xs mt-0.5">Quick Replies</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <QrCode size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">Scan</p>
          <p className="text-amber-100 text-xs mt-0.5">QR to Connect</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Launch Panel */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-2xl border border-emerald-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
                <MessageCircle size={48} className="text-white" />
              </div>
              {isWindowOpen ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Web is Open! ✅</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    Your WhatsApp Web session is running in a separate window. Click below to switch to it or close the session.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                    <button
                      onClick={focusWhatsAppWindow}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Monitor size={20} />
                      Switch to WhatsApp
                    </button>
                    <button
                      onClick={closeWhatsAppWindow}
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-red-50 text-red-600 font-semibold rounded-xl border border-red-200 transition-all"
                    >
                      <X size={18} />
                      Close Session
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Launch WhatsApp Web</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    Open WhatsApp Web in a dedicated CRM popup window. Scan the QR code with your phone to start chatting with customers.
                  </p>
                  <button
                    onClick={openWhatsAppWeb}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-lg"
                  >
                    <MessageCircle size={24} />
                    Open WhatsApp Web
                    <ExternalLink size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* How to Connect */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <QrCode size={18} className="text-emerald-600" /> How to Connect
            </h3>
            <ol className="space-y-3">
              {[
                { step: 1, text: 'Click "Open WhatsApp Web" button' },
                { step: 2, text: 'A new window will open with WhatsApp Web' },
                { step: 3, text: 'Open WhatsApp on your phone' },
                { step: 4, text: 'Go to Settings → Linked Devices → Link a Device' },
                { step: 5, text: 'Scan the QR code shown in the popup window' },
                { step: 6, text: 'Start chatting with customers!' },
              ].map(item => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Smartphone size={18} className="text-blue-600" /> Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Keep your phone connected to the internet
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                WhatsApp Web stays linked even after closing the window
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                You can re-open anytime without scanning again
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                All messages sync in real-time with your phone
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
