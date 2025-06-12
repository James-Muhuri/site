import { Link } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import React from 'react';

function Drop() {
  return (
    <>
      <div></div>
      <Dropdown>
        <Dropdown.Toggle variant="light">
          <img src="/dropdown.png" width="50px" height="50px" alt="Dropdown" />
        </Dropdown.Toggle>
        <Dropdown.Menu>
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

          {/* 'My Account' now accessible to everyone */}
          <Dropdown.Item>
            <Link to="/course/me">
              <img src="/Me.png" width="50px" height="50px" alt="Me" /> My Account
            </Link>
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
