import styles from './lobby.module.css';
import { JACKPOTS_MOCK } from '../../../mockDB/jackpotsDB';
import { useEffect, useRef, useState } from 'react';

const jackpotsImg = '/raw-assets/jackpots{nomip}{nc}{fix}{mIgnore}.jpg';
const COUNTER_POS = [
  { left: '23.8%', top: '27%' }, // BRONZE — подгони визуально
  { left: '44.6%', top: '27%' }, // SILVER
  { left: '65.4%', top: '27%' }, // GOLD
  { left: '86.2%', top: '27%' },
];

type JackpotsTransform = {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
};

export function Jeckpots({
  transform,
  designWidth,
  heightPx = 75,
}: {
  transform: JackpotsTransform;
  designWidth: number;
  heightPx?: number;
}) {
  const digitWidth = 21.5;
  const transformStyle = `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scaleX}, ${transform.scaleY})`;

  return (
    <div
      className={styles.jackpots}
      aria-hidden
      style={{
        width: `${designWidth}px`,
        height: `${heightPx}px`,
        position: 'absolute',
        top: 0,
        left: 0,
        transform: transformStyle,
        transformOrigin: '0 0',
      }}
    >
      <div className={styles.jackpotsInner}>
        <img className={styles.jackpotsImg} src={jackpotsImg} alt="jackpots" />
        <div className={styles.digitsLayer}>
          {JACKPOTS_MOCK.map((jcptData, i) => {
            return (
              <JackpotDigitsRow
                digits={jcptData.digits}
                key={i}
                style={COUNTER_POS[i]}
                digitWidth={digitWidth}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DigitCell({ d }: { d: number }) {
  const [pos, setPos] = useState(d);
  const [animate, setAnimate] = useState(true);
  const prevDigitRef = useRef(d);

  useEffect(() => {
    const prev = prevDigitRef.current;

    if (prev === 9 && d === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimate(true);
      setPos(0);

      const t = window.setTimeout(() => {
        setAnimate(false);
        setPos(0);

        requestAnimationFrame(() => setAnimate(true));
      }, 250);

      prevDigitRef.current = d;
      return () => clearTimeout(t);
    }

    setAnimate(true);
    setPos(d);
    prevDigitRef.current = d;
  }, [d]);

  return (
    <div
      className={styles.digit}
      style={{
        backgroundPosition: `0 ${-pos * 34}px`,
        transition: animate ? 'background-position 250ms ease' : 'none',
      }}
    />
  );
}

function JackpotDigitsRow({
  digits,
  style,
  digitWidth,
}: {
  digits: number[];
  style: React.CSSProperties;
  digitWidth: number;
}) {
  return (
    <div
      className={styles.counter}
      style={{ ...style, border: '1px solid red' }}
    >
      <div className={styles.slot} style={{ width: `${digitWidth}px` }}>
        <div className={styles.stub}> </div>
      </div>

      {digits.map((d, i) => (
        <div
          key={i}
          className={styles.slot}
          style={{ width: `${digitWidth}px` }}
        >
          <DigitCell d={d} />
        </div>
      ))}
    </div>
  );
}
