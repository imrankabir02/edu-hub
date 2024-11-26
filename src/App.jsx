import Card from './Components/Card';
import Footer from './Components/Footer';
import Header from './Components/Header'
import Home from './Pages/Home';

function App() {
  return (
    <>
      <div className="container relative px-8 mx-auto">
        <Header />
        <Home />
        <Footer/>
      </div>
    </>
  )
}

export default App
