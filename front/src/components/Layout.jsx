import React from 'react'
import { Outlet, Link, useLocation } from "react-router-dom";

function Layout() {
  const location = useLocation();

  return (
    <div id="div">
      <header> 
        <img src={"/Logo.png"} width="44px" height="44px" alt="LanvAI logo"/>
      </header>
      <main>
        <Outlet /> 
      </main>
      <footer>
        <nav className="navbar navbar-light bg-light fixed-bottom">
          <div className="container-fluid p-0">
            <div className="row w-100 m-0 text-center">
              <div className="col-4 p-2">
                <Link
                  className={`nav-link ${location.pathname === "/" ? "active fw-bold" : ""}`}
                  to="/"
                >
                  AI
                </Link>
              </div>
              <div className="col-4 p-2">
                <Link
                  className={`nav-link ${location.pathname === "/picture" ? "active fw-bold" : ""}`}
                  to="/picture"
                >
                  Picture
                </Link>
              </div>
              <div className="col-4 p-2">
                <Link
                  className={`nav-link ${location.pathname === "/course" ? "active fw-bold" : ""}`}
                  to="/course"
                >
                  Course
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </footer>
    </div>
  );
}

export default Layout;