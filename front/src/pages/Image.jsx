import { useState } from "react";
import { Button, FormControl } from "react-bootstrap";
import PopimagePic from "../components/PopimagePic";
import React from "react";

function Image() {
  const [imageFile, setImageFile] = useState(null);
  const [description, setDescription] = useState("");
  const [messages, setMessages] = useState([]);

  // Handle image selection from file input or camera
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleUpload = async () => {
    // Require BOTH image and description
    if (!imageFile || !description.trim()) {
      alert("Please select an image AND add a description.");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("description", description);

    // Add user message to chat
    const userMessage = {
      type: "user",
      text: description,
      image: URL.createObjectURL(imageFile),
    };
    setMessages((prev) => [...prev, userMessage]);
    setDescription("");
    setImageFile(null);

    try {
const response = await fetch(`${process.env.REACT_APP_PYTHON_API_URL}/process`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const aiMessage = {
        type: "ai",
        text: data.message,
        downloadable: data.downloadUrl, // Optional: add download URL
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  return (
    <div style={styles.container}>
      {/* Chat bubble UI */}
      {messages.map((msg, index) => (
        <div
          key={index}
          style={{
            ...styles.chatBubble,
            justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
          }}
        >
          <div style={styles.messageContainer}>
            {msg.image && (
              <img
                src={msg.image}
                alt="user-upload"
                style={styles.image}
              />
            )}
            <p style={styles.text}>{msg.text}</p>
            {msg.downloadable && (
              <a
                href={`http://localhost:8000/download/imagepage/${msg.downloadable.split("/").pop()}`}
                download
                style={styles.downloadLink}
              >
                Download
              </a>
            )}
            {/* Copy button */}
            <Button variant="link" size="sm" onClick={() => copyToClipboard(msg.text)}>
              📋
            </Button>
          </div>
        </div>
      ))}

      {/* Input Area */}
      <div style={styles.inputContainer}>
        {/* Image Preview Above Text Area */}
        {imageFile && (
          <div style={styles.previewContainer}>
            <img
              src={URL.createObjectURL(imageFile)}
              alt="preview"
              style={styles.previewImage}
            />
          </div>
        )}

        {/* Description Text Area */}
        <FormControl
          as="textarea"
          rows={2}
          placeholder="Describe how you want the image to be altered"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
        />

        <div style={styles.buttonContainer}>
          {/* Image Selection Button */}
          <label htmlFor="image-input">
            <PopimagePic onImageSelect={setImageFile} />
          </label>

          {/* File Input for Image Selection or Camera */}
          <input
            id="image-input"
            type="file"
            accept="image/*"
            capture="camera"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />

          {/* Upload Button */}
          <Button variant="light" onClick={handleUpload} style={styles.uploadButton}>
            <img src="/Upload.png" width="25px" height="25px" alt="upload-icon" />
          </Button>
        </div>
      </div>

      {/* Simple fade animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    paddingBottom: "160px",
    paddingTop: "20px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  chatBubble: {
    display: "flex",
    padding: "8px 16px",
    animation: "fadeIn 0.6s ease",
  },
  messageContainer: {
    backgroundColor: "#eee",
    borderRadius: "16px",
    padding: "10px 14px",
    maxWidth: "70%",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    position: "relative",
  },
  image: {
    width: "100%",
    borderRadius: "12px",
    marginBottom: "8px",
  },
  text: {
    margin: 0,
  },
  downloadLink: {
    display: "block",
    marginTop: "8px",
    color: "blue",
    textDecoration: "underline",
  },
  inputContainer: {
    position: "fixed",
    bottom: "80px",
    left: "20px",
    right: "20px",
    zIndex: "1000",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f7f7f8",
    border: "1px solid #ccc",
    borderRadius: "25px",
    padding: "12px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  textarea: {
    border: "none",
    resize: "none",
    outline: "none",
    backgroundColor: "transparent",
    fontSize: "14px",
    boxShadow: "none",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
    marginTop: "10px",
  },
  uploadButton: {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  },
  previewContainer: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
  },
  previewImage: {
    maxWidth: "100%",
    borderRadius: "8px",
  },
};

export default Image;