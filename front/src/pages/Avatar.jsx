import React, { useState } from 'react';
import { ClipLoader } from 'react-spinners'; // Import the spinner

function Avatar() {
  const [avatarFile, setAvatarFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // State to manage loading spinner

  // Handle avatar image selection
  const handleAvatarSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  // Handle audio/video file selection
  const handleAudioSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };

  // Handle form submission to upload files
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!avatarFile || !audioFile) {
      alert("Please select both an avatar image and an audio/video file.");
      return;
    }

    setIsProcessing(true); // Set loading state to true when the process starts

    // Create FormData for the files
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    formData.append("audio", audioFile);

    try {
      // Make a POST request to the backend
     const response = await fetch(`${process.env.REACT_APP_PYTHON_API_URL}/api/upload-avatar`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      setIsProcessing(false); // Set loading state to false after the request is complete

      if (data.success) {
        // If video URL is returned, show the download link
        setResultMessage('Avatar Video Generated!');
        setVideoUrl(data.video_url);
      } else {
        // Handle errors from backend
        setResultMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      // Handle any fetch or network errors
      setIsProcessing(false); // Set loading state to false on error
      setResultMessage(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Upload Avatar Image and Audio/Video</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label htmlFor="avatar">Choose Avatar Image (PNG, JPG):</label>
        <input
          type="file"
          id="avatar"
          name="avatar"
          accept="image/*"
          onChange={handleAvatarSelect}
          required
          style={styles.input}
        />
        <br />

        <label htmlFor="audio">Choose Audio or Video File (MP3, WAV, MP4):</label>
        <input
          type="file"
          id="audio"
          name="audio"
          accept="audio/*,video/*"
          onChange={handleAudioSelect}
          required
          style={styles.input}
        />
        <br />

        <button type="submit" style={styles.button}>
          Upload
        </button>
      </form>

      {/* Preview selected files BEFORE upload */}
      {(avatarFile || audioFile) && (
        <div style={{ marginTop: 20 }}>
          <h3>Preview Selected Files (Before Upload)</h3>
          {avatarFile && (
            <img
              src={URL.createObjectURL(avatarFile)}
              alt="Avatar Preview"
              style={{ maxWidth: '200px', display: 'block', marginBottom: 10 }}
            />
          )}
          {audioFile && (
            <>
              {audioFile.type.startsWith('video') ? (
                <video
                  src={URL.createObjectURL(audioFile)}
                  controls
                  style={{ maxWidth: '100%', marginBottom: 10 }}
                />
              ) : (
                <audio
                  src={URL.createObjectURL(audioFile)}
                  controls
                  style={{ display: 'block', marginBottom: 10 }}
                />
              )}
            </>
          )}
        </div>
      )}

      {resultMessage && <p style={styles.result}>{resultMessage}</p>}

      {/* Show the spinner while processing */}
      {isProcessing && <ClipLoader color="#007bff" loading={isProcessing} size={50} />}

      {/* Preview uploaded/generated video AFTER upload */}
      {videoUrl && (
        <div style={styles.downloadContainer}>
          <h3>Download Generated Video</h3>
          <a href={videoUrl} download style={styles.downloadLink}>
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '8px',
    fontSize: '14px',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  result: {
    marginTop: '20px',
    fontSize: '18px',
    color: '#333',
  },
  downloadContainer: {
    marginTop: '20px',
  },
  downloadLink: {
    display: 'inline-block',
    padding: '10px 15px',
    backgroundColor: '#28a745',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '5px',
  },
};

export default Avatar;