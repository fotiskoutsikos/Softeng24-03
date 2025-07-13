import '../../App.css';
//import '../../components/AdminComponents/AdminHomepage.css'; // Optional: CSS for styling
import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// Εισαγωγή όλων των admin σελίδων
import PassesCost from './PassesCost';
import ChargesBy from './ChargesBy';
import TollStationPasses from './TollStationPasses';
import PassAnalysis from './PassAnalysis';
import HealthCheck from '../AdminPages/HealthCheck';
import UsersList from '../AdminPages/UsersList';
import ResetStations from './ResetStations';
import AddPasses from './AddPasses';
import ResetPasses from './ResetPasses';
import LogoutButton from '../LogoutButton';
import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';
import TollStatsChartPage from './TollStatsChartPage';
import UserMananagent from '../AdminPages/UserManagement';

function AdminHomepage() {
  const [advancedSearchDropdownOpen, setAdvancedSearchDropdownOpen] = useState(false);
  const [adminFunctionsDropdownOpen, setAdminFunctionsDropdownOpen] = useState(false);
  const [statisticsDropdownOpen, setStatisticsDropdownOpen] = useState(false);

  const toggleAdvancedSearchDropdown = () => {
    setAdvancedSearchDropdownOpen(!advancedSearchDropdownOpen);
    setAdminFunctionsDropdownOpen(false);
    setStatisticsDropdownOpen(false);
  };

  const toggleAdminFunctionsDropdown = () => {
    setAdminFunctionsDropdownOpen(!adminFunctionsDropdownOpen);
    setAdvancedSearchDropdownOpen(false);
    setStatisticsDropdownOpen(false);
  };

  const toggleStatisticsDropdown = () => {
    setStatisticsDropdownOpen(!statisticsDropdownOpen);
    setAdvancedSearchDropdownOpen(false);
    setAdminFunctionsDropdownOpen(false);
  };

  return (
    <div className="App">
      <h1>Admin Dashboard</h1>
      <SessionExpiredBanner />


      <nav className="admin-nav">
        <ul className="nav-list">
          <li className="nav-item" onClick={toggleAdvancedSearchDropdown}>
            Advanced Search
            {advancedSearchDropdownOpen && (
              <ul className="dropdown">
                <li><Link to="/passescost">Passes Cost</Link></li>
                <li><Link to="/chargesby">Charges By</Link></li>
                <li><Link to="/tollstationpasses">Toll Station Passes</Link></li>
                <li><Link to="/passanalysis">Pass Analysis</Link></li>
              </ul>
            )}
          </li>
          <li className="nav-item" onClick={toggleAdminFunctionsDropdown}>
            Admin Functions
            {adminFunctionsDropdownOpen && (
              <ul className="dropdown">
                <li><Link to="/admin/healthcheck">Health Check</Link></li>
                <li><Link to="/admin/resetstations">Reset Stations</Link></li>
                <li><Link to="/admin/resetpasses">Reset Passes</Link></li>
                <li><Link to="/admin/addpasses">Add Passes</Link></li>
                <li><Link to="/admin/users">Users List</Link></li>
                <li><Link to="/admin/usermod">User Management </Link></li>
              </ul>
            )}
          </li>
          <li className="nav-item" onClick={toggleStatisticsDropdown}>
            Statistics
            {statisticsDropdownOpen && (
              <ul className="dropdown">
                {/* Placeholder for future Statistics options */}
                <li><Link to="/tollstatschartpie">Toll Stats</Link></li>
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <div className="logout-container">
        <LogoutButton />
      </div>


      {/* ✅ Only use <Routes> without <Router> */}
      <Routes>
        <Route path="/passescost" element={<PassesCost />} />
        <Route path="/chargesby" element={<ChargesBy />} />
        <Route path="/tollstationpasses" element={<TollStationPasses />} />
        <Route path="/passanalysis" element={<PassAnalysis />} />
        <Route path="/admin/healthcheck" element={<HealthCheck />} />
        <Route path="/admin/users" element={<UsersList />} />
        <Route path="/admin/usermod" element={<UserMananagent />} />
        <Route path="/admin/resetstations" element={<ResetStations />} />
        <Route path="/admin/resetpasses" element={<ResetPasses />} />
        <Route path="/admin/addpasses" element={<AddPasses />} />
        <Route path='/tollstatschartpie' element={<TollStatsChartPage />} />
      </Routes>
    </div>
  );
}

export default AdminHomepage;
