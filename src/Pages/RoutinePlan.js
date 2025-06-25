import './RoutinePlan.css';
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
  const [poseStatus, setPoseStatus] = useState({}); // { index: true/false }


  useEffect(() => {
  const checkAuthAndFetch = async () => {
    try {
      await API.get('/auth/protected');

      const res = await API.get('/yoga/streak');
      setStreak(res.data.streak || 0);

     const routineRes = await API.get(`/yoga/routine?date=${today}`);
if (routineRes.data?.length) {
  setRoutine(routineRes.data);
  setSaved(true);

  const savedStatus = {};
  routineRes.data.forEach((pose, idx) => {
    savedStatus[idx] = pose.done;
  });
  setPoseStatus(savedStatus);
}

    } catch {
      navigate('/login');
    }
  };

  checkAuthAndFetch();
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

  const handleMarkDone = async (index) => {
  const today = new Date().toISOString().split('T')[0];

  // ✅ Update routine's pose `done` status
  const updatedRoutine = [...routine];
  updatedRoutine[index].done = !updatedRoutine[index].done;
  setRoutine(updatedRoutine);

  // Update poseStatus as well (optional if you're keeping it)
  const updatedStatus = { ...poseStatus, [index]: updatedRoutine[index].done };
  setPoseStatus(updatedStatus);

  // 🔄 Send full routine to backend
  try {
    await API.post('/yoga/routine-status', {
      date: today,
      routine: updatedRoutine,
    });
  } catch (err) {
    console.error('Error syncing pose status to backend:', err);
  }
};




  const handleChangeGoal = () => {
    localStorage.removeItem(`routine-${today}`);
    setRoutine([]);
    setSaved(false);
    setGoal('');
  };

  return (
    <div className="routine-container">
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
  checked={poseStatus[index] || false}
  onChange={() => handleMarkDone(index)}
/>

                Mark as Done
              </label>
            </div>
          ))}
         {routine.length > 0 && routine.every((_, idx) => poseStatus[idx]) && (
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
