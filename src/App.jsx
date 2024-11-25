import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './Pages/Home'
import Header from './Components/Header'

function App() {
  return (
    <>
      <Header />
      <Home />
    </>
  )
}

export default App
