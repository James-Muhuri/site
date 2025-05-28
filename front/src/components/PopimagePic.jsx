import { OverlayTrigger, Button, Popover } from "react-bootstrap";
import { useRef } from "react";
import React from 'react'

function PopimagePic() {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleCameraClick = () => {
    cameraInputRef.current.click();
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file:", file);
      // You can now upload it, preview it, or send it to backend
    }
  };

  const popover = (
    <Popover
      style={{
        borderRadius: "15px",
        maxWidth: "90vw", // prevent overflow on small screens
        width: "max-content",
      }}
    >
      <Popover.Body
        className="d-flex flex-column flex-md-row align-items-center gap-3"
        style={{ padding: "1rem", fontSize: "clamp(14px, 2.5vw, 16px)" }} // responsive font
      >
        {/* Camera icon triggers camera input */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={handleCameraClick}>
          <img src="/camera.png" width="44px" height="44px" alt="Camera" />
          <p style={{ margin: 0 }}>Camera</p>
        </div>

        {/* Image icon triggers file picker */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={handleImageClick}>
          <img src="/images.png" width="44px" height="44px" alt="Images" />
          <p style={{ margin: 0 }}>Images</p>
        </div>

        {/* Hidden Inputs */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
      <Button
        variant="secondary"
        style={{
          borderRadius: "50%",
          padding: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img src="/plus.png" height="44px" width="44px" alt="Plus icon" />
      </Button>
    </OverlayTrigger>
  );
}

export default PopimagePic;