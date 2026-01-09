import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DevApp from './pages/DevApp';
import UserFlow from './pages/UserFlow';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserFlow />} />
        <Route path="/dev" element={<DevApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
