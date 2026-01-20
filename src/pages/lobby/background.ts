// src/pages/lobby/background.ts
import { Assets, Sprite, type Application, type Texture } from 'pixi.js';

const backgroundImage = '/raw-assets/backbroundVegas.jpg';

export type BackgroundSystem = {
  init(app: Application): Promise<void>;
  resize(): void;
  update(delta: number): void;
  destroy(): void;
};

type Config = {
  moveSpeed?: number; // скорость обхода ромба
  offsetXRatio?: number; // амплитуда по X (доля ширины экрана)
  offsetYRatio?: number; // амплитуда по Y (доля высоты экрана)
  minScale?: number; // 1
  maxScale?: number; // 1.65
};

export function createBackground(config: Config = {}): BackgroundSystem {
  let app: Application | null = null;
  let bg: Sprite | null = null;

  // состояние анимации
  let pathT = 0;

  const moveSpeed = config.moveSpeed ?? 0.0006;
  const offsetXRatio = config.offsetXRatio ?? 0.15;
  const offsetYRatio = config.offsetYRatio ?? 0.2;
  const minScale = config.minScale ?? 1;
  const maxScale = config.maxScale ?? 1.65;

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  const getBaseScale = () => {
    if (!app || !bg) return 1;
    return Math.max(
      app.screen.width / bg.texture.width,
      app.screen.height / bg.texture.height
    );
  };

  const fitBase = () => {
    if (!app || !bg) return;
    const base = getBaseScale();
    bg.scale.set(base);
    bg.position.set(app.screen.width / 2, app.screen.height / 2);
  };

  const stepPath = (delta: number) => {
    if (!app) {
      return { offsetX: 0, offsetY: 0, seg: 0, localT: 0 };
    }

    pathT += moveSpeed * delta;
    if (pathT >= 4) pathT -= 4;

    const seg = Math.floor(pathT); // 0..3
    const localT = pathT - seg; // 0..1

    const maxOffsetX = app.screen.width * offsetXRatio;
    const maxOffsetY = app.screen.height * offsetYRatio;

    const vertices = [
      { x: maxOffsetX, y: 0 },
      { x: 0, y: maxOffsetY },
      { x: -maxOffsetX, y: 0 },
      { x: 0, y: -maxOffsetY },
    ];

    const a = vertices[seg];
    const b = vertices[(seg + 1) % 4];

    return {
      offsetX: lerp(a.x, b.x, localT),
      offsetY: lerp(a.y, b.y, localT),
      seg,
      localT,
    };
  };

  const applyTransform = (delta: number) => {
    if (!app || !bg) return;

    const baseScale = getBaseScale();

    const { offsetX, offsetY, seg, localT } = stepPath(delta);

    // A->B (seg0): 1 -> 1.65
    // B->C (seg1): 1.65 -> 1
    // C->D (seg2): 1 -> 1.65
    // D->A (seg3): 1.65 -> 1
    const t = smoothstep(localT);
    const startScale = seg % 2 === 0 ? minScale : maxScale;
    const endScale = seg % 2 === 0 ? maxScale : minScale;
    const segScale = lerp(startScale, endScale, t);

    bg.scale.set(baseScale * segScale);
    bg.position.set(
      app.screen.width / 2 + offsetX,
      app.screen.height / 2 + offsetY
    );
  };

  return {
    async init(nextApp: Application) {
      app = nextApp;

      const texture: Texture = await Assets.load(backgroundImage);
      bg = new Sprite(texture);
      bg.anchor.set(0.5);

      fitBase();
      app.stage.addChildAt(bg, 0);
    },

    resize() {
      // при ресайзе мы просто подгоняем под экран (base)
      // дальше update всё равно выставит актуальные scale/position с анимацией
      fitBase();
    },

    update(delta: number) {
      applyTransform(delta);
    },

    destroy() {
      if (bg) {
        bg.destroy({ children: true, texture: false });
        bg = null;
      }
      app = null;
    },
  };
}
