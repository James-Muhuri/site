import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from "./components/Layout";
import Course from "./pages/Course";
import AI from "./pages/AI";

import Home from "./pages/Home";

import Me from "./pages/Me";
import History from "./pages/History";
import Documentaries from "./pages/Documentaries";
import Liked from "./pages/Liked";


//picture or fantacy page
import Age from "./pages/Age"; 
import Picture from "./pages/Picture";
import Image from "./pages/Image";
import Imagination from "./pages/Imagination";
import Real from "./pages/Real";
import Avatar from "./pages/Avatar";
import Video from "./pages/Video";


// Auth Pages
import Signup from './pages/Signup';
import Login from './pages/Login';
import Forgotpassword from './pages/Forgotpassword';


 import PrivateRoute from "./components/PrivateRoute"; // 🚫 Removed

//the lib
import Search from './pages/Search';
import Audio from './pages/Audio';
import List from './pages/List';
import Option from './pages/Option';
import Reader from './pages/Reader';

//the organizations 
import Profile from './pages/Profile';

// Stripe related imports for wrapping Pay and ConsentForm with Elements
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './stripe';

import Pay from './pages/Pay';
import Buycourse from './pages/Buycourse';
import Displayorg from './pages/Displayorg';
import ConsentForm from './pages/ConsentForm';
import Welcomeorganizations from './pages/Welcomeorganizations';

import Studenttimetabledisplay from './pages/Studenttimetabledisplay';
import Selfpaced from './pages/Selfpaced';
import Organizationcourses from './pages/Organizationcourses';
import Mypaidcoursesstudent from './pages/Mypaidcoursesstudent';






//zoom
import Liveclasses from './pages/Liveclasses';
import Welcomelearners from './pages/Welcomelearners';





// Wrappers to inject Stripe Elements context
const PayWrapper = () => (
  <Elements stripe={stripePromise}>
    <Pay /> 
  </Elements>
);

const ConsentFormWrapper = () => (
  <Elements stripe={stripePromise}>
    <ConsentForm />
  </Elements> 
);

function App() {
  
  return (
    <Router>
      <Routes>
     
  
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotpassword" element={<Forgotpassword />} />

   <Route
          path="/app"
          element={
            <Layout />}
          
  >
          <Route path="course" element={<Course />}>
            <Route path="home" element={<Home />} />
            
            <Route path="liked" element={<Liked />} />
            <Route path="me" element={<Me />} />
            <Route path="history" element={<History />} />
            <Route path="documentaries" element={<Documentaries />} />
          </Route>

          {/* Other Pages under /app */}
          <Route index element={<AI />} />
          <Route path="image" element={<Image />} />
          <Route path="imagination" element={<Imagination />} />
          <Route path="ai" element={<AI />} />
          <Route path="picture" element={<Picture />} />
          <Route path="search" element={<Search />} />
          <Route path="list" element={<List />} />
          <Route path="reader/:bookId" element={<Reader />} />
          <Route path="option/:bookId" element={<Option />} />
          <Route path="audio/:bookId" element={<Audio />} />
          <Route path="profile" element={<Profile />} />
          <Route path="pay" element={<PayWrapper />} />
          <Route path="displayorg" element={<Displayorg />} />
          <Route path="consentform" element={<ConsentFormWrapper />} />
          <Route path="video" element={<Video />} />
           <Route path="real" element={<Real />} />
        <Route path="avatar" element={<Avatar />} />
             <Route path="age" element={<Age />} />
        </Route>
         <Route path="/buycourse/:orgId" element={<Buycourse />} />
      
<Route path="/class/:courseId/organizationId:lessonIndex" element={<Liveclasses />} />

          <Route path="welcomelearners" element={<Welcomelearners />} />
           <Route path="welcomeorganizations" element={<Welcomeorganizations/>} />
         {/* Self-Paced Route */}
        <Route path="/selfpaced/:organizationId/:courseId" element={<Selfpaced />} />

        {/* Semester Live Route */}
         <Route
  path="/studenttimetabledisplay/:organizationId/:courseId"
  element={<Studenttimetabledisplay />}
/>

  <Route path="/mypaidcoursesstudent" element={<Mypaidcoursesstudent />} />
        <Route path="/profile" element={<Profile />} />
  <Route path="/organizationcourses" element={<Organizationcourses />} />
        
        
        
        
        
      
      </Routes>
    </Router>
  );
}

export default App;
