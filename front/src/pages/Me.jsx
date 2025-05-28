import { useState, useRef } from "react";
import { Button, ProgressBar } from "react-bootstrap";
import React from 'react';

function Me() {
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputUpload = useRef(null);

  // Handle video file selection and upload
  const handleVideoChange = async (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);

    for (const file of files) {
      if (file.type.startsWith("video/")) {
        const formData = new FormData();
        formData.append("videoFile", file);

        try {
          const xhr = new XMLHttpRequest();
         xhr.open("POST", `${process.env.REACT_APP_EXPRESS_API_URL}/upload-video`);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
            }
          };

          xhr.onload = () => {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              alert(`Successfully uploaded video: ${file.name}`);
            } else {
              alert(`Failed to upload video: ${file.name}`);
            }
            setUploadProgress(0); // Reset progress
            setIsUploading(false);
          };

          xhr.onerror = () => {
            console.error(`Error uploading video ${file.name}`);
            setIsUploading(false);
          };

          xhr.send(formData);
        } catch (error) {
          console.error(`Error uploading video ${file.name}:`, error);
          setIsUploading(false);
        }
      } else {
        alert(`Invalid file type: ${file.name}`);
        setIsUploading(false);
      }
    }

    setShowUploadDropdown(false);
  };

  // Dropdown for video file upload
  const UploadMediaDropdown = () => (
    <div
      className="dropdown-menu custom-dropdown"
      style={{
        position: "absolute",
        top: "70px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "#fff",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <Button variant="light" onClick={() => fileInputUpload.current.click()} disabled={isUploading}>
        <img src="/images.png" alt="Gallery" width="44" height="44" /> Choose Video
      </Button>
      <input
        type="file"
        accept="video/*"
        multiple
        style={{ display: "none" }}
        ref={fileInputUpload}
        onChange={handleVideoChange}
      />

      {isUploading && (
        <div style={{ width: "100%", marginTop: "10px" }}>
          <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
        </div>
      )}
    </div>
  );

  return (
    <div className="container" style={{ padding: "20px" }}>
      {/* Upload Media Button */}
      <div className="upload-section" style={{ position: "relative" }}>
        <Button
          variant="primary"
          onClick={() => setShowUploadDropdown(!showUploadDropdown)}
          style={{ minWidth: "120px" }}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Media"}
        </Button>
        {showUploadDropdown && <UploadMediaDropdown />}
      </div>
    </div>
  );
}

export default Me;