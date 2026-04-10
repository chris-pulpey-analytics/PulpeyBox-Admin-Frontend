import { createSlice } from '@reduxjs/toolkit'

const stored = localStorage.getItem('admin_user')

const initialState = {
  user: stored ? JSON.parse(stored) : null,
  token: localStorage.getItem('admin_token') || null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { access_token, ...user } = action.payload
      state.user = user
      state.token = access_token
      localStorage.setItem('admin_user', JSON.stringify(user))
      localStorage.setItem('admin_token', access_token)
    },
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_token')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectIsAuthenticated = (state) => !!state.auth.token
