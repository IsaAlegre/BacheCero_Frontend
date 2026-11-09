import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'
import './styles.css'
import './lib/theme'
import './lib/install'

import Landing from './pages/Landing'
import RequireRole from './components/RequireRole'

import VecinoLogin from './pages/vecino/Login'
import Register from './pages/vecino/Register'
import VecinoLayout from './pages/vecino/VecinoLayout'
import Home from './pages/vecino/Home'
import Report from './pages/vecino/Report'
import Result from './pages/vecino/Result'
import MyReports from './pages/vecino/MyReports'
import ReportTracking from './pages/vecino/ReportTracking'
import News from './pages/vecino/News'

import MuniLogin from './pages/municipio/Login'
import MuniLayout from './pages/municipio/MuniLayout'
import Priorities from './pages/municipio/Priorities'
import Tickets from './pages/municipio/Tickets'
import TicketPage from './pages/municipio/TicketPage'
import Review from './pages/municipio/Review'
import History from './pages/municipio/History'
import Stats from './pages/municipio/Stats'
import Reports from './pages/municipio/Reports'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/vecino/login" element={<VecinoLogin />} />
        <Route path="/vecino/registro" element={<Register />} />
        <Route element={<RequireRole role="vecino" />}>
          <Route path="/vecino" element={<VecinoLayout />}>
            <Route index element={<Home />} />
            <Route path="reportar" element={<Report />} />
            <Route path="reporte/:id" element={<Result />} />
            <Route path="mis-reportes" element={<MyReports />} />
            <Route path="mis-reportes/:id" element={<ReportTracking />} />
            <Route path="novedades" element={<News />} />
            <Route path="ayuda" element={<News tab="faq" />} />
          </Route>
        </Route>

        <Route path="/municipio/login" element={<MuniLogin />} />
        <Route element={<RequireRole role="municipio" />}>
          <Route path="/municipio" element={<MuniLayout />}>
            <Route index element={<Priorities />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="tickets/:id" element={<TicketPage />} />
            <Route path="revision" element={<Review />} />
            <Route path="historial" element={<History />} />
            <Route path="estadisticas" element={<Stats />} />
            <Route path="informes" element={<Reports />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
