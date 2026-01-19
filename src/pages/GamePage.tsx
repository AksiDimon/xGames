import { useCallback, useEffect, useState } from 'react';
import type { PixiBridgeOptions } from '../pixi/usePixiBridge';
import { useLocation } from 'react-router-dom';
import { Graphics, Text } from 'pixi.js';
import { usePixiBridge } from '../pixi/usePixiBridge';
import styles from './game.module.css';

type ReactToPixi = { bet: number; player: string; room: string; round: number };
type PixiToReact = { winnings: number; round: number };

type GameState = { user?: string; room?: string };
type CreateScene = PixiBridgeOptions<ReactToPixi, PixiToReact>['createScene'];

function GamePage() {
  const location = useLocation();
  const { user = 'Игрок', room = 'Быстрая игра' } = (location.state as GameState | null) ?? {};
  const [bet, setBet] = useState(10);
  const [round, setRound] = useState(1);
  const [lastResult, setLastResult] = useState<PixiToReact | null>(null);

  const createScene = useCallback<CreateScene>(
    ({ app, onReactData, sendToReact }) => {
      const status = new Text('Готовы к ставкам?', {
        fill: '#e5e7eb',
        fontSize: 18,
        fontFamily: 'Space Grotesk, Inter, system-ui, sans-serif',
      });
      status.position.set(16, 14);

      const betLabel = new Text('', {
        fill: '#a5b4fc',
        fontSize: 16,
        fontFamily: 'Space Grotesk, Inter, system-ui, sans-serif',
      });
      betLabel.position.set(16, 44);

      const actionButton = new Graphics()
        .roundRect(0, 0, 180, 52, 12)
        .fill({ color: 0x4f46e5 })
        .stroke({ color: 0x6b72ff, width: 1 });
      actionButton.position.set(16, 84);
      actionButton.eventMode = 'static';
      actionButton.cursor = 'pointer';

      const buttonLabel = new Text('Сделать спин', {
        fill: '#f8fafc',
        fontSize: 16,
        fontFamily: 'Space Grotesk, Inter, system-ui, sans-serif',
      });
      buttonLabel.anchor.set(0.5);
      buttonLabel.position.set(actionButton.width / 2, actionButton.height / 2);
      actionButton.addChild(buttonLabel);

      const pulse = () => {
        actionButton.scale.set(1 + Math.sin(performance.now() / 500) * 0.01);
      };
      app.ticker.add(pulse);

      let currentRound = 1;
      let currentBet = 0;
      let currentPlayer = 'Игрок';
      let currentRoom = 'Лобби';

      const updateFromReact = (payload: ReactToPixi) => {
        currentRound = payload.round;
        currentBet = payload.bet;
        currentPlayer = payload.player;
        currentRoom = payload.room;
        status.text = `${currentPlayer} · ${currentRoom}`;
        betLabel.text = `Ставка: ${currentBet}₽ · Раунд ${currentRound}`;
        buttonLabel.text = `Спин #${currentRound}`;
      };

      const unsubscribe = onReactData(updateFromReact);

      const spin = () => {
        const multiplier = Math.random() * 3;
        const winnings = Math.round(currentBet * multiplier);
        sendToReact({ winnings, round: currentRound });
        betLabel.text = `Результат: ${winnings}₽ · Раунд ${currentRound}`;
      };

      actionButton.on('pointertap', spin);

      app.stage.addChild(status, betLabel, actionButton);

      return () => {
        unsubscribe();
        app.ticker.remove(pulse);
        actionButton.off('pointertap', spin);
        app.stage.removeChild(status, betLabel, actionButton);
        status.destroy();
        betLabel.destroy();
        buttonLabel.destroy();
        actionButton.destroy();
      };
    },
    []
  );

  const { containerRef, sendToPixi, ready } = usePixiBridge<ReactToPixi, PixiToReact>({
    background: '#0b1221',
    initialData: { bet, player: user, room, round },
    onMessage: setLastResult,
    createScene,
  });

  useEffect(() => {
    sendToPixi({ bet, player: user, room, round });
  }, [bet, room, round, sendToPixi, user]);

  return (
    <section className="card game">
      <header className="card-header">
        <p className="eyebrow">Pixi сцена</p>
        <h2>{room}</h2>
        <p className={styles.helper}>
          Данные из React уходят в Pixi через sendToPixi, ответы приходят sendToReact (onMessage в
          хуке).
        </p>
      </header>

      <div className={styles.gameLayout}>
        <div className={styles.controls}>
          <label className={styles.field}>
            <span>Текущая ставка</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              step={1}
              value={bet}
              onChange={(e) => setBet(parseInt(e.target.value, 10) || 1)}
            />
          </label>

          <label className={styles.field}>
            <span>Раунд</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              step={1}
              value={round}
              onChange={(e) => setRound(parseInt(e.target.value, 10) || 1)}
            />
          </label>

          <button
            className={styles.ghost}
            onClick={() => sendToPixi({ bet, player: user, room, round })}
          >
            Отправить данные в Pixi
          </button>

          <div className={styles.pill}>
            <span>Связь</span>
            <strong>{ready ? 'готово' : 'инициализация'}</strong>
          </div>

          {lastResult && (
            <div className={`${styles.pill} ${styles.pillSuccess}`}>
              <span>Ответ от сцены</span>
              <strong>
                +{lastResult.winnings}₽ · Раунд {lastResult.round}
              </strong>
            </div>
          )}
        </div>

        <div className={styles.canvas} ref={containerRef}>
          {!ready && <p className={styles.helper}>Создаём Pixi приложение…</p>}
        </div>
      </div>
    </section>
  );
}

export default GamePage;
