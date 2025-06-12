import React, { useState, useRef } from "react";
import { Button, Dropdown } from "react-bootstrap";
import AdBanner from '../components/AdBanner'; // Import your ad component
// Simple ad banner component placeholder (replace with your actual ad component)


function Real() {
  const [videoFile, setVideoFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [messages, setMessages] = useState([]);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Track form submissions to show ad every 3 submissions
  const [submitCount, setSubmitCount] = useState(0);
  const [showAd, setShowAd] = useState(false);

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    const audioChunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audio = new Blob(audioChunks, { type: "audio/webm" });
      setAudioBlob(audio);
      setAudioURL(URL.createObjectURL(audio));
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleUpload = async () => {
    if (!videoFile || !audioBlob) {
      alert("Please upload a video and record audio.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("video", videoFile, videoFile.name);
    formData.append("audio", audioBlob, "recorded_audio.webm");

    const userMessage = {
      type: "user",
      video: URL.createObjectURL(videoFile),
      audio: audioURL,
    };

    setMessages((prev) => [...prev, userMessage]);
    setVideoFile(null);
    setAudioBlob(null);
    setAudioURL("");

    try {
      const response = await fetch(`http://localhost:8000/api/upload-video-audio`, {
        // your fetch options here
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Video synced successfully!",
          response: data,
        },
      ]);

      setVideoFile(null);
      setAudioBlob(null);
      setAudioURL("");

      // Increment submission count and show ad every 3 submissions
      setSubmitCount((prev) => {
        const newCount = prev + 1;
        if (newCount % 2 === 0) {
          setShowAd(true);
          setTimeout(() => setShowAd(false), 30000); // Hide ad after 30 seconds
        }
        return newCount;
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Upload failed. Please try again later.",
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ maxHeight: "90vh", overflowY: "auto", padding: "20px" }}>
      <div style={{ maxWidth: 800, margin: "auto", paddingTop: 30 }}>
        {/* ✅ Preview before upload */}
        {(videoFile || audioURL) && (
          <div style={{ marginBottom: 20 }}>
            {videoFile && (
              <video
                src={URL.createObjectURL(videoFile)}
                controls
                style={{ width: "100%", marginBottom: 10 }}
              />
            )}
            {audioURL && (
              <audio
                src={audioURL}
                controls
                style={{ display: "block", marginBottom: 10 }}
              />
            )}
            <p style={{ fontStyle: "italic", color: "#888" }}>
              Preview (not uploaded yet)
            </p>
          </div>
        )}

        {/* Show ad every 3 submissions */}
        {showAd && <AdBanner />}

        {/* ✅ Uploaded messages */}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 20 }}>
            {msg.video && (
              <video
                src={msg.video}
                controls
                style={{ width: "100%", marginBottom: 10 }}
              />
            )}
            {msg.audio && (
              <audio
                src={msg.audio}
                controls
                style={{ display: "block", marginBottom: 10 }}
              />
            )}
            {msg.text && <p>{msg.text}</p>}
            {msg.response?.message?.video_url && (
              <a
                href={msg.response.message.video_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", marginTop: 10 }}
              >
                🔗 View Synced Video
              </a>
            )}
          </div>
        ))}

        <div style={{ marginTop: 30 }}>
          <Dropdown>
            <Dropdown.Toggle variant="primary" id="video-dropdown">
              🎥 Video
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as="label" htmlFor="video-camera">
                📹 Capture Video
              </Dropdown.Item>
              <Dropdown.Item as="label" htmlFor="video-file">
                📁 Upload Video
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <input
            id="video-camera"
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleVideoSelect}
            style={{ display: "none" }}
          />
          <input
            id="video-file"
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            style={{ display: "none" }}
          />

          <div style={{ marginTop: 20 }}>
            {!isRecording ? (
              <Button variant="success" onClick={handleStartRecording}>
                🎙 Start Recording
              </Button>
            ) : (
              <Button variant="danger" onClick={handleStopRecording}>
                ⏹ Stop Recording
              </Button>
            )}
          </div>

          {audioURL && <audio src={audioURL} controls style={{ marginTop: 10 }} />}

          <Button
            variant="primary"
            onClick={handleUpload}
            style={{ display: "block", marginTop: 30 }}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "🚀 Upload & Sync"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Real;
