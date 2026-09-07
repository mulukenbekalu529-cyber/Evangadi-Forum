import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LogOut, Sparkles } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar({ title, subtitle, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current search value directly from the URL
  const params = new URLSearchParams(location.search);
  const urlSearch = params.get("q") || params.get("semantic") || "";

  const [searchTerm, setSearchTerm] = useState(urlSearch);

  // Normal keyword search
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = searchTerm.trim();

    if (query) {
      navigate(`/dashboard?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/dashboard");
    }
  };

  // AI semantic search
  const handleSemanticSearch = () => {
    const query = searchTerm.trim();

    if (query.length >= 3) {
      navigate(`/dashboard?semantic=${encodeURIComponent(query)}`);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    navigate("/dashboard");
  };

  return (
    <header className={styles.navbar}>
      {/* Page title */}
      <div className={styles.navbar__titleBlock}>
        <h2 className={styles.navbar__pageTitle}>{title}</h2>

        {subtitle && <p className={styles.navbar__pageSubtitle}>{subtitle}</p>}
      </div>

      {/* Search */}
      <form className={styles.navbar__search} onSubmit={handleSearchSubmit}>
        <div className={styles["navbar__search-icon"]}>
          <Search size={16} />
        </div>

        <input
          id="search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search questions by keyword..."
          className={styles["navbar__search-input"]}
          aria-label="Search questions by keyword"
        />

        {/* AI Search button */}
        {searchTerm.trim().length >= 3 && (
          <button
            type="button"
            onClick={handleSemanticSearch}
            className={styles["navbar__semantic-button"]}
            title="Use AI Semantic Search"
          >
            <Sparkles size={14} />

            <span className={styles["navbar__semantic-text"]}>AI Search</span>
          </button>
        )}

        {/* Clear search */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className={styles["navbar__clear-button"]}
            aria-label="Clear search"
            title="Clear search"
          >
            ×
          </button>
        )}
      </form>

      {/* User section */}
      <div className={styles.navbar__actions}>
        <div className={styles.navbar__user}>
          <span className={styles["navbar__user-name"]}>
            {user
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : "Guest"}
          </span>

          <div className={styles["navbar__user-avatar"]}>
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${user?.firstName || "User"} ${user?.lastName || ""}`,
                )}&background=random`
              }
              alt="User avatar"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Logout */}
        {user && (
          <button
            type="button"
            className={styles.navbar__logout}
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
