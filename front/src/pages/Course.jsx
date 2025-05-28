import Drop from "../components/Drop"; // Dropdown
import Search from "../components/Search"; // Search
import { Outlet } from "react-router-dom"; // Render nested routes here
import React from 'react'
function Course() {
  return (
    <>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12 col-md-3 mb-3 mb-md-0">
            <Drop /> {/* Dropdown Menu */}
          </div>
          <div className="col-12 col-md-9">
            <Search /> {/* Search Bar */}
            <Outlet /> {/* Renders nested pages like Home, Shorts, etc. */}
          </div>
        </div>
      </div>
    </>
  );
}

export default Course;