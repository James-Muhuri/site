import { useState } from "react";
import { Button, FormControl } from "react-bootstrap";
import axios from "axios";
import React from "react";
import AdBanner from '../components/AdBanner'; // Import your ad component


function Imagination() {
  const [description, setDescription] = useState("");
  const [responseImage, setResponseImage] = useState(null);

  // Track submission count and ad visibility
  const [submitCount, setSubmitCount] = useState(0);
  const [showAd, setShowAd] = useState(false);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("description", description);

    // Log the form data to see what is being sent
    console.log("Form Data:", formData);

    try {
      const res = await axios.post(
        `http://localhost:8000/generate-vision`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Ensure this header is set correctly
          },
        }
      );

      console.log("Response from backend:", res.data);

      setResponseImage({
        remoteUrl: res.data.imageUrl,
        localFile: res.data.localFile,
      });

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
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  return (
    <>
      {/* Response Area */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "100px",
          padding: "20px",
          flexWrap: "wrap", // Allows content to stack on smaller screens
        }}
      >
        {/* AI-generated image */}
        {responseImage && (
          <div style={{ flex: 1, marginRight: "10px", minWidth: "200px" }}>
            <img
              src={responseImage.remoteUrl}
              alt="AI Generated"
              style={{
                width: "100%",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            />
            <a
              href={`http://localhost:8000/download/imagination/${responseImage.localFile}`}
              download="ai_imagination.png"
              style={{
                textDecoration: "none",
                backgroundColor: "#007bff",
                color: "white",
                padding: "10px 15px",
                borderRadius: "8px",
                display: "inline-block",
                textAlign: "center", // Centers text inside the button
                marginTop: "10px", // Adds space between image and button
              }}
            >
              Download Image
            </a>

            {/* Copy Image URL Button */}
            <Button
              variant="link"
              size="sm"
              onClick={() => copyToClipboard(responseImage.remoteUrl)}
              style={{ marginTop: "10px", padding: "0" }}
            >
              Copy Image URL
            </Button>
          </div>
        )}

        {/* User description */}
        {description && (
          <div
            style={{
              flex: 1,
              backgroundColor: "#e0e0e0",
              padding: "15px",
              borderRadius: "10px",
              fontSize: "16px",
              marginLeft: "10px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word", // Ensures long descriptions wrap properly
              minWidth: "200px",
            }}
          >
            {description}

            {/* Copy Description Button */}
            <Button
              variant="link"
              size="sm"
              onClick={() => copyToClipboard(description)}
              style={{ marginTop: "10px", padding: "0" }}
            >
              Copy Description
            </Button>
          </div>
        )}
      </div>

      {/* Show ad every 3 submissions */}
      {showAd && <AdBanner />}

      {/* Input Area */}
      <div
        style={{
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
          width: "calc(100% - 40px)", // Ensures full width on mobile devices
        }}
      >
        <FormControl
          as="textarea"
          rows={2}
          placeholder="Describe anything in your imagination"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            border: "none",
            resize: "none",
            outline: "none",
            backgroundColor: "transparent",
            fontSize: "14px",
            boxShadow: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "8px",
            marginTop: "10px",
            justifyContent: "flex-end", // Aligns the button to the right on mobile
          }}
        >
          <Button variant="light" onClick={handleUpload}>
            <img
              src="/Upload.png"
              width="25px"
              height="25px"
              alt="upload-icon"
            />
          </Button>
        </div>
      </div>
    </>
  );
}

export default Imagination;