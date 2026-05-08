import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users } from 'lucide-react';

export default function PeopleInSpace() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axios.get('http://api.open-notify.org/astros.json');
        // Filter those only on ISS
        const issPeople = response.data.people.filter(p => p.craft === 'ISS');
        setPeople(issPeople);
      } catch (err) {
        console.error('Error fetching people in space:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPeople();
  }, []);

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-5 text-white flex-1 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Users size={80} />
      </div>
      <div className="relative z-10">
        <h2 className="text-lg font-semibold flex items-center mb-2">
          👨‍🚀 Humans on ISS
        </h2>
        {loading ? (
          <div className="animate-pulse flex space-x-2">
             <div className="h-6 w-12 bg-white/30 rounded"></div>
             <div className="h-6 w-32 bg-white/30 rounded"></div>
          </div>
        ) : (
          <>
            <p className="text-4xl font-bold mb-3">{people.length}</p>
            <div className="space-y-1 overflow-y-auto max-h-[120px] pr-2 custom-scrollbar">
              {people.map((person, idx) => (
                <div key={idx} className="text-sm bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
                  {person.name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
