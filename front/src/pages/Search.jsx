import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Search() {
  const [query, setQuery] = useState('');
  const [searchBy, setSearchBy] = useState('title');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Call backend with proper query param (e.g. ?title=xxx or ?author=yyy)
      const url = new URL(`http://localhost:8000/search`);
      url.searchParams.append(searchBy, query);

      const res = await fetch(url.toString());
      const data = await res.json();

      // Navigate to /list with books in state
      navigate('/list', { state: { books: data.results } });
    } catch (err) {
      setError('Failed to fetch books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Find Your Book</h1>

      <div className="row justify-content-center">
        <div className="col-md-6">

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search by ${searchBy}`}
            className="form-control form-control-lg mb-3"
            aria-label="Search books"
          />

          <label htmlFor="searchBySelect" className="form-label fw-semibold">
            Search by:
          </label>
          <select
            id="searchBySelect"
            className="form-select mb-4"
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="year">Year</option>
          </select>

          <div className="d-grid gap-2">
            <button
              className="btn btn-primary btn-lg"
              disabled={!query.trim() || loading}
              onClick={handleSearch}
            >
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
          </div>

          {error && <p className="text-danger mt-3">{error}</p>}

        </div>
      </div>
    </div>
  );
}

export default Search;