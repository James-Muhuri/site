import { useEffect } from 'react';

function AdBanner() {
  useEffect(() => {
    // Ensure Google AdSense is available and try to push the ad
    try {
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.error("Ad failed to load:", err);
    }
  }, []);

  return (
    <div className="my-4 text-center">
      {/* Google AdSense display block */}
      <ins className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5253971119300893"
        data-ad-slot="2648442501"
        data-ad-format="auto"
        data-full-width-responsive="true">
      </ins>
    </div>
  );
}

export default AdBanner;