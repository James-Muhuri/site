import { useState, useRef, useEffect } from 'react';
import AdBanner from '../components/AdBanner'; // Import the ad component

function Audio() {
  const [showAd, setShowAd] = useState(false);         // Toggle ad visibility
  const [lastAdTime, setLastAdTime] = useState(0);      // Track last ad display time

  // Store the uploaded voice audio file from the user
  const [audioFile, setAudioFile] = useState(null);
  // The full text of the book that will be read aloud
  const [bookText, setBookText] = useState('');
  // The index of the currently highlighted word during audio playback
  const [highlightIndex, setHighlightIndex] = useState(null);
  // Array of timestamp objects with word and start time for syncing text highlighting
  const [timestamps, setTimestamps] = useState([]);
  // The source URL of the generated speech audio file returned from backend
  const [audioSrc, setAudioSrc] = useState('');
  // Reference to the HTML audio element to control playback and track time
  const audioRef = useRef(null);

  // Handles the audio file upload and triggers backend processing
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    // Send the uploaded audio to the backend Flask server
    const res = await fetch(`http://localhost:8000/upload-audio`, {
      method: 'POST',
      body: formData
    });

    // Parse the JSON response containing generated audio URL, text, and timestamps
    const data = await res.json();

    // Set the source of the audio element to the returned audio URL
    setAudioSrc(data.audio_url);         // e.g., "/static/audio/book.mp3"
    // Set the book text to be displayed and highlighted
    setBookText(data.text);              // Full book text
    // Set the array of timestamps used to sync text highlighting with audio
    setTimestamps(data.timestamps);      // Array of { word: 'Hello', start: 1.2 }

    // Reset ad timer when new audio is uploaded
    setLastAdTime(0);
  };

  // Updates the highlighted word index as the audio plays based on current time
  const handleTimeUpdate = () => {
    const currentTime = audioRef.current.currentTime;

    // --- Highlighting logic ---
    for (let i = 0; i < timestamps.length; i++) {
      if (currentTime < timestamps[i].start) {
        // Highlight the previous word when current time is less than next word's start
        setHighlightIndex(i - 1);
        break;
      }
    }

    // --- Show ad every 10 minutes (600 seconds) ---
    if (currentTime - lastAdTime >= 600) {
      setShowAd(true);                // Show ad component
      setLastAdTime(currentTime);     // Update last ad time

      // ✅ Hides ad after 30 seconds (can adjust)
      setTimeout(() => setShowAd(false), 30000); 
    }
  };

  // Render the book text with the current word highlighted using Bootstrap background class
  const renderTextWithHighlight = () => {
    // Split the full text into words for individual rendering
    const words = bookText.split(' ');
    return words.map((word, i) => (
      <span
        key={i}
        // Highlight the word at highlightIndex with a yellow background
        className={i === highlightIndex ? 'bg-warning' : ''}
        style={{ marginRight: '4px' }} // Add some spacing between words
      >
        {word}
      </span>
    ));
  };

  return (
    <div className="container mt-5">
      <h2>Upload Your Voice</h2>

      {/* File input for user to upload their voice sample */}
      <input type="file" onChange={(e) => setAudioFile(e.target.files[0])} />

      {/* Button to trigger the upload and generate the audio reading */}
      <button className="btn btn-primary ms-2" onClick={handleUpload}>
        Upload and Generate Reading
      </button>

      {/* If audioSrc is set, show the audio player and text reader */}
      {audioSrc && (
        <>
          {/* Show the ad banner if triggered */}
          {showAd && <AdBanner />}

          <div className="mt-4">
            <h3>Book Audio</h3>

            {/* Audio element to play the generated speech */}
            <audio
              ref={audioRef}
              src={audioSrc}
              controls
              // On every time update, sync text highlighting and ads
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setHighlightIndex(null)}
            />

            {/* Playback control buttons */}
            <div className="mt-2">
              <button className="btn btn-success me-2" onClick={() => audioRef.current.play()}>
                Start Reading
              </button>
              <button className="btn btn-secondary" onClick={() => audioRef.current.pause()}>
                Pause
              </button>
            </div>
          </div>

          {/* Display the book text with synced word highlighting */}
          <div className="mt-4">
            <h4>Reading Text</h4>
            <div style={{ lineHeight: '2', fontSize: '1.2em' }}>
              {renderTextWithHighlight()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Audio;