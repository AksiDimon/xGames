import { Navigate, createBrowserRouter } from 'react-router-dom';
import App from './App';
import AuthPage from './pages/auth/AuthPage';
import GamePage from './pages/GamePage';
import LobbyPage from './pages/lobby/LobbyPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/auth" replace /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'lobby', element: <LobbyPage /> },
      { path: 'game', element: <GamePage /> },
    ],
  },
]);
