import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function History() {
  const [watchedVideos, setWatchedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(1); // Tracks the current page for pagination
  const [hasMore, setHasMore] = useState(true); // To check if there are more videos to load

  useEffect(() => {
    // Retrieve userId from localStorage if available
    const token = localStorage.getItem('authToken');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decode JWT token to extract userId
      setUserId(decodedToken.userId);
    } else {
      // Redirect user to login page if token is not found
      window.location.href = '/login';
    }
  }, []);

  const fetchWatchedVideos = useCallback(async () => {
    if (!userId || !hasMore) return;

    setLoading(true);

    try {
      const response = await axios.get( `${process.env.REACT_APP_EXPRESS_API_URL}/api/user/${userId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // Send token with request
        },
        params: { page } // Send the current page number as query parameter
      });

      if (response.data.success) {
        setWatchedVideos((prevVideos) => [
          ...prevVideos,
          ...response.data.watchedVideos, // Append the new videos to the existing list
        ]);

        // If the response contains fewer videos than expected, there's no more data to load
        if (response.data.watchedVideos.length < 10) {
          setHasMore(false); // Stop further loading
        }
      } else {
        console.error('Error fetching watched videos');
      }
    } catch (error) {
      console.error('Error fetching watched videos:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, page, hasMore]);

  // Load the first batch of watched videos when the page loads
  useEffect(() => {
    fetchWatchedVideos();
  }, [userId]);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom && !loading && hasMore) {
      setPage((prevPage) => prevPage + 1); // Increment the page number to load the next batch of videos
    }
  };

  useEffect(() => {
    fetchWatchedVideos(); // Fetch new set of videos when the page changes
  }, [page, fetchWatchedVideos]);

  const handleDeleteHistoryItem = async (videoId) => {
    try {
const response = await axios.delete(
  `${process.env.REACT_APP_EXPRESS_API_URL}/api/history/${userId}/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        setWatchedVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoId));
      }
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };

  const handleMarkAsWatched = async (videoId, status) => {
    try {
     const response = await axios.patch(
  `${process.env.REACT_APP_EXPRESS_API_URL}/api/history/${userId}/${videoId}/mark`,
        { status }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        setWatchedVideos((prevVideos) =>
          prevVideos.map((video) =>
            video.id === videoId ? { ...video, status } : video
          )
        );
      }
    } catch (error) {
      console.error('Error marking video as watched:', error);
    }
  };

  if (loading && page === 1) {
    return <div style={styles.loading}>Loading your watched videos...</div>;
  }

  return (
    <div style={styles.container} onScroll={handleScroll}>
      <h2 style={styles.heading}>Watched Videos History</h2>
      {watchedVideos.length === 0 ? (
        <p style={styles.noHistory}>You haven't watched any videos yet.</p>
      ) : (
        <ul style={styles.videoList}>
          {watchedVideos.map((video) => (
            <li key={video.id} style={styles.videoItem}>
              <h3 style={styles.videoTitle}>{video.title}</h3>
              <video style={styles.video} controls>
                <source src={video.path} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {video.user_video_history?.watchedAt && (
                <p style={styles.watchedTime}>
                  Watched at: {new Date(video.user_video_history.watchedAt).toLocaleString()}
                </p>
              )}
              <div style={styles.actions}>
                <button onClick={() => handleDeleteHistoryItem(video.id)} style={styles.button}>
                  Delete
                </button>
                <button
                  onClick={() => handleMarkAsWatched(video.id, video.status === 'watched' ? 'unwatched' : 'watched')}
                  style={styles.button}
                >
                  {video.status === 'watched' ? 'Mark as Unwatched' : 'Mark as Watched'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {loading && hasMore && <div style={styles.loading}>Loading more videos...</div>}
      {!hasMore && <div style={styles.noHistory}>No more videos to load.</div>}
    </div>
  );
}

// === Styles (unchanged) ===
const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    overflowY: 'scroll',
    height: '80vh', // Adjust height for scrollable area
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '24px',
  },
  noHistory: {
    textAlign: 'center',
    fontSize: '16px',
  },
  videoList: {
    listStyleType: 'none',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  videoItem: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
  },
  videoTitle: {
    fontSize: '18px',
    marginBottom: '10px',
  },
  video: {
    width: '100%',
    height: 'auto',
    maxHeight: '360px',
    borderRadius: '8px',
  },
  watchedTime: {
    fontSize: '14px',
    color: '#555',
    marginTop: '8px',
  },
  loading: {
    textAlign: 'center',
    paddingTop: '40px',
    fontSize: '18px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
  },
  button: {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default History;