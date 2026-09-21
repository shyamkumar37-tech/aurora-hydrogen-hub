import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

export default function QRScanner() {
  const [scanResult, setScanResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
        
        // If the QR code contains a URL to our system, navigate to it
        if (result.includes(window.location.origin)) {
          const path = result.replace(window.location.origin, '');
          navigate(path);
        } else {
          alert('Invalid QR Code');
        }
      },
      (error) => {
        console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(error => console.error('Failed to clear scanner', error));
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-cyan-400 mb-8">Scan Dispenser QR</h1>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
        {scanResult ? (
          <div className="text-emerald-400 text-center">
            <p>Scan Successful!</p>
            <p className="text-sm mt-2 text-slate-400 truncate">{scanResult}</p>
          </div>
        ) : (
          <div id="reader" className="w-full text-slate-200"></div>
        )}
      </div>
    </div>
  );
}
