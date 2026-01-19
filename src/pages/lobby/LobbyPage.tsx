// src/pages/lobby/LobbyPage.tsx
import styles from './lobby.module.css';
import { useCallback } from 'react';
import { usePixiBridge } from '../../pixi/usePixiBridge';
import type { PixiBridgeOptions } from '../../pixi/usePixiBridge';
import { createBackground } from './background';
import { createTopBarSprite } from './topBar';
import { Jeckpots } from './Jackpots';
import type { Ticker } from 'pixi.js';
import { createLogoSpriteSystem } from './LogoAnimateSprite';
import { createGamesCarouselSystem } from './GamesCarousel';
function LobbyPage() {
  const createScene = useCallback<
    PixiBridgeOptions<unknown, unknown>['createScene']
  >(async ({ app }) => {
    const bgSystem = createBackground({
      moveSpeed: 0.0006,
      offsetXRatio: 0.15,
      offsetYRatio: 0.2,
      minScale: 1,
      maxScale: 1.65,
    });
    const topBar = createTopBarSprite({
      yOffsetPx: 75,
    });

    const logoYRatio = 0.22;
    const logo = createLogoSpriteSystem({
      xRatio: 0.47,
      yRatio: logoYRatio,
      scale: 0.9,
      sprite: { fps: 12 },
    });

    const games = createGamesCarouselSystem({
      yOffsetPx: (nextApp) => nextApp.screen.height * logoYRatio + 120,
      heightPx: 420,
      onPrev: () => console.log('prev'),
      onNext: () => console.log('next'),
      cols: 4,
      rows: 3,
      gapX: 58,
      gapY: 58,
      sideInsetPx: 54,
    });

    await bgSystem.init(app);
    await topBar.init(app);
    await logo.init(app);
    await games.init(app);
    const handleResize = () => {
      bgSystem.resize();
      topBar.resize();
      logo.resize();
      games.resize();
    };
    window.addEventListener('resize', handleResize);

    const handleTick = (ticker: Ticker) => {
      const delta = typeof ticker === 'number' ? ticker : ticker?.delta ?? 1;
      bgSystem.update(delta);
    };
    app.ticker.add(handleTick);

    return () => {
      window.removeEventListener('resize', handleResize);
      app.ticker.remove(handleTick);
      bgSystem.destroy();
      topBar.destroy();
      logo.destroy();
      games.destroy();
    };
  }, []);

  const { containerRef } = usePixiBridge({
    background: '#000',
    createScene,
  });

  return (
    <section className={styles.wrapper}>
      <Jeckpots />

      <div ref={containerRef} className={styles.lobbyContainer} />
    </section>
  );
}

export default LobbyPage;
