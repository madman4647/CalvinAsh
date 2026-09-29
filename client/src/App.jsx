import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ComponentGalleryPage from './pages/ComponentGalleryPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/gallery" replace />} />
        <Route path="/gallery" element={<ComponentGalleryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
