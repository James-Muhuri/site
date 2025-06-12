import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';

function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observer = useRef();
  const LIMIT = 10;

  const fetchVideos = async (currentPage = 1) => {
    const endpoint =  `http://localhost:5000/all-videos?page=${currentPage}&limit=${LIMIT}`;
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Network response was not ok');

      const newVideos = await response.json();
      setVideos(prev => [...prev, ...newVideos]);
      setHasMore(newVideos.length === LIMIT);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchVideos(page);
  }, []);

  const lastVideoRef = useCallback(
    node => {
      if (isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setIsLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchVideos(nextPage);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoadingMore, hasMore, page]
  );

  if (loading) {
    return (
      <div className="home-container" style={styles.container}>
        <h2 style={styles.loadingText}>Loading videos...</h2>
      </div>
    );
  }

  return (
    <div className="home-container" style={styles.container}>
      <h2 style={styles.heading}>All Videos</h2>
      {videos.length === 0 ? (
        <p style={styles.noVideos}>No videos available yet. Be the first to upload!</p>
      ) : (
        <>
          <div className="video-gallery" style={styles.videoGallery}>
            {videos.map((video, index) => {
              const isLast = index === videos.length - 1;
              return (
                <div
                  key={index}
                  className="video-item"
                  style={styles.videoItem}
                  ref={isLast ? lastVideoRef : null}
                >
                  <video style={styles.video} width="100%" height="auto" controls preload="metadata">
                    <source src={video.path || video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              );
            })}
          </div>
          {isLoadingMore && (
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
              Loading more videos...
            </p>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '24px',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#888',
  },
  noVideos: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#555',
  },
  videoGallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  videoItem: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    padding: '10px',
  },
  video: {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
};

export default Home;