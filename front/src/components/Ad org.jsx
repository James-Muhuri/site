import { useEffect } from "react";

const AdBanner = ({ ad, organizationId }) => {
  useEffect(() => {
    const url = "http://localhost:5000/api/track-ad-view";
    const data = JSON.stringify({ organizationId });
    const blob = new Blob([data], { type: "application/json" });

    // Use navigator.sendBeacon for reliable background sending if a use just views a little bit then boom the count
    const success = navigator.sendBeacon(url, blob);

    // Optional fallback (e.g., axios) if sendBeacon fails
    if (!success) {
      // axios.post(url, { organizationId }).catch(() => {});
    }
  }, [organizationId]);

  return (
    <div className="ad-banner">
      <p><strong>{ad.adText}</strong></p>
      <a href={ad.website} target="_blank" rel="noreferrer">
        Visit Organization
      </a>
    </div>
  );
};

export default AdBanner;
