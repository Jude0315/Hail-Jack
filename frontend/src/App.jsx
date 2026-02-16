/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
/*import './App.css'*/ 

//import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './pages/Signup'
import Login from './pages/Login'
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import Home from './pages/Home'

import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";
import HowToPlay from "./pages/HowToPlay";



function App() {
  

  return (
    <div>
        
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path='/register' element={<Signup/>}> </Route>
          <Route path='/login' element={<Login/>}> </Route>
         
        <Route path='/home' element={<Home/>}> </Route>

        <Route path="/dashboard" element={<Dashboard />} />
<Route path="/game" element={<Game />} />
<Route path="/leaderboard" element={<Leaderboard />} />
<Route path="/how" element={<HowToPlay />} />
        </Routes>
      
    
    </div>
  )
}

export default App
