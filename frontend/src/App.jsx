import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
/*import './App.css'*/
import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './Signup'
import Login from './Login'
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import Home from './assets/Home'


function App() {
  

  return (
    <div>
      
        <Routes>
          <Route path='/register' element={<Signup/>}> </Route>
          <Route path='/login' element={<Login/>}> </Route>
          <Route path='/home' element={<Home/>}> </Route>

        </Routes>
      
    
    </div>
  )
}

export default App
