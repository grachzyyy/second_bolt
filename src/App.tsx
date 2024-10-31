import React, { useEffect, useState, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { Heart, Save } from 'lucide-react';
import ReactCanvasConfetti from 'react-canvas-confetti';

const API_URL = import.meta.env.PROD 
  ? 'https://your-production-url.com' 
  : 'http://localhost:3000';

const canvasStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0
} as const;

function App() {
  const [mainButtonClicks, setMainButtonClicks] = useState(0);
  const [secondaryButtonClicks, setSecondaryButtonClicks] = useState(0);
  const [fire, setFire] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    WebApp.ready();
    WebApp.MainButton.setText('Click Me!');
    WebApp.MainButton.show();

    const handleMainButtonClick = () => {
      setMainButtonClicks(prev => prev + 1);
    };

    const loadSavedClicks = async () => {
      try {
        const response = await fetch(`${API_URL}/api/get-clicks`, {
          headers: {
            'X-Telegram-Init-Data': WebApp.initData || '',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        if (data.success) {
          setMainButtonClicks(data.data.mainButtonClicks);
          setSecondaryButtonClicks(data.data.secondaryButtonClicks);
        }
      } catch (error) {
        console.error('Failed to load saved clicks:', error);
      }
    };

    loadSavedClicks();
    WebApp.MainButton.onClick(handleMainButtonClick);

    return () => {
      WebApp.MainButton.offClick(handleMainButtonClick);
    };
  }, []);

  const getInstance = useCallback((instance: any) => {
    instance?.fire({
      spread: 360,
      startVelocity: 20,
      elementCount: 70,
      decay: 0.95,
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
    });
  }, []);

  const handleSecondaryClick = () => {
    setSecondaryButtonClicks(prev => prev + 1);
    setFire(true);
    setTimeout(() => setFire(false), 100);
  };

  const saveClicks = async () => {
    if (!WebApp.initData) {
      setSaveStatus('Error: No Telegram data available');
      return;
    }

    try {
      setSaving(true);
      setSaveStatus('Saving...');
      
      const response = await fetch(`${API_URL}/api/save-clicks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': WebApp.initData,
        },
        body: JSON.stringify({
          mainButtonClicks,
          secondaryButtonClicks,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.success) {
        setSaveStatus('Saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('Failed to save. Please try again.');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Click Counter</h1>
          <p className="text-gray-600">Track your button clicks!</p>
        </div>

        <div className="space-y-6">
          <div className="bg-purple-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-purple-800 mb-2">Main Button</h2>
            <div className="text-4xl font-bold text-purple-600">{mainButtonClicks}</div>
            <p className="text-purple-600 mt-2">clicks recorded</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Secondary Button</h2>
            <div className="text-4xl font-bold text-blue-600">{secondaryButtonClicks}</div>
            <p className="text-blue-600 mt-2">clicks recorded</p>
          </div>

          <button
            onClick={handleSecondaryClick}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Heart className="w-5 h-5" />
            Click for Confetti!
          </button>

          <button
            onClick={saveClicks}
            disabled={saving}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Progress'}
          </button>

          {saveStatus && (
            <div className={`text-center font-medium ${
              saveStatus.includes('success') ? 'text-green-600' : 'text-red-600'
            }`}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>

      <ReactCanvasConfetti
        style={canvasStyles}
        fire={fire}
        getInstance={getInstance}
      />
    </div>
  );
}

export default App;