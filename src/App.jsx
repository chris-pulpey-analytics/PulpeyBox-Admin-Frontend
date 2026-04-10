import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from './store/authSlice'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/Users'
import UserDetail from './pages/Users/UserDetail'
import SurveysPage from './pages/Surveys'
import SurveyForm from './pages/Surveys/SurveyForm'
import NewsPage from './pages/News'
import NewsForm from './pages/News/NewsForm'
import SettingsPage from './pages/Settings'
import LocationsPage from './pages/Locations'
import ContactPage from './pages/ContactUs'
import MapPage from './pages/Map'

function ProtectedRoute({ children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  return isAuth ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="surveys" element={<SurveysPage />} />
          <Route path="surveys/new" element={<SurveyForm />} />
          <Route path="surveys/:id/edit" element={<SurveyForm />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/new" element={<NewsForm />} />
          <Route path="news/:id/edit" element={<NewsForm />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="map" element={<MapPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
