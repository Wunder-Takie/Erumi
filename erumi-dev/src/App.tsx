import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DevApp from './pages/DevApp';
import UserFlow from './pages/UserFlow';
import ReportTest from './pages/ReportTest';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserFlow />} />
        <Route path="/dev" element={<DevApp />} />
        <Route path="/report-test" element={<ReportTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
