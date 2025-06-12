import React, { useState, useEffect } from "react";
import axios from "axios";
import AdBanner from "./AdBanner";

const AdContainer = () => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    const fetchAds = async () => {
      const res = await axios.get(`http://localhost:5000/api/get-ads`);
      setAds(res.data);
    };

    fetchAds();
  }, []);

  return (
    <div>
      {ads.length === 0 && <p>No ads available</p>}
      {ads.map((ad, index) => (
        <AdBanner key={index} ad={ad} organizationId={ad.organizationId} />
      ))}
    </div>
  );
};

export default AdContainer;
//the container receives all ads you place them in a specific page at your own laxury where you want and when you want the banner does the tracking and saving infomation