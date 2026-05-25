import React from 'react';

export const AuthContext = React.createContext({
  auth: {
    token: null,
    user: null
  },
  login: () => {},
  logout: () => {},
  setLoading: () => {}
});
