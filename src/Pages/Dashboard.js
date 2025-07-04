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

  const today = new Date();
const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-indexed
const [selectedYear, setSelectedYear] = useState(today.getFullYear());


  // Load yoga history and streak
 useEffect(() => {
  const fetchData = async () => {
    try {
      await API.get('/auth/protected');

      const paddedMonth = String(selectedMonth).padStart(2, '0');
      const res = await API.get(`/yoga/history?months=1`);
      const historyMap = res.data;

      const today = new Date().toISOString().split('T')[0];
      const todayData = historyMap[today];
      setYogaDone(!!todayData);

      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const fullCalendar = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = `${selectedYear}-${paddedMonth}-${String(day).padStart(2, '0')}`;
        return {
          day,
          done: !!historyMap[dateStr],
        };
      });

      setCalendarData(fullCalendar);

      const streakRes = await API.get('/yoga/streak');
      setStreak(streakRes.data.streak || 0);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      navigate('/login');
    }
  };

  fetchData();
}, [navigate, selectedMonth, selectedYear]);

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
      const datasetRes = await fetch('https://yoga-backend-17s9.onrender.com/api/yoga/dataset');
      const dataset = await datasetRes.json();

      const randomPose = dataset[Math.floor(Math.random() * dataset.length)];

     const aiRes = await fetch('https://yoga-backend-17s9.onrender.com/api/yoga/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': localStorage.getItem('token')  // if auth is needed
  },
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

      <div className="streak-graphic-container">
        <div className="streak-flame">
          {/* SVG flame graphic */}
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 2C19 2 13.5 10.5 13.5 16C13.5 20.1421 16.8579 23.5 21 23.5C25.1421 23.5 28.5 20.1421 28.5 16C28.5 10.5 23 2 23 2C22.5 6 19 2 19 2Z" fill="#ffb300"/>
            <path d="M19 6C16.5 10 16.5 14 19 16C21.5 14 21.5 10 19 6Z" fill="#ff7043"/>
            <ellipse cx="19" cy="28" rx="10" ry="8" fill="#ffe082"/>
          </svg>
        </div>
        <div>
          <div className="streak-text">
            Current Streak: <span className="streak-count">{streak}</span> {streak === 1 ? 'day' : 'days'}!
          </div>
          <div className="streak-progress-bar">
            <div
              className="streak-progress-fill"
              style={{ width: `${Math.min((streak % 7) / 7 * 100, 100)}%` }}
            ></div>
          </div>
          <div className="streak-progress-label">
            {streak % 7 === 0 && streak > 0 ? '🔥 New Milestone!' : `${7 - (streak % 7)} days to next badge`}
          </div>
        </div>
      </div>

<div>
  <button className="month-switch" onClick={() => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  }}>
    Previous
  </button>

  <span className="dashboard-month-label">
    {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
  </span>

  <button  className="month-switch" onClick={() => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  }}>
    Next
  </button>
</div>



      <h3 style={{ marginTop: '30px' }}> Practice History</h3>
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
          <h3 style={{ marginTop: '40px' }}> Daily AI Yoga Challenge</h3>
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


