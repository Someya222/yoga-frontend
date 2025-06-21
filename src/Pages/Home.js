import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import PoseCard from '../components/PoseCard';
import './Home.css'

function Home() {
  const [filtered, setFiltered] = useState([]);
  const [displayPoses, setDisplayPoses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Static fallback poses
  const staticPoses = [
    {
      title: 'Balasana (Child Pose)',
      image: 'https://hindi.cdn.zeenews.com/hindi/sites/default/files/2021/10/13/944678-untitled-27.png?im=FitAndFill=(1200,900)',
      benefits: 'Calms the brain, relieves stress and fatigue.',
      howTo: 'Kneel on the floor, sit on heels, bend forward, arms extended forward on the mat.',
    },
    {
      title: 'Adho Mukha Svanasana (Downward Dog)',
      image: 'https://res.cloudinary.com/dgerdfai4/image/upload/v1680074978/asana/1_12.jpg',
      benefits: 'Strengthens legs, arms, and relieves tension.',
      howTo: 'Start on hands and knees, lift hips upward, form an inverted V shape.',
    },
    {
      title: 'Bhujangasana (Cobra Pose)',
      image: 'https://www.healthdigest.com/img/gallery/the-benefits-of-doing-cobra-pose-in-yoga/intro-1681575846.webp',
      benefits: 'Improves spinal flexibility and mood.',
      howTo: 'Lie on your stomach, place hands under shoulders, push upper body upward keeping elbows bent.',
    },
  ];

  // Show static poses initially
  useEffect(() => {
    setDisplayPoses(staticPoses);
  }, []);

  const handleSearch = async (query) => {
  const term = query.toLowerCase();
  setLoading(true);

  try {
    // 1. Fetch the yoga dataset
    const datasetRes = await fetch('http://localhost:5000/api/yoga/dataset');
    const datasetText = await datasetRes.text();

    let dataset;
    try {
      dataset = JSON.parse(datasetText);
    } catch (err) {
      console.error('Failed to parse dataset JSON:', err);
      alert('Could not load yoga pose images');
      setLoading(false);
      return;
    }

    // 2. Check if query exactly matches a known pose
    const matchedPose = dataset.find(
      (pose) =>
        pose.name.toLowerCase() === term ||
        pose.sanskrit_name.toLowerCase() === term
    );

    if (matchedPose) {
      // 3. Ask Gemini for instructions and benefits of that pose
      const aiRes = await fetch('/api/yoga/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: matchedPose.name }),
      });

      const aiData = await aiRes.json();
let raw = aiData.poses;

console.log("Raw Gemini response:", raw);

// Clean and parse Gemini response
if (typeof raw === 'string') {
  raw = raw
    .replace(/```json/, '')
    .replace(/```/, '')
    .trim();

  try {
    raw = JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to parse Gemini JSON:", err);
    alert("Gemini returned invalid data. Please try a different query.");
    setLoading(false);
    return;
  }
}

const goalInfo = raw?.[0]; // ✅ correct variable is 'raw'


      const info = raw?.[0];

      const enrichedPose = {
        title: matchedPose.name,
        image: matchedPose.photo_url,
        instructions: info?.instructions || 'No instructions provided.',
        benefits: info?.benefits || 'No benefits listed.',
      };

      setFiltered([enrichedPose]);
      setLoading(false);
      return;
    }

    // 4. If no exact pose match → general goal search
    const aiGoalRes = await fetch('/api/yoga/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: query }),
    });

    const goalData = await aiGoalRes.json();
    let raw = goalData.poses;

    if (typeof raw === 'string' && raw.startsWith('```json')) {
      raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    const aiPoses = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // 5. Enrich each Gemini pose with image from dataset
    const enriched = aiPoses.map((pose) => {
  // Extract Sanskrit and English names from Gemini title
  const [sanskritRaw, englishRaw] = pose.title.split('(');
  const sanskrit = sanskritRaw?.trim().toLowerCase();
  const english = englishRaw?.replace(')', '').trim().toLowerCase();

  // Try matching with either English or Sanskrit from dataset
  const found = dataset.find((item) => {
    const name = item.name?.toLowerCase();
    const sanskritName = item.sanskrit_name?.toLowerCase();
    return name === english || sanskritName === sanskrit;
  });

  return {
    title: pose.title,
    instructions: pose.instructions,
    benefits: pose.benefits,
    image: found?.photo_url || 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg',
  };
});

    setFiltered(enriched);
  } catch (error) {
    console.error('AI fetch error:', error);
    alert('AI could not fetch poses.');
  }

  setLoading(false);
};



  return (
    <div>
      <SearchBar onSearch={handleSearch} />

      {loading && (
  <div className="spinner"></div>
)}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {(filtered.length > 0 ? filtered : displayPoses).map((pose, idx) => (
          <PoseCard
            key={idx}
            title={pose.title}
            image={pose.image}
            benefits={pose.benefits}
            howTo={pose.instructions || pose.howTo}
          />
        ))}
      </div>
    </div>
  );
}

export default Home;
