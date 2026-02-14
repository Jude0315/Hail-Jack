import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios'
import { useNavigate } from "react-router-dom";

function Signup() {

  const [name, setName] = useState()
  const [email, setEmail] = useState()
  const [password, setPassword] = useState()
  const navigate =useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('http://localhost:3001/register', {name, email, password})
    .then(result => {console.log(result)
   
    navigate('/login')
     })
    .catch(err=> console.log(err))
}

  return (
    <div className="bg-secondary min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-6 col-lg-4">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-center mb-4">Register</h2>

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    <strong>Name</strong>
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter Name"
                    name="name"
                    className="form-control"
                    required
                    onChange={(e)=> setName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    <strong>Email</strong>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter Email"
                    name="email"
                    className="form-control"
                    required
                     onChange={(e)=> setEmail(e.target.value)}

                  />
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    <strong>Password</strong>
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter Password"
                    name="password"
                    className="form-control"
                    required
                  onChange={(e)=> setPassword(e.target.value)}

                  />
                </div>

                <button type="submit" className="btn btn-success w-100">
                  Register
                </button>

                <p className="text-center mt-3 mb-2">
                  Already have an account?
                </p>

                <Link to="/login"
                  
                  className="btn btn-outline-secondary w-100"
                >
                  Login
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




export default Signup;
