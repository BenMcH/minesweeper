//@ts-ignore 
import React, { useEffect, useState } from 'react';
import produce from 'immer';
import { motion } from 'framer-motion';
import './App.css';
import { ReactComponent as FlagIcon } from './assets/icons/flag.svg';
import { ReactComponent as MineIcon } from './assets/icons/mine.svg';

const getSize = (numCols: number, numRows: number): string => `clamp(20px, calc(95vw / ${numCols}), calc(80vh / ${numRows}))`;

interface Cell {
  bomb: boolean
  shown: boolean
  flagged: boolean
}

interface Board {
  cells: Cell[]
  numRows: number
  numCols: number
};

enum AppState {
  PLAYING,
  WIN,
  LOSE
}

const directions = [[0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1], [1, 1], [1, 0], [1, -1]];

const shuffle = <T,>(array: T[]): T[] => {
  return array.sort(() => Math.random() - 0.5);
}

const countNeighbors = (board: Board, pos: number): number => {
  const col = pos % board.numCols;
  const row = (pos - col) / board.numCols;

  return directions.reduce((acc, [rowX, colX]) => {
    const newRow = row + rowX;
    const newCol = col + colX;
    if (newRow < 0 || newRow >= board.numRows || newCol < 0 || newCol >= board.numCols) return acc;

    const cell = board.cells[pos + board.numCols * rowX + colX];

    return acc + (cell.bomb ? 1 : 0);
  }, 0);
};

const createRandomBoard = (rows: number, cols: number, numBombs: number): Board => {
  let a = Array.from({ length: rows * cols }).map((_, index) => ({
    bomb: index < numBombs,
    shown: false,
    flagged: false
  }));
  for (let x = 0; x < rows * cols; x++) {
    a = shuffle(a);
  }

  return {
    cells: a,
    numCols: cols,
    numRows: rows
  };
};

const getCell = (board: Board, pos: number): Cell | null => {
  if (pos < 0 || pos > board.numCols * board.numRows) return null;

  return board.cells[pos];
}

const floodFill = (board: Board, pos: number, numCols: number) => {
  const cell = getCell(board, pos);
  const neighbors = countNeighbors(board, pos);
  if (!cell || cell.shown || cell.bomb) return;
  cell.shown = true;


  if (neighbors === 0) {
    floodFill(board, pos - numCols, numCols)
    floodFill(board, pos + numCols, numCols)
    if (pos % numCols !== numCols - 1) {
      floodFill(board, pos + 1, numCols)
    }
    if (pos % numCols !== 0) {
      floodFill(board, pos - 1, numCols)
    }
  }
}
function App() {
  const [numRows, setNumRows] = useState(10);
  const [numCols, setNumCols] = useState(10);
  const [numBombs, setNumBombs] = useState(10);
  const [board, setBoard] = useState(() => createRandomBoard(numRows, numCols, numBombs));
  const [appState, setAppState] = useState(AppState.PLAYING);


  const showCell = (i: number) => produce<Board>(board, (boardCopy) => {
    if (boardCopy.cells[i].bomb) {
      boardCopy.cells.forEach((cell) => {
        if (cell.bomb) {
          cell.shown = true;
        }
      });
      setAppState(AppState.LOSE);
    } else {
      floodFill(boardCopy, i, numCols);
    }

    return boardCopy;
  });

  const flag = (event: { preventDefault: () => void }, i: number) => produce<Board>(board, (boardCopy) => {
    event.preventDefault();
    const cell = getCell(boardCopy, i);
    if (!cell || appState !== AppState.PLAYING) return;
    cell.flagged = !cell.flagged;
    return boardCopy;
  });
  //@ts-ignore
  const onlyBombs = board.cells.every(cell => cell.shown || cell.bomb);

  useEffect(() => {
    if (onlyBombs && appState === AppState.PLAYING) {
      setAppState(AppState.WIN);
    }
  }, [onlyBombs, appState]);

  //@ts-ignore
  const neighbors = board.cells.map((_, i) => countNeighbors(board, i));

  const buttonMessage = (cell: Cell, i: number) => {
    if (cell.shown) {
      if (cell.bomb) {
        return <MineIcon fill="black" width={30} />;
      }

      return neighbors[i] > 0 ? `${neighbors[i]}` : '';
    } else {
      if (cell.flagged) {
        return (<FlagIcon width={30} />);
      }

      return '';
    }
  };

  const reset = (): void => {
    setAppState(AppState.PLAYING);
    setBoard(createRandomBoard(numRows, numCols, numBombs))
  }

  const playCell = (i: number) => {
    if (appState !== AppState.PLAYING) {
      return;
    }

    setBoard(showCell(i));
  }

  const size = getSize(board.numCols, board.numRows);


  return (
    //@ts-ignore
    <div className="page">
      <motion.h1
        initial={{ scale: 0.8, rotate: 20 }}
        animate={{ scale: 1.2, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 50 }}>minesweeper</motion.h1>
      <motion.div layout>
        <motion.h2 animate={{ y: "-50%" }}>
          {appState === AppState.WIN ? "You win!" : appState === AppState.LOSE ? "You lose :(" : null}
        </motion.h2>
        <motion.div layout className="minesweeper-board" style={{ gridTemplateColumns: `repeat(${board.numCols}, ${size})` }}>
          {board.cells.map((cell, i) =>
              <>
                <motion.button 
                  whileHover={(!cell.shown || !cell.flagged) ? { scale: 1.2, boxShadow: "5px 5px 0px rgba(0, 0, 0, 0.3  )" }:{}}
                  disabled={cell.shown} onClick={() => playCell(i)} style={{ height: `${size}` }} onContextMenu={(event) => setBoard(flag(event, i))}>
                  {buttonMessage(cell, i)}
                </motion.button>
              </>
            )}
        </motion.div>
      </motion.div>
      <small>Press reset to apply changes</small>
      <label>Rows <input id="rows" type='number' onChange={(event) => setNumRows(Number(event.target.value))} value={numRows} /></label>
      <label>Cols <input id="cols" type='number' onChange={(event) => setNumCols(Number(event.target.value))} value={numCols} /></label>
      <label>Bombs <input id="bombs" type='number' onChange={(event) => setNumBombs(Number(event.target.value))} value={numBombs} /></label>
      <button className="reset" onClick={reset}>Reset</button>
    </div>
  );
}

export default App;
