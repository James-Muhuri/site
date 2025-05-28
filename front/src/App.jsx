import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from "./components/Layout";
import Course from "./pages/Course";
import AI from "./pages/AI";
import Picture from "./pages/Picture";
import Home from "./pages/Home";

import Me from "./pages/Me";
import History from "./pages/History";
import Documentaries from "./pages/Documentaries";
import Liked from "./pages/Liked";
import Image from "./pages/Image";
import Imagination from "./pages/Imagination";

// Auth Pages
import Signup from './pages/Signup';
import Login from './pages/Login';
import Forgotpassword from './pages/Forgotpassword';

// Route protection
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
    <Routes>
      {/* Auth Pages (public) */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgotpassword" element={<Forgotpassword />} />

      {/* Protected App Routes */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
  >
        <Route path="course" element={<Course />}>
          <Route path="home" element={<Home />} />
         
          <Route path="liked" element={<Liked />} />
          <Route path="me" element={<Me />} />
          <Route path="history" element={<History />} />
          <Route path="documentaries" element={<Documentaries />} />
        </Route>

        {/* Other Pages under /app */}
        <Route index element={<Course />} />
        <Route path="image" element={<Image />} />
        <Route path="imagination" element={<Imagination />} />
        <Route path="ai" element={<AI />} />
        <Route path="picture" element={<Picture />} />
      </Route>
      </Routes>
      </Router>
  );
}

export default App;