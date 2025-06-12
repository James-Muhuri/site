import React, { useEffect, useState, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import axios from "axios";
import { useParams } from 'react-router-dom';
const APP_ID = "3dcd74c98aa4456fb4ff452a063269d6";
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

function LiveClass() {
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupCount, setGroupCount] = useState(2);
  const chatBoxRef = useRef(null);
   const { courseId, lessonIndex,organizationId } = useParams();

  useEffect(() => {
    const joinChannel = async () => {
      const channelName = "live-class";
      const tokenRes = await axios.get(`http://localhost:5000/api/token?channelName=${channelName}`);
      const token = tokenRes.data.token;

      await client.join(APP_ID, channelName, token, null);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      await client.publish([audioTrack, videoTrack]);

      videoTrack.play("local-player");

      setJoined(true);

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          user.videoTrack.play(`user-player-${user.uid}`);
        }
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
        setRemoteUsers((prev) => {
          if (prev.find((u) => u.uid === user.uid)) return prev;
          return [...prev, user];
        });
      });

      client.on("user-unpublished", (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      client.on("user-left", (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });
    };

    joinChannel();

    return () => {
      leaveClass();
    };
    // eslint-disable-next-line
  }, []);

  const leaveClass = async () => {
    if (localAudioTrack) localAudioTrack.close();
    if (localVideoTrack) localVideoTrack.close();
    await client.leave();
    setRemoteUsers([]);
    setJoined(false);
    setGroups([]);
  };

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(videoOff);
      setVideoOff(!videoOff);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      setChat((prev) => [...prev, { sender: "You", text: message }]);
      setMessage("");
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBoxRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // HOST ACTIONS
  // Mute participant
  const muteParticipant = (uid) => {
    const user = remoteUsers.find((u) => u.uid === uid);
    if (user && user.audioTrack) {
      user.audioTrack.setEnabled(false);
    }
  };

  // Unmute participant
  const unmuteParticipant = (uid) => {
    const user = remoteUsers.find((u) => u.uid === uid);
    if (user && user.audioTrack) {
      user.audioTrack.setEnabled(true);
    }
  };

  // Kick participant
  const kickParticipant = async (uid) => {
    try {
      // There's no direct kick in Agora SDK, simulate by forcing user to leave
      // Inform backend or signal to user to leave or forcibly disconnect client
      // For demo, remove from UI only:
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== uid));
      // You would implement backend signaling to disconnect forcibly if needed
    } catch (error) {
      console.error("Kick failed", error);
    }
  };

  // Create groups
  const createGroups = () => {
    if (groupCount < 1) return;
    const participants = [...remoteUsers];
    const newGroups = Array.from({ length: groupCount }, () => []);
    participants.forEach((participant, idx) => {
      newGroups[idx % groupCount].push(participant);
    });
    setGroups(newGroups);
  };

  // Return to main session (clear groups)
  const returnToMainSession = () => {
    setGroups([]);
  };

  // End class for all
  const endClass = () => {
    leaveClass();
    alert("Class is over");
  };

  return (
    <div className="container mt-4">
      <h2>Live Class {isHost && "(Host)"}</h2>

      <div className="d-flex flex-wrap gap-3 mb-3">
        <div
          id="local-player"
          style={{ width: "300px", height: "200px", backgroundColor: "#000" }}
        ></div>
        {groups.length === 0
          ? remoteUsers.map((user) => (
              <div
                key={user.uid}
                id={`user-player-${user.uid}`}
                style={{ width: "300px", height: "200px", backgroundColor: "#222" }}
              ></div>
            ))
          : groups.map((group, i) => (
              <div
                key={`group-${i}`}
                style={{
                  border: "2px solid #007bff",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >
                <h5>Group {i + 1}</h5>
                <div className="d-flex gap-2 flex-wrap">
                  {group.map((user) => (
                    <div
                      key={user.uid}
                      id={`user-player-${user.uid}`}
                      style={{ width: "150px", height: "120px", backgroundColor: "#444" }}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
      </div>

      <div className="mb-3">
        <button className="btn btn-secondary me-2" onClick={toggleMute} disabled={!isHost}>
          {isMuted ? "Unmute Self" : "Mute Self"}
        </button>
        <button className="btn btn-secondary me-2" onClick={toggleVideo}>
          {videoOff ? "Turn Video On" : "Turn Video Off"}
        </button>
        <button className="btn btn-danger me-2" onClick={leaveClass}>
          Leave Class
        </button>
      </div>

      {isHost && (
        <>
          <hr />
          <h4>Host Controls</h4>

          <div className="mb-3">
            <label>Mute/Unmute Participants</label>
            <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #ccc", padding: "5px" }}>
              {remoteUsers.length === 0 && <p>No participants</p>}
              {remoteUsers.map((user) => (
                <div key={user.uid} className="d-flex align-items-center justify-content-between mb-1">
                  <span>User {user.uid}</span>
                  <div>
                    <button
                      className="btn btn-sm btn-warning me-1"
                      onClick={() => muteParticipant(user.uid)}
                    >
                      Mute
                    </button>
                    <button
                      className="btn btn-sm btn-success me-1"
                      onClick={() => unmuteParticipant(user.uid)}
                    >
                      Unmute
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => kickParticipant(user.uid)}
                    >
                      Kick
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label>Group Participants</label>
            <div className="d-flex align-items-center gap-2 mb-2">
              <select
                value={groupCount}
                onChange={(e) => setGroupCount(parseInt(e.target.value, 10))}
                className="form-select w-auto"
              >
                {[2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} Groups
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={createGroups}>
                Create Groups
              </button>
              <button className="btn btn-secondary" onClick={returnToMainSession}>
                Return to Main Session
              </button>
            </div>
            {groups.length > 0 && (
              <div>
                {groups.map((group, i) => (
                  <div key={`group-list-${i}`}>
                    <strong>Group {i + 1}:</strong>{" "}
                    {group.map((user) => `User ${user.uid}`).join(", ")}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-danger" onClick={endClass}>
            End Class
          </button>
        </>
      )}

      <div className="mt-4">
        <h5>Chat</h5>
        <div style={{ maxHeight: "200px", overflowY: "auto", background: "#f1f1f1", padding: 10 }}>
          {chat.map((msg, i) => (
            <div key={i}>
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
          <div ref={chatBoxRef} />
        </div>
        <div className="input-group mt-2">
          <input
            className="form-control"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            disabled={!joined}
          />
          <button className="btn btn-primary" onClick={sendMessage} disabled={!joined}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveClass;