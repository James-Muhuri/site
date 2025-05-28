import { useState, useEffect } from 'react';
import axios from 'axios';
import React from 'react';

function UserAI({ files, setFiles, onSaveComplete }) {
  const [fileText, setFileText] = useState("");  // To display selected filename
  const [loading, setLoading] = useState(false);  // Loading state for upload
  const [uploadIcon, setUploadIcon] = useState("/Upload.png");  // Icon for button
  const [uploadedFileName, setUploadedFileName] = useState(null); // Current uploaded file name

  // Fetch the currently uploaded user PDF (on mount)
  useEffect(() => {
    const fetchUserDoc = async () => {
      try {
        const user_id = localStorage.getItem("user_id");
       const res = await axios.post(`${process.env.REACT_APP_PYTHON_API_URL}/get-userdoc`, { user_id });
        if (res?.data?.file) {
          setUploadedFileName(res.data.file);
        }
      } catch (error) {
        console.error("Failed to fetch uploaded PDF:", error);
        setUploadedFileName(null);
      }
    };
    fetchUserDoc();
  }, []);

  // Handle file selection (PDF only, one file)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    // Reject if not a PDF
    if (selectedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      e.target.value = "";  // Clear selection
      return;
    }

    setFiles([selectedFile]);  // Store a single file
    setFileText(selectedFile.name);  // Show its name
  };

  // Handle the save/upload button click
  const handleSave = async () => {
    if (files.length === 0) {
      alert("Please select a PDF file before saving.");
      return;
    }

    try {
      setLoading(true);
      setUploadIcon("/loading.png");

      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", localStorage.getItem("user_id"));

      const response = await axios.post(`${process.env.REACT_APP_PYTHON_API_URL}/upload-userdoc`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response?.data?.message) {
        throw new Error("Upload failed.");
      }

      alert("PDF uploaded successfully!");
      onSaveComplete();  // Notify parent
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file, please try again.");
    } finally {
      setLoading(false);
      setUploadIcon("/Upload.png");
    }
  };

  return (
    <div
      style={{
        padding: "clamp(16px, 4vw, 24px)",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxWidth: "600px",
        margin: "0 auto",
        boxSizing: "border-box"
      }}
    >
      <h4 style={{ fontSize: "clamp(16px, 4vw, 20px)", marginBottom: "12px" }}>Select PDF to Upload</h4>

      {/* Display uploaded file if it exists */}
      {uploadedFileName ? (
        <div style={{
          marginBottom: "12px",
          padding: "10px",
          backgroundColor: "#eef6f8",
          border: "1px solid #ccc",
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          <strong>Current Uploaded PDF:</strong> {uploadedFileName}
        </div>
      ) : (
        <div style={{
          marginBottom: "12px",
          padding: "10px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffecb5",
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          <strong>No PDF uploaded yet.</strong>
        </div>
      )}

      {/* File input - restrict to one PDF */}
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{
          marginBottom: "10px",
          padding: "8px",
          borderRadius: "5px",
          fontSize: "clamp(14px, 3vw, 16px)",
          width: "100%",
          boxSizing: "border-box"
        }}
      />

      {/* Text area to display the filename */}
      <textarea
        rows="2"
        value={fileText}
        readOnly
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "8px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          resize: "none",
          fontSize: "clamp(14px, 3vw, 16px)",
          boxSizing: "border-box"
        }}
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          marginTop: "12px",
          backgroundColor: "#007bff",
          color: "#fff",
          padding: "10px 16px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: loading ? 0.6 : 1,
          pointerEvents: loading ? "none" : "auto",
          fontSize: "clamp(14px, 3vw, 16px)"
        }}
        disabled={loading}
      >
        <img
          src={uploadIcon}
          alt="Upload Icon"
          width="20px"
          style={{ marginRight: "8px" }}
        />
        {loading ? "Uploading..." : "Save"}
      </button>
    </div>
  );
}

export default UserAI;