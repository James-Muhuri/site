import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function List() {
  const { state } = useLocation();
  const [books, setBooks] = useState([]);

  // On mount, decide where to get books from
  useEffect(() => {
    if (state?.books) {
      setBooks(state.books);
      localStorage.setItem('lastSearchResults', JSON.stringify(state.books)); // ✅ store in localStorage
    } else {
      const saved = localStorage.getItem('lastSearchResults');
      if (saved) {
        setBooks(JSON.parse(saved)); // ✅ fallback from localStorage
      }
    }
  }, [state]);

  return (
    <div className="container mt-5">
      <h2>Search Results</h2>
      {books.length === 0 ? (
        <p>No books found.</p>
      ) : (
        <ul className="list-group">
          {books.map((book) => (
            <li key={book.id} className="list-group-item">
              <Link
                to={`/options/${book.id}`}
                className="d-block text-decoration-none list-group-item-action"
              >
                <strong>{book.title}</strong> by {book.author}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default List;
