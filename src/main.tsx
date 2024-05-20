import '@/styles/globals.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import NotFound from './components/not-found.tsx'
import Login from './components/auth/login.tsx'
import Signup from './components/auth/signup.tsx'

const router = createBrowserRouter([
  { path: '/', element: <App />, errorElement: <NotFound /> },
  { path: 'login', element: <Login /> },
  { path: 'signup', element: <Signup /> },
  // { path: 'dashbord', element: <Dashbord /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
