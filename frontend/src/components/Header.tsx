import moment from "moment";
import { useEffect, useState } from "react";
import './Header.css';

const Header: React.FC<{ isDarkMode: boolean; toggleTheme: () => void; }> = ({ isDarkMode, toggleTheme }) => {
  const [currentDateTime, setCurrentDateTime] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-text">
          <h1>✈️ Aircraft Maintenance Timeline</h1>
          <p className="subtitle">Real-time visualization of flight schedules and maintenance work packages</p>
        </div>
        <div className="header-right">
          <div className="current-datetime">
            <div className="date-display">{currentDateTime.format('dddd, MMMM DD, YYYY')}</div>
            <div className="time-display">{currentDateTime.format('HH:mm:ss')}</div>
          </div>
          <button onClick={toggleTheme} className="theme-toggle-btn" title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;