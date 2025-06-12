import { useState, useEffect } from 'react';
import React from 'react';

function Documentaries() {
  const [documentaryVideos, setDocumentaryVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // To track the current page
  const [hasMore, setHasMore] = useState(true); // To check if there are more videos to load

  // Fetch videos whose title includes 'documentary'
  useEffect(() => {
    const fetchDocumentaries = async () => {
      if (loading || !hasMore) return; // Prevent unnecessary fetches

      setLoading(true);
      try {
       const response = await fetch(
  `http://localhost:5000/documentaries?page=${page}&limit=20`

        );
        const data = await response.json();

        // If no more videos are available, set hasMore to false
        if (data.length < 20) {
          setHasMore(false);
        }

        // Append new videos to the existing list
        setDocumentaryVideos(prevVideos => [...prevVideos, ...data]);
      } catch (err) {
        console.error('Failed to load documentaries', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentaries();
  }, [page]); // Fetch new documentaries whenever the page changes

  // Handle scroll event for infinite scrolling
  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom && !loading && hasMore) {
      setPage(prevPage => prevPage + 1); // Load next page when scrolled to the bottom
    }
  };

  return (
    <>
      <div
        className="documentaries-container"
        style={{ padding: '20px', height: '100vh', overflowY: 'auto' }}
        onScroll={handleScroll} // Trigger scroll event handler
      >
        <h2>Documentary Videos</h2>
        {loading && page === 1 ? (
          <p>Loading documentaries...</p>
        ) : documentaryVideos.length === 0 ? (
          <p>No documentaries available.</p>
        ) : (
          <div
            className="video-list"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            {documentaryVideos.map((video) => (
              <div key={video.id} style={{ width: '100%' }}>
                <h4>{video.title}</h4>
                <video
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                  controls
                >
                  <source src={video.path} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        )}
        {loading && page > 1 && <p>Loading more...</p>} {/* Show "Loading more" when fetching next page */}
        {!hasMore && <p>No more documentaries to load.</p>} {/* Show message when no more content */}
      </div>
    </>
  );
}

export default Documentaries;