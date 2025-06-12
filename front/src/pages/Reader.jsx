// ReaderPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdBanner from '../components/AdBanner'; // ✅ Import the ad component

function Reader() {
  const { bookId } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const [showAd, setShowAd] = useState(false);         // ✅ Whether to show ad
  const [lastAdTime, setLastAdTime] = useState(Date.now()); // ✅ Track last ad time

  useEffect(() => {
    fetch(`http://localhost:8000/book/${bookId}`)
      .then(res => {
    if (!res.ok) throw new Error('Book not found');
    return res.text();
  })
      .then(res => res.text())
      .then(setContent)
      .finally(() => setLoading(false));
  }, [bookId]);

  useEffect(() => {
    // ✅ Set up ad timer
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastAdTime >= 10 * 60 * 1000) { // 10 minutes
        setShowAd(true);
        setLastAdTime(now);

        // Hide ad after 30 seconds
        setTimeout(() => {
          setShowAd(false);
        }, 30000);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lastAdTime]);

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Book Reader</h2>

      {/* ✅ Display Ad if triggered */}
      {showAd && <AdBanner onClose={() => setShowAd(false)} />}

      {loading ? <p>Loading...</p> : <pre style={{ whiteSpace: 'pre-wrap' }}>{content}</pre>}
    </div>
  );
}

export default Reader;