import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
/*import './App.css'*/
import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './Signup'
import {BrowserRouter,Routes,Route} from 'react-router-dom'


function App() {
  

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/register' element={<Signup/>}> </Route>
          <Route path='/login' element={<Signup/>}> </Route>

        </Routes>
      </BrowserRouter>
    
    </div>
  )
}

export default App
