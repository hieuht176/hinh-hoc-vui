import { Route, Routes } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import HomePage from './pages/HomePage'
import Gallery2DPage from './pages/Gallery2DPage'
import Gallery3DPage from './pages/Gallery3DPage'
import Detail2DPage from './pages/Detail2DPage'
import Detail3DPage from './pages/Detail3DPage'
import Combine2DPage from './pages/Combine2DPage'
import Combine3DPage from './pages/Combine3DPage'
import TransformPage from './pages/TransformPage'

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hinh-2d" element={<Gallery2DPage />} />
        <Route path="/hinh-2d/:id" element={<Detail2DPage />} />
        <Route path="/hinh-3d" element={<Gallery3DPage />} />
        <Route path="/hinh-3d/:id" element={<Detail3DPage />} />
        <Route path="/ghep-hinh-2d" element={<Combine2DPage />} />
        <Route path="/ghep-hinh-3d" element={<Combine3DPage />} />
        <Route path="/phep-bien-hinh" element={<TransformPage />} />
      </Routes>
    </div>
  )
}
