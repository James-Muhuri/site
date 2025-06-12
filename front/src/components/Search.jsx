import { useState, useEffect } from "react";
import axios from "axios";
import React from 'react'

function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState([]);  // Empty initial state for files
  const [filteredFiles, setFilteredFiles] = useState([]);

  // Fetch files from the API (uploaded videos)
  async function fetchFiles() {
    try {
      // Assuming your backend sends the list of uploaded videos and usernames
     const response = await axios.get(`http://localhost:5000/fetch-uploaded-videos`);
      setFiles(response.data);  // Store the fetched files in state
    } catch (error) {
      console.error("Error while fetching files:", error);
    }
  }

  // Handle input change only (do not filter immediately)
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter files only when Search button is clicked
  const handleSearch = () => {
    // Convert searchQuery to lowercase for case-insensitive comparison
    const filtered = files.filter((file) =>
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) || // Filter by video filename
      file.username.toLowerCase().includes(searchQuery.toLowerCase()) // Filter by username
    );
    setFilteredFiles(filtered);
  };

  // Reset input and show all files
  const handleCancel = () => {
    setSearchQuery("");
    setFilteredFiles(files); // Reset to show all files when canceled
  };

  // Load files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Add another useEffect to initialize filteredFiles when files are available
  useEffect(() => {
    setFilteredFiles(files); // Ensure that files are shown on mount
  }, [files]);

  return (
    <div className="search-bar-container" style={{ padding: "1rem", maxWidth: "100%", margin: "auto" }}>
      <div className="input-group mb-3" style={{ flexWrap: "nowrap" }}>
        <input
          className="form-control"
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search by username or video"
          style={{
            fontSize: "clamp(14px, 3vw, 16px)",
            minWidth: 0,
          }}
        />

        {searchQuery && (
          <button
            onClick={handleCancel}
            className="btn btn-outline-secondary cancel-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
            }}
          >
            <img
              src="/Cancel.png"
              height="24px"
              width="24px"
              alt="cancel button"
            />
          </button>
        )}

        <button
          onClick={handleSearch}
          className="btn btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
          }}
        >
          <img
            src="/search.png"
            height="24px"
            width="24px"
            alt="search button"
          />
        </button>
      </div>

      <ul style={{ padding: 0, listStyleType: "none" }}>
        {filteredFiles.map((file) => (
          <li
            key={file.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "10px",
              fontSize: "clamp(14px, 3vw, 16px)",
            }}
          >
            <p style={{ margin: 0, fontWeight: "bold" }}>{file.filename}</p>
            <p style={{ margin: 0 }}>Uploaded by: {file.username}</p> {/* Show username */}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Search;