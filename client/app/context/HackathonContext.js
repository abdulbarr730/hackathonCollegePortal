'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const HackathonContext = createContext();

export function HackathonProvider({ children }) {
  const [activeEvent, setActiveEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveEvent = async () => {
    try {
      // Points to the public route we just created
      const res = await fetch('/api/admin/hackathons/active');
      const data = await res.json();
      
      if (data) {
        setActiveEvent(data);
      } else {
        // Fallback if no hackathon is marked active in DB
        setActiveEvent({
          name: "Hackathon Portal",
          shortName: "Hackathon",
          minTeamSize: 1,
          maxTeamSize: 6
        });
      }
    } catch (err) {
      console.error("Failed to fetch active hackathon:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  return (
    <HackathonContext.Provider value={{ activeEvent, loading, refreshEvent: fetchActiveEvent }}>
      {children}
    </HackathonContext.Provider>
  );
}

export function useHackathon() {
  return useContext(HackathonContext);
}