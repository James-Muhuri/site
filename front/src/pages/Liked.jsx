import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Liked() {
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null); // To store the user ID from localStorage

  // Fetch user ID from localStorage (it will be set when the user logs in)
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.error('User not authenticated!');
    }
  }, []);

  // Fetch liked videos for the user
  useEffect(() => {
    if (userId) {
      const fetchLikedVideos = async () => {
        try {
        const response = await axios.get(`${process.env.REACT_APP_EXPRESS_API_URL}/user/${userId}/liked-videos`);
          if (response.data.success) {
            // Add `liked: true` property to each video
            const videosWithLikeState = response.data.likedVideos.map(video => ({
              ...video,
              liked: true,
            }));
            setLikedVideos(videosWithLikeState);
          } else {
            console.error('Failed to fetch liked videos');
          }
        } catch (error) {
          console.error('Error fetching liked videos:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchLikedVideos();
    }
  }, [userId]);

  // Handle like/unlike toggle
  const toggleLike = async (videoId) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_EXPRESS_API_URL}/user/${userId}/like`, { videoId });

      if (response.data.success) {
        // Optimistically update UI without re-fetching
        setLikedVideos(prev =>
          prev.map(video =>
            video.id === videoId ? { ...video, liked: !video.liked } : video
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  if (loading) {
    return <div>Loading liked videos...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Liked Videos</h2>
      {likedVideos.length === 0 ? (
        <p>You have no liked videos.</p>
      ) : (
        <div className="video-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {likedVideos.map((video) => (
            <div
              key={video.id}
              className="video-card"
              style={{
                width: '100%',
                maxWidth: '320px',
                backgroundColor: '#f7f7f7',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h4 style={{ fontSize: '18px', marginBottom: '10px' }}>{video.title}</h4>
              <video
                width="100%"
                height="auto"
                controls
                style={{ borderRadius: '8px' }}
              >
                <source src={video.path} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <button
                onClick={() => toggleLike(video.id)}
                style={{
                  marginTop: '15px',
                  padding: '8px 15px',
                  backgroundColor: video.liked ? '#ff4d4d' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {video.liked ? '❤️ Unlike' : '🤍 Like'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Liked;