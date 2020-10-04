const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min) + min);
};

const getTail = <T>(arr: T[]): T => {
  return arr[arr.length - 1];
};

type GameEntity = " " | "a" | "s";
type GameData = [GameEntity[]];
type GameCoord = [number, number];
type GamePath = "left" | "right" | "up" | "down";
type GameDifficult = "easy" | "medium" | "hard";
interface GameAdapter {
  control: (event: KeyboardEvent) => GamePath;
  render: (data: GameData, counter: number) => void;
}

class GameSnake {
  difficult: GameDifficult;

  width: number;
  height: number;

  data: GameData;
  counter: number = 0;

  pathByKeyboard: GamePath | null = null;

  intervalID: number;
  keyboardHandler: (event: KeyboardEvent) => void;

  adapter: GameAdapter;

  constructor(
    width: number = 30,
    height: number = 30,
    difficult: GameDifficult = "hard"
  ) {
    this.width = width;
    this.height = height;
    this.difficult = difficult;
  }

  setCellByCoords = (coords: GameCoord[], value: GameEntity) => {
    coords.forEach((coord) => {
      this.setCell(coord[0], coord[1], value);
    });
  };

  setCell = (x: number, y: number, value: GameEntity) => {
    this.data[y][x] = value;
  };

  getCell = (x: number, y: number) => {
    return this.data[y][x];
  };

  getDifficult = (): number => {
    const variants: Record<GameDifficult, number> = {
      easy: 5,
      medium: 10,
      hard: 15,
    };

    return 1000 / variants[this.difficult];
  };

  createApple = (): GameCoord => {
    const appleY = getRandomNumber(0, this.width);
    const appleX = getRandomNumber(0, this.height);
    this.setCell(appleX, appleY, "a");
    return [appleX, appleY];
  };

  run = (adapter: GameAdapter) => {
    const {
      width,
      height,
      getCell,
      createApple,
      setCellByCoords,
      setCell,
    } = this;

    // Init game data
    const data = [];
    for (let i = 0; i < width; i += 1) {
      data.push(new Array(height).fill(" ") as GameEntity[]);
    }
    this.data = data as GameData;
    this.adapter = adapter;

    // Set first apple
    let appleCoord = createApple();

    // Create snake
    const snake = new Snake();
    this.setCellByCoords(snake.coords, "s");

    // Set keyboard handler
    this.keyboardHandler = (event: KeyboardEvent) => {
      this.pathByKeyboard = adapter.control(event);
    };
    window.addEventListener("keydown", this.keyboardHandler);

    // Run game loop
    this.intervalID = setInterval(() => {
      // Apple check if it was eated create new one
      if (getCell(appleCoord[0], appleCoord[1]) === "s") {
        appleCoord = createApple();
        snake.increaseLength();
        this.counter += 1;
      }

      // Check bite
      if (snake.checkBite()) {
        this.stop();
        return;
      }

      // Automove in the same path
      const segmentToDelete = snake.move(this.pathByKeyboard || snake.path);
      this.pathByKeyboard = null;
      if (segmentToDelete) {
        const [dsegX, dsegY] = segmentToDelete;
        setCell(dsegX, dsegY, " ");
      }

      // Check borderlands
      const [headX, headY] = getTail(snake.coords);
      if (headX >= width || headY >= height || headX < 0 || headY < 0) {
        this.stop();
        return;
      }

      //Update game data for snake
      setCellByCoords(snake.coords, "s");

      adapter.render(this.data, this.counter);
    }, this.getDifficult());
  };

  reset() {
    this.stop();
    this.counter = 0;
    this.data = [[]];
    this.run(this.adapter);
  }

  stop = () => {
    clearInterval(this.intervalID);
    window.removeEventListener("keydown", this.keyboardHandler);
  };
}

class Snake {
  coords: GameCoord[] = [[0, 0]];

  path: GamePath = "right";

  length: number = 1;

  checkBite = (): boolean => {
    const { coords } = this;
    const head = this.getHeadCoord();
    for (let i = 0; i < coords.length - 1; i += 1) {
      if (coords[i][0] === head[0] && coords[i][1] === head[1]) {
        return true;
      }
    }
    return false;
  };

  increaseLength = (num: number = 3) => {
    this.length += num;
  };

  getHeadCoord = (): GameCoord => {
    return getTail(this.coords);
  };

  move = (to: GamePath): GameCoord | null => {
    const reverse: Record<GamePath, GamePath> = {
      up: "down",
      left: "right",
      down: "up",
      right: "left",
    };

    // Avoid path in yourself
    if (to === reverse[this.path]) {
      return null;
    }

    this.path = to;

    const { coords, length } = this;

    // Get previous head position
    const [headX, headY] = getTail(coords);
    const variants: Record<GamePath, GameCoord> = {
      down: [headX, headY + 1],
      up: [headX, headY - 1],
      right: [headX + 1, headY],
      left: [headX - 1, headY],
    };

    // Add head
    this.coords.push(variants[to]);

    const segmentToDelete = this.coords[0];

    // Move tail
    if (length < coords.length) {
      this.coords.shift();
    }

    return segmentToDelete;
  };
}

const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
gameCanvas.width = gameCanvas.height = 30 * 30;

const ctx = gameCanvas.getContext("2d");
const counterEl = document.getElementById("counter");
const gameStr = document.getElementById("game-str");

const renderCanvas = (data, counter) => {
  data.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      const colors = {
        " ": "#121212",
        a: "#E91E63",
        s: "#03DAC6",
      };
      ctx.fillStyle = colors[cell];
      ctx.fillRect(cellIndex * 30, rowIndex * 30, 30, 30);
    });
  });
  counterEl.innerText = `Count: ${counter}`;
};

const renderStr = (data, counter) => {
  const str = [
    new Array(32).fill("-").join("") + "\n",
    ...data
      .map((row) => {
        return `|${row.join("")}|`;
      })
      .join("\n"),
    "\n" + new Array(32).fill("-").join(""),
  ].join("");
  console.clear();
  console.log(str);
  gameStr.innerText = str;
  counterEl.innerText = `Counte: ${counter}`;
};

const adapter: GameAdapter = {
  control: (event) => {
    const variants: Record<string, GamePath> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    const newPath = variants[event.code];
    // Change snake path
    if (newPath) {
      return newPath;
    }
  },
  render: renderCanvas,
};

const game = new GameSnake();
game.run(adapter);

window.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    game.reset();
  }
});
