import { Outlet, useLocation } from 'react-router-dom';
import './App.css';

function App() {
  const location = useLocation();
  const isAuth = location.pathname.startsWith('/auth');

  return (
    <div className={`app-shell ${isAuth ? 'auth-layout' : ''}`}>
      {/* {!isAuth && (
        <header className="app-header">
          <div>
            <p className="eyebrow">Casino Playground</p>
            <h1>React + PixiJS 8 starter</h1>
            <p className="lede">
              Базовый шаблон с прокидыванием данных между React и Pixi через хук и простым роутингом.
            </p>
          </div>
          <nav className="app-nav">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} className="nav-link">
                <span className="nav-dot" data-active={location.pathname.startsWith(item.path)} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
      )} */}
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
