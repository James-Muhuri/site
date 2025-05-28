import { Link } from "react-router-dom";
import React from 'react'

function Picture() {
  return (
    <div className="container mt-4">
      <div className="row text-center gy-3">
      
        <div className="col-12 col-md-6">
          <Link to="/image">
            <button className="btn btn-primary w-100">Image to Image</button>
          </Link>
        </div>

        <div className="col-12 col-md-6">
          <Link to="/imagination">
            <button className="btn btn-warning w-100">Imagination AI</button>
          </Link>
          
        </div>
         <div className="col-12 col-md-6">
          <Link to="/video">
            <button className="btn btn-success w-100">Video manipulation</button>
          </Link>
          
        </div>
      </div>
    </div>
  );
}

export default Picture;