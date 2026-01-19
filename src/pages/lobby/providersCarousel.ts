// src/pages/lobby/providersCarousel.ts
import {
  Assets,
  Container,
  Graphics,
  Sprite,
  type Application,
  type Texture,
} from 'pixi.js';

type ProvidersCarouselConfig = {
  providers: string[]; // пути к картинкам провайдеров
  gapPx?: number; // расстояние между логотипами
  logoHeightRatio?: number; // высота логотипа относительно barHeight (0..1)
  sideInsetPx?: number; // отступ от кнопок до области карусели
  stepRatio?: number; // на сколько “страницы” скроллить (доля ширины viewport)
  ease?: number; // плавность догонки (0..1)
};

export type ProvidersCarouselSystem = {
  init(args: {
    app: Application;
    parent: Container;
    btnLeft: Sprite;
    btnRight: Sprite;
    barHeightPx: number;
  }): Promise<void>;
  layout(args: { barWidthPx: number; barHeightPx: number }): void;
  destroy(): void;
};

export function createProvidersCarousel(
  config: ProvidersCarouselConfig
): ProvidersCarouselSystem {
  let app: Application | null = null;
  let parent: Container | null = null;

  let viewport: Container | null = null; // “окно”, которое стоит между кнопками
  let track: Container | null = null; // лента с логотипами
  let maskGfx: Graphics | null = null; // прямоугольная маска

  let btnLeft: Sprite | null = null;
  let btnRight: Sprite | null = null;

  let sprites: Sprite[] = [];

  let viewportW = 0;
  let viewportH = 0;

  // прокрутка
  let targetX = 0;
  let currentX = 0;

  // handlers, чтобы снять в destroy
  let onLeftTap: (() => void) | null = null;
  let onRightTap: (() => void) | null = null;

  // ticker
  let tickFn: ((t: any) => void) | null = null;

  const gapPx = config.gapPx ?? 12;
  const logoHeightRatio = config.logoHeightRatio ?? 0.6;
  const sideInsetPx = config.sideInsetPx ?? 10;
  const stepRatio = config.stepRatio ?? 0.8;
  const ease = config.ease ?? 0.12;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const computeButtonEdges = () => {
    // ВАЖНО: считаем края через position + width с учетом твоих anchor’ов в topBar:
    // btnLeft.anchor.x = 0  => левый край = x, правый = x + width
    // btnRight.anchor.x = 1 => правый край = x, левый = x - width
    if (!btnLeft || !btnRight) return { leftEdge: 0, rightEdge: 0 };

    const leftBtnRightEdge = btnLeft.position.x + btnLeft.width;
    const rightBtnLeftEdge = btnRight.position.x - btnRight.width;

    return { leftEdge: leftBtnRightEdge, rightEdge: rightBtnLeftEdge };
  };

  const rebuildMask = () => {
    if (!maskGfx) return;
    maskGfx.clear();
    maskGfx.rect(0, 0, viewportW, viewportH);
    maskGfx.fill({ color: 0xffffff, alpha: 1 });
  };

  const relayoutSprites = () => {
    if (!track) return;

    // высота логотипа = часть высоты topbar
    const logoH = viewportH * logoHeightRatio;

    let x = 0;
    for (const s of sprites) {
      s.anchor.set(0, 0.5);

      // масштабируем по высоте (это внутри карусели — кнопки тут ни при чем)
      const k = logoH / s.texture.height;
      s.scale.set(k);

      s.position.set(x, viewportH / 2.3);

      x += s.width + gapPx;
    }
  };

  const clampTarget = () => {
    if (!track) return;
    const maxScroll = Math.max(0, track.width - viewportW);
    targetX = clamp(targetX, -maxScroll, 0);
  };

  const scrollBy = (dx: number) => {
    targetX += dx;
    clampTarget();
  };

  const scrollLeft = () => {
    if (viewportW <= 0) return;
    scrollBy(+viewportW * stepRatio);
  };

  const scrollRight = () => {
    if (viewportW <= 0) return;
    scrollBy(-viewportW * stepRatio);
  };

  const ensureInteractivity = () => {
    if (!btnLeft || !btnRight) return;

    // делаем кнопки кликабельными
    btnLeft.eventMode = 'static';
    btnRight.eventMode = 'static';
    btnLeft.cursor = 'pointer';
    btnRight.cursor = 'pointer';

    // сохраняем ссылки на функции, чтобы снять потом
    onLeftTap = () => scrollLeft();
    onRightTap = () => scrollRight();

    btnLeft.on('pointertap', onLeftTap);
    btnRight.on('pointertap', onRightTap);
  };

  const removeInteractivity = () => {
    if (!btnLeft || !btnRight) return;
    if (onLeftTap) btnLeft.off('pointertap', onLeftTap);
    if (onRightTap) btnRight.off('pointertap', onRightTap);
    onLeftTap = null;
    onRightTap = null;
  };

  const startTicker = () => {
    if (!app || !track) return;
    tickFn = (t: any) => {
      if (!track) return;
      const delta = typeof t === 'number' ? t : t?.delta ?? 1;

      // плавная догонялка: currentX -> targetX
      currentX += (targetX - currentX) * (ease * delta);
      track.x = currentX;
    };
    app.ticker.add(tickFn);
  };

  const stopTicker = () => {
    if (app && tickFn) app.ticker.remove(tickFn);
    tickFn = null;
  };

  return {
    async init({
      app: nextApp,
      parent: nextParent,
      btnLeft: bl,
      btnRight: br,
      barHeightPx,
    }: any) {
      app = nextApp;
      parent = nextParent;
      btnLeft = bl;
      btnRight = br;

      // создаём viewport/track/mask
      viewport = new Container();
      track = new Container();
      maskGfx = new Graphics();

      viewport.addChild(track);
      viewport.addChild(maskGfx);
      viewport.mask = maskGfx;

      // добавляем viewport в parent (root topbar)
      parent.addChildAt(viewport, 1);

      // грузим все текстуры провайдеров
      const textures = (await Promise.all(
        config.providers.map((p) => Assets.load(p) as Promise<Texture>)
      )) as Texture[];

      sprites = textures.map((tex) => new Sprite(tex));
      for (const s of sprites) track.addChild(s);

      // первичная геометрия по высоте
      viewportH = barHeightPx;

      ensureInteractivity();
      startTicker();
    },

    layout({
      barWidthPx,
      barHeightPx,
    }: {
      barWidthPx: number;
      barHeightPx: number;
    }) {
      if (!viewport || !track || !maskGfx || !btnLeft || !btnRight) return;

      viewportH = barHeightPx;

      const { leftEdge, rightEdge } = computeButtonEdges();

      const leftX = leftEdge + sideInsetPx;
      const rightX = rightEdge - sideInsetPx;

      viewportW = Math.max(0, rightX - leftX);

      // viewport стоит внутри root topbar, поэтому y=0
      viewport.position.set(leftX, 0);

      // маска под новый размер
      rebuildMask();

      // раскладываем логотипы
      relayoutSprites();

      // если ширина изменилась — скорректируем clamp и текущую позицию
      clampTarget();
      currentX = clamp(currentX, -Math.max(0, track.width - viewportW), 0);
      track.x = currentX;
    },

    destroy() {
      stopTicker();
      removeInteractivity();

      if (viewport) {
        viewport.destroy({ children: true, texture: false });
      }

      sprites = [];
      viewport = null;
      track = null;
      maskGfx = null;

      btnLeft = null;
      btnRight = null;

      app = null;
      parent = null;
    },
  };
}
