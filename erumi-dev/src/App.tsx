import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DevPrototype from './pages/DevPrototype';
import UserPrototype from './pages/UserPrototype';
import ReportTest from './pages/ReportTest';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserPrototype />} />
        <Route path="/dev" element={<DevPrototype />} />
        <Route path="/report-test" element={<ReportTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

