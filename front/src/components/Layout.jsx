import React from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";

function Layout() {
  const location = useLocation();

  return (
    <div id="div" className="d-flex flex-column min-vh-100">
      <header className="bg-light p-2 text-center border-bottom">
        <img src={"/Logo.png"} width="44px" height="44px" alt="LanvAI logo" />
      </header>

      <main className="flex-grow-1 container py-3">
        <Outlet />
      </main>

      <footer>
        <nav className="navbar navbar-light bg-light fixed-bottom border-top">
          <div className="container-fluid px-3">
            <div className="d-flex justify-content-between w-100 flex-wrap text-center">

              <Link
                className={`nav-link ${location.pathname === "/" ? "active fw-bold text-primary" : "text-dark"}`}
                to="/"
              >
                AI
              </Link>

              <Link
                className={`nav-link ${location.pathname === "/picture" ? "active fw-bold text-primary" : "text-dark"}`}
                to="/picture"
              >
                Fantacy
              </Link>

              <Link
                className={`nav-link ${location.pathname === "/course" ? "active fw-bold text-primary" : "text-dark"}`}
                to="/course"
              >
                Course
              </Link>

              <Link
                className={`nav-link ${location.pathname === "/search" ? "active fw-bold text-primary" : "text-dark"}`}
                to="/search"
              >
                Lib
              </Link>

              <Link
                className={`nav-link ${location.pathname === "/welcome" ? "active fw-bold text-primary" : "text-dark"}`}
                to="/welcomeorganizations"
              >
                Course Offering
              </Link>

              <Link
                className={`nav-link ${location.pathname === "/welcomelearners" ? "active fw-bold text-primary" : "text-dark"}`}
                to="/welcomelearners"
              >
                Course Display
              </Link>

            </div>
          </div>
        </nav>
      </footer>
    </div>
  );
}

export default Layout;