import React, { useState } from 'react';
import axios from 'axios';
import AdBanner from '../components/AdBanner'; // Make sure this path is correct

const Age = () => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ageOffset, setAgeOffset] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0); // Track successful submissions

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setProcessedImageUrl('');
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAgeChange = (e) => {
    setAgeOffset(parseInt(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert("Please upload an image.");

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('ageOffset', ageOffset);

    try {
      const response = await axios.post(
        `http://localhost:5000/age-transform`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setProcessedImageUrl(response.data.transformedImageUrl);
      setSubmissionCount((prev) => prev + 1); // Increment count on success
    } catch (err) {
      console.error(err);
      alert('Error processing image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilenameFromUrl = (url) => {
    return url.substring(url.lastIndexOf('/') + 1);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Age Progression Tool</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="formFile" className="form-label">Upload Your Image</label>
          <input className="form-control" type="file" id="formFile" accept="image/*" onChange={handleImageChange} />
        </div>

        {previewUrl && (
          <div className="mb-3 text-center">
            <p>Original Image:</p>
            <img src={previewUrl} alt="Preview" className="img-thumbnail" style={{ maxHeight: '300px' }} />
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="ageRange" className="form-label">
            Adjust Age ({ageOffset >= 0 ? `+${ageOffset}` : ageOffset} years)
          </label>
          <input
            type="range"
            className="form-range"
            min={2}
            max={100}
            value={ageOffset}
            onChange={handleAgeChange}
            id="ageRange"
          />
        </div>

        <div className="d-grid gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Predict Age'}
          </button>
        </div>
      </form>

      {processedImageUrl && (
        <div className="mt-4 text-center">
          <p>Transformed Image:</p>
          <img src={processedImageUrl} alt="Transformed" className="img-fluid rounded" />
          <div className="mt-3">
            <a href={processedImageUrl} download={getFilenameFromUrl(processedImageUrl)}>
              Download Transformed Image
            </a>
          </div>
        </div>
      )}

      {/* Show AdBanner after 2 submissions */}
      {submissionCount >= 2 && (
        <div className="mt-5">
          <AdBanner />
        </div>
      )}
    </div>
  );
};

export default Age;
