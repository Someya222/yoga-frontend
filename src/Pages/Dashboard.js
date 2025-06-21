import React, { useEffect, useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const [yogaDone, setYogaDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [calendarData, setCalendarData] = useState([]);
  const [dailyPose, setDailyPose] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get('/auth/protected');
      } catch (err) {
        navigate('/login');
      }
    };

    checkAuth();

    const today = new Date().toISOString().split('T')[0];

    const storedDone = localStorage.getItem(`yoga-done-${today}`);
    setYogaDone(storedDone === 'true');

    const storedStreak = parseInt(localStorage.getItem('yoga-streak') || '0');
    const lastDate = localStorage.getItem('last-yoga-date');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyymmdd = yesterday.toISOString().split('T')[0];

    if (storedDone === 'true') {
  if (lastDate === yyyymmdd) {
    const updated = storedStreak + 1;
    setStreak(updated);
    localStorage.setItem('yoga-streak', updated);
  } else if (lastDate === today) {
    // Already updated today
    setStreak(storedStreak);
  } else {
    setStreak(1);
    localStorage.setItem('yoga-streak', 1);
  }
  localStorage.setItem('last-yoga-date', today);
} else {
  setStreak(storedStreak);
}


    generateCalendar();
    generateDailyPose(today);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCheckbox = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyymmdd = yesterday.toISOString().split('T')[0];

    const storedStreak = parseInt(localStorage.getItem('yoga-streak') || '0');
    const lastDate = localStorage.getItem('last-yoga-date');

    const newValue = !yogaDone;
    localStorage.setItem(`yoga-done-${today}`, newValue);
    setYogaDone(newValue);

    if (newValue) {
      if (lastDate === yyyymmdd) {
        const newStreak = storedStreak + 1;
        setStreak(newStreak);
        localStorage.setItem('yoga-streak', newStreak);
      } else if (lastDate !== today) {
        setStreak(1);
        localStorage.setItem('yoga-streak', 1);
      }
      localStorage.setItem('last-yoga-date', today);
    }

    generateCalendar();
  };

  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const newCalendar = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const isoDate = dateObj.toISOString().split('T')[0];
      const isDone = localStorage.getItem(`yoga-done-${isoDate}`) === 'true';

      newCalendar.push({
        day,
        done: isDone,
      });
    }

    setCalendarData(newCalendar);
  };

  const generateDailyPose = async (today) => {
    const stored = localStorage.getItem(`daily-pose-${today}`);
    if (stored) {
      setDailyPose(JSON.parse(stored));
      return;
    }

    try {
      // 1. Load the dataset
      const datasetRes = await fetch('http://localhost:5000/api/yoga/dataset');
      const dataset = await datasetRes.json();

      const randomPose = dataset[Math.floor(Math.random() * dataset.length)];

      // 2. Call Gemini for benefits + how-to
      const aiRes = await fetch('/api/yoga/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: randomPose.name }),
      });

      const aiData = await aiRes.json();
      let raw = aiData.poses;

      if (typeof raw === 'string') {
        raw = raw
          .replace(/```json/, '')
          .replace(/```/, '')
          .trim();

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

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>

      <label style={{ display: 'block', marginTop: '20px' }}>
        <input type="checkbox" checked={yogaDone} onChange={handleCheckbox} />
        {' '}Yoga completed today
      </label>

      <p style={{ marginTop: '10px' }}>🔥 Current Streak: {streak} {streak === 1 ? 'day' : 'days'}!</p>

      <h3 style={{ marginTop: '30px' }}>🗓️ Practice History (This Month)</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '5px',
        marginTop: '10px',
        maxWidth: '300px'
      }}>
        {calendarData.map((date, idx) => (
          <div key={idx}
               style={{
                 padding: '10px',
                 textAlign: 'center',
                 borderRadius: '6px',
                 backgroundColor: date.done ? '#b2f2bb' : '#f1f1f1',
                 color: date.done ? '#0f5132' : '#555',
                 border: date.done ? '1px solid #5cb85c' : '1px solid #ccc'
               }}>
            {date.day}
          </div>
        ))}
      </div>

      {dailyPose && (
        <>
          <h3 style={{ marginTop: '40px' }}>🌟 Daily AI Yoga Challenge</h3>
          <div style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '10px',
            maxWidth: '400px',
            marginTop: '10px',
            background: '#f9f9f9'
          }}>
            <h4>{dailyPose.title}</h4>
            <img src={dailyPose.image} alt={dailyPose.title} style={{ width: '100%', borderRadius: '8px' }} />
            <p><strong>How to do:</strong> {dailyPose.instructions}</p>
            <p><strong>Benefits:</strong> {dailyPose.benefits}</p>
          </div>
        </>
      )}

      <button onClick={handleLogout} style={{ marginTop: '30px' }}>Logout</button>
    </div>
  );
}

export default Dashboard;

