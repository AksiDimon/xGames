import { BitmapText, Container, Graphics, Sprite, type Texture } from 'pixi.js';

type RightNavGroup = {
  group: Container;
  layout(): void;
  destroy(): void;
};

export function createRightNavGroup(args: { navTex: Texture }): RightNavGroup {
  const { navTex } = args;

  const group = new Container();
  const bg = new Sprite(navTex);
  const content = new Container();

  const topNameBox = new Graphics();
  const nameText = new BitmapText({
    text: 'Kobi',
    style: {
      fontFamily: 'Impact-Regular-White',
      fontSize: 34,
      fill: 'orange',
    },
  });
  const levelBox = new Graphics();
  const levelText = new BitmapText({
    text: '3',
    style: {
      fontFamily: 'Impact-Regular-White',
      fontSize: 30,
    },
  });
  const timeText = new BitmapText({
    text: '00:00',
    style: {
      fontFamily: 'Impact-Regular-White',
      fontSize: 44,
      fill: 'orange',
    },
  });
  const findText = new BitmapText({
    text: 'Find...',
    style: {
      fontFamily: 'Impact-Regular-White',
      fontSize: 34,
    },
  });

  bg.anchor.set(0.5, 0.5);
  bg.scale.set(-1, 1);
  content.position.set(-navTex.width / 2, -navTex.height / 2);

  content.addChild(topNameBox);
  content.addChild(nameText);
  content.addChild(levelBox);
  content.addChild(levelText);
  content.addChild(timeText);
  content.addChild(findText);

  group.addChild(bg);
  group.addChild(content);

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
      2,
      '0'
    )}`;
  const updateClock = () => {
    timeText.text = formatTime(new Date());
  };
  updateClock();
  const clockId = window.setInterval(updateClock, 1000);

  const layout = () => {
    const P = 16;
    const GAP = 12;
    const rectW = 300;
    const rectH = 46;
    const rectR = 10;
    const topRowY = P;
    const bottomRowY = navTex.height - P - timeText.height;

    topNameBox.clear();
    topNameBox.roundRect(P, topRowY, rectW, rectH, rectR);
    topNameBox.fill({ color: '#3c0b6d' });
    topNameBox.stroke({
      width: 2,
      color: 0xffd700, // Код цвета Gold
    });

    nameText.position.set(
      P + (rectW - nameText.width) / 2,
      13
      // topRowY + (rectH - nameText.height)
    );

    levelBox.clear();
    const levelX = P + rectW + GAP;
    levelBox.roundRect(levelX, topRowY, rectH, rectH, rectR);
    levelBox.fill({ color: '#3c0b6d' });
    levelBox.stroke({
      width: 2,
      color: 0xffd700,
    });
    levelText.position.set(levelX + (rectH - levelText.width) / 2, 17);

    timeText.position.set(P, bottomRowY);
    findText.scale.set(1.5, 1.3);
    findText.position.set(timeText.x + timeText.width + 100, bottomRowY);
  };

  return {
    group,
    layout,
    destroy() {
      window.clearInterval(clockId);
    },
  };
}
