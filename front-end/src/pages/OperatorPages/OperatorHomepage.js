// OperatorHomepage.js

import '../../App.css';
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import LogoutButton from '../LogoutButton';

// Εισαγωγή όλων των operator σελίδων
import OperatorStatistics from './OperatorStatistics';
import OperatorFinancials from './OperatorFinancials';
import OperatorMonthly from './OperatorMonthly';

function OperatorHomepage() {

  return (
    <div className="App">
      <h1>Operator Dashboard</h1>

      <nav className="operator-nav"> {/* ✅ Use operator-nav class for Operator styles */}
        <ul className="nav-list"> {/* Keep nav-list for horizontal layout if needed */}
          <li className="nav-item"> {/* Keep nav-item for consistent list item styling */}
            <Link to="/operatormonthly">Monthly</Link> {/* ✅ Statistics Link - direct link, no span */}
          </li>
          <li className="nav-item"> {/* Keep nav-item for consistent list item styling */}
            <Link to="/operatorfinancials">Finance</Link> {/* ✅ Finance Link - direct link, no span */}
          </li>
          <li className="nav-item"> {/* Keep nav-item for consistent list item styling */}
            <Link to="/operatorstatistics">Statistics</Link> {/* ✅ Statistics Link - direct link, no span */}
          </li>
        </ul>
      </nav>
      <div className="logout-container">
        <LogoutButton />
      </div>

      <Routes>
        <Route path="/operatorstatistics" element={<OperatorStatistics />} />
        <Route path="/operatorfinancials" element={<OperatorFinancials />} />
        <Route path="/operatormonthly" element={<OperatorMonthly />} />
      </Routes>
    </div>


  );
}

export default OperatorHomepage;
