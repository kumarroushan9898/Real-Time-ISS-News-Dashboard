import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Map from './components/Map';
import News from './components/News';
import Chatbot from './components/Chatbot';
import Charts from './components/Charts';
import ThemeToggle from './components/ThemeToggle';
import PeopleInSpace from './components/PeopleInSpace';
import { calculateSpeed } from './utils';

function App() {
  const [issData, setIssData] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [nearestPlace, setNearestPlace] = useState('Ocean/Unknown');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchISSPosition = async () => {
    try {
      const response = await fetch('http://api.open-notify.org/iss-now.json');
      const data = await response.json();
      
      const newPos = {
        lat: parseFloat(data.iss_position.latitude),
        lng: parseFloat(data.iss_position.longitude),
        timestamp: data.timestamp
      };

      setCurrentPosition(newPos);
      
      setIssData(prev => {
        const newData = [...prev, newPos];
        if (newData.length > 30) newData.shift();
        
        if (newData.length >= 2) {
          const last = newData[newData.length - 1];
          const secondLast = newData[newData.length - 2];
          const speed = calculateSpeed(
            secondLast.lat, secondLast.lng,
            last.lat, last.lng,
            secondLast.timestamp, last.timestamp
          );
          setCurrentSpeed(speed);
        }
        
        return newData;
      });

      // Reverse geocoding for nearest place
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}&zoom=10`);
        const geoData = await geoRes.json();
        if (geoData.address) {
          setNearestPlace(geoData.address.city || geoData.address.town || geoData.address.country || 'Unknown Land');
        } else {
          setNearestPlace('Ocean/Unknown');
        }
      } catch (e) {
        setNearestPlace('Ocean/Unknown');
      }
      
    } catch (error) {
      console.error('Error fetching ISS position:', error);
    }
  };

  useEffect(() => {
    fetchISSPosition();
    const interval = setInterval(fetchISSPosition, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <ToastContainer theme={darkMode ? 'dark' : 'light'} />
      
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            AstroDash
          </h1>
          <span className="text-sm font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2"></span>
            LIVE
          </span>
        </div>
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="mr-2">🌍</span> ISS Live Tracker
              </h2>
              <button 
                onClick={fetchISSPosition}
                className="text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Refresh
              </button>
            </div>
            <div className="h-[400px] leaflet-map-wrapper">
              <Map positions={issData} currentPosition={currentPosition} />
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800/50">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Speed</p>
                <p className="font-mono text-lg">{currentSpeed.toFixed(0)} <span className="text-sm">km/h</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Location</p>
                <p className="font-mono text-lg truncate" title={nearestPlace}>{nearestPlace}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Coordinates</p>
                <p className="font-mono text-sm">{currentPosition ? `${currentPosition.lat.toFixed(2)}, ${currentPosition.lng.toFixed(2)}` : '--'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Tracked Pts</p>
                <p className="font-mono text-lg">{issData.length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <PeopleInSpace />
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 flex-1">
               <h2 className="text-lg font-semibold mb-4">Speed Trend</h2>
               <div className="h-[200px]">
                 <Charts data={issData} type="speed" />
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <News />
        </div>

      </main>

      <Chatbot />
    </div>
  );
}

export default App;
