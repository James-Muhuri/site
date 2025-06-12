import { useState, useRef } from 'react';

import Why from "../components/Why";
import Websearch from "../components/Websearch";
import { Button, FormControl } from "react-bootstrap";
import axios from 'axios';
import UserAI from "../components/UserAI";
import React from 'react';


function AI() {
  const [uploadIcon, setUploadIcon] = useState("/Upload.png");
  const [textQuery, setTextQuery] = useState("");
  const [files, setFiles] = useState([]);
  const [aiAnswer, setAiAnswer] = useState("");
  const [reason, setReason] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [webClicked, setWebClicked] = useState(false);
  const [whyClicked, setWhyClicked] = useState(false);
  const [source, setSource] = useState("open");
  const [showUserOptions, setShowUserOptions] = useState(false);
  const [showUserAI, setShowUserAI] = useState(false);
  const [userDataFiles, setUserDataFiles] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // New state: count of form data submissions
  const [submissionCount, setSubmissionCount] = useState(0);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleTextChange = (e) => setTextQuery(e.target.value);

  const triggerFilePicker = () => {
    setShowDropdown(false);
    fileInputRef.current?.click();
  };

  const triggerCameraCapture = () => {
    setShowDropdown(false);
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    const user_id = localStorage.getItem("user_id");

    if (textQuery) formData.append("text", textQuery);
    formData.append("source", source);
    formData.append("user_id", user_id);
    files.forEach(file => formData.append("image", file));

    try {
      setLoading(true);
      setUploadIcon("/loading.png");

      let res;
      if (webClicked) {
        res = await axios.post(`http://localhost:8000/websearch`, { text: textQuery });
      } else {
       res = await axios.post(`http://localhost:8000/ai-image-insight`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
      }

      if (res?.data?.answer) {
        // Add user input + AI answer to chat history
        setChatHistory(prev => {
          const updated = [
            ...prev,
            { user: textQuery || files.map(f => f.name).join(", "), ai: res.data.answer }
          ];
          // Update submission count only if it's a real submission (not web search)
          if (!webClicked) {
            const newCount = submissionCount + 1;
            setSubmissionCount(newCount);
            // After every 3 submissions, add an ad entry
            if (newCount % 3 === 0) {
              updated.push({ ad: true, id: `ad-${newCount}` });
            }
          }
          return updated;
        });

        setAiAnswer(res.data.answer);

        if (whyClicked) {
          const reasonRes = await axios.post(`http://localhost:8000/get-reasoning`, {
            text: textQuery || files.map(f => f.name).join(", "),
            answer: res.data.answer,
            user_id: user_id
          });
          setReason(reasonRes.data.reasoning);
        }
      }

      setTextQuery("");
      setFiles([]);
      setWebClicked(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setUploadIcon("/Upload.png");
      setWhyClicked(false);
    }
  };
  const handleWhy = () => setWhyClicked(true);
  const handleWebsearch = () => setWebClicked(true);

  const handleSaveUserData = (newFiles) => {
    setUserDataFiles(newFiles);
    setShowUserAI(false);
    setShowUserOptions(false);
    setSource("userdata");
  };

  const handleContinueWithDocument = () => {
    setShowUserOptions(false);
    setSource("userdata");
  };

  const handleSourceChange = (newSource) => {
    setSource(newSource);
    setShowUserOptions(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  const btnStyle = {
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "14px",
    flex: 1,
    border: "1px solid #ccc",
    transition: "background-color 0.3s ease",
    minWidth: "100px",
  };

  return (
    <div style={{ padding: "20px", marginTop: "20px" }}>
      {/* Source selection */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "10px",
        marginBottom: "20px", flexDirection: "column",
      }}>
        <div style={{ width: "100%", position: "relative" }}>
          {showUserAI ? (
            <UserAI
              files={userDataFiles}
              setFiles={setUserDataFiles}
              onSaveComplete={handleSaveUserData}
            />
          ) : (
            <>
              <Button
                variant="light"
                style={{
                  ...btnStyle,
                  backgroundColor: source === "userdata" ? "#17a2b8" : undefined,
                  color: source === "userdata" ? "#fff" : undefined,
                  width: "100%",
                }}
                onClick={() => {
                  setShowUserOptions((prev) => !prev);
                  setSource("userdata");
                }}
              >
                User Data
              </Button>
              {showUserOptions && (
                <div style={{
                  position: "absolute", top: "100%", left: "0",
                  marginTop: "5px", backgroundColor: "#f0f0f0",
                  padding: "10px", borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  zIndex: "10", display: "flex", flexDirection: "column",
                  gap: "10px", width: "100%",
                }}>
                  <Button variant="outline-primary" onClick={() => {
                    setShowUserAI(true); setShowUserOptions(false);
                  }}>
                    Edit Source
                  </Button>
                  <Button variant="outline-success" onClick={handleContinueWithDocument}>
                    Continue with Source
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ width: "100%" }}>
          <Button
            variant="light"
            style={{
              ...btnStyle,
              backgroundColor: source === "open" ? "#17a2b8" : undefined,
              color: source === "open" ? "#fff" : undefined,
              width: "100%",
            }}
            onClick={() => handleSourceChange("open")}
          >
            Open Source
          </Button>
        </div>
      </div>

      {/* Chat input */}
      <div style={{
        position: "fixed", bottom: "80px", left: "20px", right: "20px",
        zIndex: "1000", display: "flex", flexDirection: "column",
        backgroundColor: "#f7f7f8", border: "1px solid #ccc",
        borderRadius: "25px", padding: "12px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        maxWidth: "100%",
      }}>
        {files.length > 0 && (
          <div style={{
            marginBottom: "6px", fontSize: "12px", color: "#555",
            overflowX: "auto", whiteSpace: "nowrap",
          }}>
            Uploaded: {files.map(file => file.name).join(", ")}
          </div>
        )}
        <FormControl
          as="textarea"
          rows={2}
          placeholder="Ask Me Anything or Select Files..."
          value={textQuery}
          onChange={handleTextChange}
          style={{
            border: "none", resize: "none", outline: "none",
            backgroundColor: "transparent", fontSize: "14px", boxShadow: "none",
          }}
        />
        <input type="file" accept="image/*" multiple ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: "none" }} onChange={handleFileChange} />
        <div style={{
          display: "flex", flexWrap: "wrap", flexDirection: "row", gap: "8px",
          marginTop: "10px", justifyContent: "center", position: "relative"
        }}>
          <div style={{ position: "relative" }}>
            <Button variant="light" style={btnStyle} onClick={() => setShowDropdown(prev => !prev)}>
              ➕
            </Button>
            {showDropdown && (
              <div style={{
                position: "absolute", bottom: "40px", left: "0",
                backgroundColor: "#fff", border: "1px solid #ccc",
                borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                padding: "10px", zIndex: 1001, display: "flex",
                flexDirection: "column", gap: "6px"
              }}>
                <Button variant="outline-dark" onClick={triggerCameraCapture}>📷 Camera</Button>
                <Button variant="outline-dark" onClick={triggerFilePicker}>🖼 images</Button>

              </div>
            )}
          </div>

          <Button
            variant="light"
            style={{
              ...btnStyle,
              backgroundColor: webClicked ? "#007bff" : undefined,
              color: webClicked ? "#fff" : undefined,
            }}
            onClick={handleWebsearch}
          >
            <Websearch query={textQuery} setAiAnswer={setAiAnswer} />
          </Button>
          <Button
            variant="light"
            style={{
              ...btnStyle,
              backgroundColor: whyClicked ? "#007bff" : undefined,
              color: whyClicked ? "#fff" : undefined,
            }}
            onClick={handleWhy}
          >
            <Why />
          </Button>
          <Button
            variant="light"
            style={{
              ...btnStyle,
              opacity: loading ? 0.6 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
            onClick={handleUpload}
            disabled={loading}
          >
            <img src={uploadIcon} width="25px" height="25px" alt="upload-icon" />
          </Button>
        </div>
      </div>

      {/* Chat History */}
      <div style={{ maxHeight: "300px", overflowY: "auto", marginTop: "10px" }}>
        {chatHistory.map((entry, index) => {
          if (entry.ad) {
            // Render Ad placeholder/banner here
            return (
              <div key={entry.id || index} style={{ textAlign: "center", margin: "20px 0", padding: "10px", backgroundColor: "#e0f7fa", borderRadius: "10px", fontWeight: "bold" }}>
                🚀 Advertisement - Your Ad Here 🚀
              </div>
            );
          }
          return (
            <div key={index}>
              <div className="d-flex justify-content-end mb-2">
                <div className="p-2 bg-secondary text-white rounded d-flex justify-content-between align-items-center" style={{ maxWidth: "70%" }}>
                  <span>{entry.user}</span>
                  <Button variant="link" size="sm" onClick={() => copyToClipboard(entry.user)}>📋</Button>
                </div>
              </div>
              <div className="d-flex justify-content-start mb-2">
                <div className="p-2 bg-light text-dark rounded d-flex justify-content-between align-items-center" style={{ maxWidth: "70%", whiteSpace: "pre-wrap", userSelect: "text", cursor: "text" }}>
                  <span>{entry.ai}</span>
                  <Button variant="link" size="sm" onClick={() => copyToClipboard(entry.ai)}>📋</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AI;