
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Discovery from './Discovery'
import Results from './Results'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Discovery />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
