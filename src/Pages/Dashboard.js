import React, { useEffect, useState } from 'react';
import API from '../api';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const [yogaDone, setYogaDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [calendarData, setCalendarData] = useState([]);
  const [dailyPose, setDailyPose] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load yoga history and streak
  useEffect(() => {
  const fetchData = async () => {
    try {
      await API.get('/auth/protected');

      const today = new Date().toISOString().split('T')[0];

      // ✅ Get calendar history
      const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0'); // Add leading 0

const res = await API.get(`/yoga/history?year=${year}&month=${month}`);
const historyMap = res.data;

// 🔁 Convert object to array
const history = Object.entries(historyMap).map(([date, done]) => ({
  date,
  done,
}));

const todayData = history.find(entry => entry.date === today);
setYogaDone(!!todayData?.done);

const daysInMonth = new Date(year, month, 0).getDate(); // total days
const fullCalendar = Array.from({ length: daysInMonth }, (_, i) => {
  const day = i + 1;
  const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
  return {
    day,
    done: !!historyMap[dateStr]
  };
});

setCalendarData(fullCalendar);



      // ✅ Get streak from backend
      const streakRes = await API.get('/yoga/streak');
      setStreak(streakRes.data.streak || 0);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      navigate('/login');
    }
  };

  fetchData();
}, [navigate]);



  const handleLogout = () => {
    navigate('/login');
  };

  const handleCheckbox = async () => {
  const today = new Date().toISOString().split('T')[0];

  try {
    const res = await API.post('/yoga/save-daily', {
      date: today,
      done: !yogaDone,
      streak: yogaDone ? streak - 1 : streak + 1
    });

    if (res.data.success) {
      const updated = !yogaDone;
      setYogaDone(updated);
      setStreak(prev => (updated ? prev + 1 : prev - 1));

      setCalendarData(prev =>
        prev.map(entry =>
          entry.day === parseInt(today.split('-')[2]) ? { ...entry, done: updated } : entry
        )
      );

      alert('Yoga status updated!');
    }
  } catch (err) {
    console.error('Failed to update yoga status:', err);
  }
};

 const generateDailyPose = async (today) => {
    const stored = localStorage.getItem(`daily-pose-${today}`);
    if (stored) {
      setDailyPose(JSON.parse(stored));
      return;
    }

    try {
      const datasetRes = await fetch('http://localhost:5000/api/yoga/dataset');
      const dataset = await datasetRes.json();

      const randomPose = dataset[Math.floor(Math.random() * dataset.length)];

      const aiRes = await fetch('/api/yoga/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: randomPose.name }),
      });

      const aiData = await aiRes.json();
      let raw = aiData.poses;

      if (typeof raw === 'string') {
        raw = raw.replace(/```json/, '').replace(/```/, '').trim();
        raw = JSON.parse(raw);
      }
        const info = raw?.[0] || {};

      const enriched = {
        title: randomPose.name,
        image: randomPose.photo_url,
        instructions: info.instructions || 'No instructions provided.',
        benefits: info.benefits || 'No benefits listed.',
      };

      setDailyPose(enriched);
      localStorage.setItem(`daily-pose-${today}`, JSON.stringify(enriched));
    } catch (err) {
      console.error('Error generating daily pose:', err);
    }
  };

  // Load daily pose on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    generateDailyPose(today);
  }, []);
  
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      <label className="checkbox-label">
        <input type="checkbox" checked={yogaDone} onChange={handleCheckbox} />
        {' '}Yoga completed today
      </label>

      <p className="streak-text">
        🔥 Current Streak: {streak} {streak === 1 ? 'day' : 'days'}!
      </p>

      <h3 style={{ marginTop: '30px' }}>🗓️ Practice History (This Month)</h3>
      <div className="calendar">
        {calendarData.map((date, idx) => (
          <div
            key={idx}
            className={`calendar-box ${date.done ? 'done' : ''}`}
          >
            {date.day}
          </div>
        ))}
      </div>

      {dailyPose && (
        <>
          <h3 style={{ marginTop: '40px' }}>🌟 Daily AI Yoga Challenge</h3>
          <div
            className="flip-container centered"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`flipper ${isFlipped ? 'flipped' : ''}`}>
              <div className="front">
                <h4>{dailyPose.title}</h4>
                <img src={dailyPose.image} alt={dailyPose.title} />
              </div>
              <div className="back">
                <h4>{dailyPose.title}</h4>
                <p><strong>How to do:</strong> {dailyPose.instructions}</p>
                <p><strong>Benefits:</strong> {dailyPose.benefits}</p>
              </div>
            </div>
          </div>
        </>
      )}

      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
}

export default Dashboard;


