import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import PoseCard from '../components/PoseCard';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (query) => {
    setSearchTerm(query.toLowerCase());
  };

  // Static yoga poses
  const poses = [
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

   const filteredPoses = poses.filter((pose) =>
    pose.title.toLowerCase().includes(searchTerm) ||
    pose.benefits.toLowerCase().includes(searchTerm) ||
    pose.howTo.toLowerCase().includes(searchTerm)
  );

  return (
    <div>
      <SearchBar onSearch={handleSearch} />

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {filteredPoses.map((pose, idx) => (
          <PoseCard
            key={idx}
            title={pose.title}
            image={pose.image}
            benefits={pose.benefits}
            howTo={pose.howTo}
          />
        ))}
      </div>
    </div>
  );
}
export default Home;
