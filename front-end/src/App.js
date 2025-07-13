import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Εισαγωγή όλων των σελίδων
import PassesCost from './pages/AdminPages/PassesCost';
import HealthCheck from './pages/AdminPages/HealthCheck';
import ChargesBy from './pages/AdminPages/ChargesBy';
import TollStationPasses from './pages/AdminPages/TollStationPasses';
import PassAnalysis from './pages/AdminPages/PassAnalysis';
import Login from './pages/Login';
import Admin from './pages/AdminPages/AdminHomepage';
import Operator from './pages/OperatorPages/OperatorHomepage';
import UsersList from './pages/AdminPages/UsersList';
import ResetStations from './pages/AdminPages/ResetStations';
import AddPasses from './pages/AdminPages/AddPasses';
import ResetPasses from './pages/AdminPages/ResetPasses';
import TollStatsChartPage from './pages/AdminPages/TollStatsChartPage';
import UserManagement from './pages/AdminPages/UserManagement';
import OperatorFinancials from './pages/OperatorPages/OperatorFinancials';
import OperatorStatistics from './pages/OperatorPages/OperatorStatistics';
import OperatorMonthly from './pages/OperatorPages/OperatorMonthly';

function App() {

  return (
    <Router>
      <div className="App">
        <h1>Highway Interoperability System</h1>
        <Routes>
          <Route path="/" element={<Login />} /> {/* Route for the root path */}
          <Route path="/login" element={<Login />} /> {/* You might have this too, but "/" is root */}
          <Route path="/adminpage/*" element={<Admin />} />
          <Route path="/operatorpage/*" element={<Operator />} />
          <Route path="/passescost" element={<PassesCost />} />
          <Route path="/admin/healthcheck" element={<HealthCheck />} />
          <Route path="/admin/resetstations" element={<ResetStations />} />
          <Route path="/admin/resetpasses" element={<ResetPasses />} />
          <Route path="/admin/addpasses" element={<AddPasses />} />
          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin/usermod" element={<UserManagement />} />
          <Route path="/chargesby" element={<ChargesBy />} />
          <Route path="/tollstationpasses" element={<TollStationPasses />} />
          <Route path="/passanalysis" element={<PassAnalysis />} />
          <Route path='/tollstatschartpie' element={<TollStatsChartPage />} />
          <Route path="/operatorstatistics" element={<OperatorStatistics />} />
          <Route path="/operatorfinancials" element={<OperatorFinancials />} />
          <Route path="/operatormonthly" element={<OperatorMonthly />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
