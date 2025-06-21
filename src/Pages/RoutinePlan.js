import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function RoutinePlan() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [goal, setGoal] = useState('');
  const [routine, setRoutine] = useState([]);
  const [saved, setSaved] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get('/auth/protected');
      } catch {
        navigate('/login');
      }
    };
    checkAuth();

    const stored = localStorage.getItem(`routine-${today}`);
    if (stored) {
      setRoutine(JSON.parse(stored));
      setSaved(true);
    }

    const storedStreak = parseInt(localStorage.getItem('yoga-streak') || '0');
    setStreak(storedStreak);
  }, [navigate]);

  const handleGenerate = async () => {
    if (!goal.trim()) return alert('Please enter a goal');

    try {
      const datasetRes = await fetch('http://localhost:5000/api/yoga/dataset');
      const dataset = await datasetRes.json();

      const aiRes = await fetch('/api/yoga/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });

      const aiData = await aiRes.json();
      let raw = aiData.poses;

      if (typeof raw === 'string') {
        raw = raw.replace(/```json/, '').replace(/```/, '').trim();
        raw = JSON.parse(raw);
      }

      const enriched = raw.slice(0, 6).map(pose => {
        const match = dataset.find(
          item =>
            item.name.toLowerCase() === pose.title.toLowerCase() ||
            item.sanskrit_name.toLowerCase() === pose.title.toLowerCase()
        );

        return {
          title: pose.title,
          image: match?.photo_url || 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg',
          instructions: pose.instructions || 'No instructions provided',
          benefits: pose.benefits || 'No benefits listed',
          done: false,
        };
      });

      setRoutine(enriched);
      localStorage.setItem(`routine-${today}`, JSON.stringify(enriched));
      setSaved(true);
    } catch (err) {
      console.error('Error generating routine:', err);
      alert('Something went wrong. Try again.');
    }
  };

  const handleMarkDone = (index) => {
    const updated = [...routine];
    updated[index].done = !updated[index].done;
    setRoutine(updated);
    localStorage.setItem(`routine-${today}`, JSON.stringify(updated));

    const allDone = updated.every(pose => pose.done);
    if (allDone) {
      localStorage.setItem(`yoga-done-${today}`, 'true');

      const lastDate = localStorage.getItem('last-yoga-date');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yyyymmdd = yesterday.toISOString().split('T')[0];

      const storedStreak = parseInt(localStorage.getItem('yoga-streak') || '0');

      if (lastDate === yyyymmdd) {
        const newStreak = storedStreak + 1;
        localStorage.setItem('yoga-streak', newStreak);
        setStreak(newStreak);
      } else if (lastDate !== today) {
        localStorage.setItem('yoga-streak', 1);
        setStreak(1);
      }

      localStorage.setItem('last-yoga-date', today);
    }
  };

  const handleChangeGoal = () => {
    localStorage.removeItem(`routine-${today}`);
    setRoutine([]);
    setSaved(false);
    setGoal('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎯 Goal-Based Yoga Routine</h2>

      {!saved && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. stress relief, PCOD, weight loss"
            style={{ padding: '8px', width: '250px' }}
          />
          <button onClick={handleGenerate} style={{ marginLeft: '10px' }}>
            Generate Routine
          </button>
        </div>
      )}

      {saved && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🧘 Routine for <span style={{ color: 'green' }}>{goal || 'Your Goal'}</span></h3>
          <p><em>This routine focuses on your goal: <strong>{goal}</strong>.</em></p>
          <button onClick={handleChangeGoal}>Change Goal</button>
          <p style={{ marginTop: '10px' }}>🔥 Routine Streak: {streak} {streak === 1 ? 'day' : 'days'}!</p>
        </div>
      )}

      {routine.length > 0 && (
        <div>
          {routine.map((pose, index) => (
            <div key={index} style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '8px',
              background: '#f9f9f9',
              maxWidth: '400px'
            }}>
              <h4>{pose.title}</h4>
              <img src={pose.image} alt={pose.title} style={{ width: '100%', borderRadius: '5px' }} />
              <p><strong>How to do:</strong> {pose.instructions}</p>
              <p><strong>Benefits:</strong> {pose.benefits}</p>
              <label>
                <input
                  type="checkbox"
                  checked={pose.done}
                  onChange={() => handleMarkDone(index)}
                />{' '}
                Mark as Done
              </label>
            </div>
          ))}
          {routine.length > 0 && routine.every(p => p.done) && (
  <div style={{
    marginTop: '20px',
    padding: '10px',
    background: '#d4edda',
    color: '#155724',
    borderRadius: '6px',
    fontWeight: 'bold'
  }}>
    🎉 Well done! You've completed your yoga routine today!
  </div>
)}

        </div>
      )}
    </div>
  );
}

export default RoutinePlan;
