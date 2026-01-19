import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './auth.module.css';

const users = [
  { email: 'user1@test.com', password: '123456' },
  { email: 'user2@test.com', password: 'pass456' },
  { email: 'user3@test.com', password: 'pass789' },
];

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<'form' | 'loading'>('form');
  const [progress, setProgress] = useState(0);
  const backgroundUrl = '/raw-assets/login-bg{nomip}{nc}{fix}{mIgnore}.jpg';
  const logoUrl = '/raw-assets/logo{nomip}{nc}{fix}{mIgnore}.png';
  const loaderImg = '/raw-assets/preloader{nomip}{nc}{fix}{mIgnore}.png';
  useEffect(() => {
    if (status !== 'loading') return;
    const totalMs = 3000;
    const stepMs = 10;
    let current = 0;

    const interval = setInterval(() => {
      current += stepMs;
      const persent = Math.min(100, Math.round((current / totalMs) * 100));
      setProgress(persent);
      if (persent >= 100) {
        clearInterval(interval);
        navigate('/lobby');
      }
    }, stepMs);
    return () => {
      clearInterval(interval);
    };
  }, [status, navigate]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (users.some((u) => u.email === email && u.password === password)) {
      setStatus('loading');
    }
  };

  return status === 'form' ? (
    <section
      className={styles.authShell}
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className={styles.authLayer} />

      <div className={styles.logoWrap}>
        <img src={logoUrl} alt="Casino logo" className={styles.logoLarge} />
      </div>

      <div className={styles.card}>
        <form className={styles.stack} onSubmit={onSubmit}>
          <label className={styles.field} htmlFor="Username">
            <span className={styles.fieldLabel}>Username</span>
            <input
              id="Username"
              className={styles.input}
              type="email"
              placeholder="USERNAME..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className={styles.field} htmlFor="password">
            <span className={styles.fieldLabel}>Password</span>
            <input
              id="password"
              className={styles.input}
              type="password"
              placeholder="PASSWORD..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={remember}
              onChange={() => setRemember((val) => !val)}
            />
            <span className={styles.checkboxLabel}>Remember me</span>
          </label>

          <button className={styles.enter} type="submit">
            ENTER
          </button>

          <p className={styles.helper}>sales@vegas-x.net</p>
          <button className={styles.linkButton} type="button">
            Forgot password?
          </button>
        </form>
      </div>
    </section>
  ) : (
    <div className={styles.loaderContainer}>
      <img
        className={styles.preloaderImg}
        src={`${loaderImg}`}
        alt="preloaderImg"
      ></img>
      <div>loading {progress}%</div>
    </div>
  );
}

export default AuthPage;
