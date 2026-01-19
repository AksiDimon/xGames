// src/pages/lobby/LogoAnimateSprite.ts
import {
  Assets,
  AnimatedSprite,
  Rectangle,
  Texture,
  type Application,
  type Spritesheet,
} from 'pixi.js';

const LogoSheet = '/raw-assets/animation/logo-anim.json';
const LogoImg = '/raw-assets/animation/logo-anim.png';

type CreateLogoOptions = {
  cols?: number; // по умолчанию 4
  rows?: number; // по умолчанию 7
  fps?: number; // кадров/сек
  loop?: boolean;
  anchor?: number; // 0..1
  animationName?: string; // имя анимации в spritesheet
};

export async function createLogoAnimateSprite(options: CreateLogoOptions = {}) {
  const {
    cols = 4,
    rows = 7,
    fps = 12,
    loop = true,
    anchor = 0.5,
    animationName = 'LOGO_ANIMATION',
  } = options;

  let frames: Texture[] = [];
  let sheetW = 0;
  let sheetH = 0;
  let frameW = 0;
  let frameH = 0;

  // Сначала пробуем spritesheet .json
  try {
    const sheet = await Assets.load<Spritesheet>(LogoSheet);
    const animFrames = sheet?.animations?.[animationName];
    if (animFrames && animFrames.length) {
      frames = animFrames;
      frameW = animFrames[0].width;
      frameH = animFrames[0].height;
    }
  } catch (e) {
    console.warn('Logo spritesheet json not loaded, fallback to grid', e);
  }

  // Если нет frames — используем grid-нарезку по png
  if (!frames.length) {
    // В v8 Assets.load обычно вернёт Texture
    const sheetTexture = await Assets.load<Texture>(LogoImg);

    // В v8 у Texture есть source (TextureSource)
    const source = sheetTexture.source;

    // Реальные размеры спрайт-листа
    sheetW = sheetTexture.width;
    sheetH = sheetTexture.height;

    if (!sheetW || !sheetH) {
      throw new Error('Spritesheet has invalid size (width/height are 0).');
    }

    const rawFrameW = sheetW / cols;
    const rawFrameH = sheetH / rows;

    // Проверка что делится ровно
    const fw = Math.round(rawFrameW);
    const fh = Math.round(rawFrameH);
    if (
      Math.abs(rawFrameW - fw) > 0.0001 ||
      Math.abs(rawFrameH - fh) > 0.0001
    ) {
      throw new Error(
        `Spritesheet ${sheetW}x${sheetH} not divisible by grid ${cols}x${rows}. ` +
          `Got frame ${rawFrameW}x${rawFrameH}. Проверь cols/rows.`
      );
    }

    frameW = fw;
    frameH = fh;

    // Нарезаем кадры
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        frames.push(
          new Texture({
            source,
            frame: new Rectangle(x * fw, y * fh, fw, fh),
          })
        );
      }
    }
  }

  const anim = new AnimatedSprite(frames);
  anim.anchor.set(anchor);
  anim.loop = loop;

  // fps -> animationSpeed (в Pixi это "кадров за тик при 60fps")
  anim.animationSpeed = fps / 60;
  anim.play();

  return {
    anim,
    frames,
    sheetW,
    sheetH,
    frameW,
    frameH,
    cols,
    rows,
  };
}

export type LogoSpriteSystem = {
  init(app: Application): Promise<void>;
  resize(): void;
  destroy(): void;
};

type LogoSpriteSystemConfig = {
  xRatio?: number; // 0..1, позиция по ширине экрана
  yRatio?: number; // 0..1, позиция по высоте экрана
  scale?: number; // масштаб спрайта
  sprite?: CreateLogoOptions;
};

export function createLogoSpriteSystem(
  config: LogoSpriteSystemConfig = {}
): LogoSpriteSystem {
  let app: Application | null = null;
  let anim: AnimatedSprite | null = null;

  const xRatio = config.xRatio ?? 0.5;
  const yRatio = config.yRatio ?? 0.2;
  const scale = config.scale ?? 1;

  const baseW = 2560;

  const layout = () => {
    if (!app || !anim) return;
    const wFactor = app.screen.width / baseW;
    anim.position.set(app.screen.width * xRatio, app.screen.height * yRatio);
    // Масштабируем только по X, по Y оставляем базовый scale.
    anim.scale.set(scale * wFactor, scale);
  };

  return {
    async init(nextApp: Application) {
      app = nextApp;
      const { anim: created } = await createLogoAnimateSprite(config.sprite);
      anim = created;
      app.stage.addChild(anim);
      layout();
    },

    resize() {
      layout();
    },

    destroy() {
      if (anim) {
        anim.destroy();
        anim = null;
      }
      app = null;
    },
  };
}
