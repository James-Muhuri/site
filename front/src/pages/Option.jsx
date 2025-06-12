import { useParams, Link } from 'react-router-dom';  // also get bookId

function Option() {
  const { bookId } = useParams();  // ✅ get bookId from the URL

  return (
    <div className="container mt-4">
      <h2>Choose an Option:</h2>

      {/* Use bookId in both paths */}
      <Link to={`/reader/${bookId}`} className="btn btn-primary me-3">
        📖 Read for Myself
      </Link>

      <Link to={`/audio/${bookId}`} className="btn btn-secondary">
        🎧 Choose Someone to Read for You
      </Link>
    </div>
  );
}

export default Option;