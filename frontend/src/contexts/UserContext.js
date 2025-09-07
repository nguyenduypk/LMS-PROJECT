import React from 'react';
import AuthStorage from '../utils/authStorage';

// Lightweight UserContext shim so components can import useUser()
// Works even without wrapping a Provider, by reading from sessionStorage.
const Ctx = React.createContext(null);

export function UserProvider({ children }) {
  const userHook = useUserInternal();
  return <Ctx.Provider value={userHook}>{children}</Ctx.Provider>;
}

function useUserInternal() {
  const [user, setUserState] = React.useState(() => AuthStorage.getUser());

  // Keep user state in sync with sessionStorage changes (same tab updates)
  const setUser = React.useCallback((u) => {
    if (u) {
      AuthStorage.setUser(u);
    } else {
      // if setting null, clear user only
      sessionStorage.removeItem('user');
    }
    setUserState(u);
  }, []);

  const logout = React.useCallback(() => {
    AuthStorage.clearAuth();
    setUserState(null);
  }, []);

  // Sync across tabs/windows via storage event
  React.useEffect(() => {
    function onStorage(e) {
      if (e.storageArea !== sessionStorage) return;
      if (e.key === 'user') {
        try {
          setUserState(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUserState(null);
        }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { user, setUser, logout };
}

export function useUser() {
  const ctx = React.useContext(Ctx);
  const internal = useUserInternal();
  return ctx ? ctx : internal;
}

export default { useUser, UserProvider };
