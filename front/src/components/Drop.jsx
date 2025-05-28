import { Link } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { useState, useEffect } from "react";
import React from 'react'



function Drop() {
  const [username, setUsername] = useState(null);  // State to hold username
  const [isAuthorized, setIsAuthorized] = useState(false);  // State to check if the user is authorized

  // List of authorized users (usernames)
  const authorizedUsers = ["user123", "user456"];  // Replace with real usernames

  // Fetch the username from localStorage or authentication system
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);

    if (storedUsername && authorizedUsers.includes(storedUsername)) {
      setIsAuthorized(true);  // User is authorized
    }
  }, []);

  return (
    <><div>
    </div>
      <Dropdown>
        <Dropdown.Toggle variant="light">
          <img src="/dropdown.png" width="50px" height="50px" alt="Dropdown" />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {/* Link to nested routes under course */}
          <Dropdown.Item>
            <Link to="/course/home">
              <img src="/home.png" width="50px" height="50px" alt="Home" /> Home
            </Link>
          </Dropdown.Item>
          <Dropdown.Item>
            <Link to="/course/shorts">
              <img src="/shorts.png" width="50px" height="50px" alt="Shorts" /> Shorts
            </Link>
          </Dropdown.Item>
          <Dropdown.Item>
            <Link to="/course/liked">
              <img src="/like.png" width="50px" height="50px" alt="Liked" /> Liked
            </Link>
          </Dropdown.Item>

          {/* Conditional rendering for the 'My Account' link */}
          <Dropdown.Item>
            {isAuthorized ? (
              <Link to="/course/me">
                <img src="/Me.png" width="50px" height="50px" alt="Me" /> My Account
              </Link>
            ) : (
              <span style={{ color: "gray", cursor: "not-allowed" }}>
                <img src="/Me.png" width="50px" height="50px" alt="Me" /> My Account
              </span>
            )}
          </Dropdown.Item>

          <Dropdown.Item>
            <Link to="/course/history">
              <img src="/history.png" width="50px" height="50px" alt="History" /> History
            </Link>
          </Dropdown.Item>

          <Dropdown.Item>
            <Link to="/course/documentaries">
              <img src="/documentary.png" width="50px" height="50px" alt="Group" /> Documentaries
            </Link>
          </Dropdown.Item>

          
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}

export default Drop;