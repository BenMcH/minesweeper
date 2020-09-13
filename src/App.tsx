import React, { useEffect, useState } from 'react';
import produce from 'immer';
import './App.css';

const size    = 75;

type Cell = {
  bomb: boolean
  shown: boolean
  flagged: boolean
}

type Board = {
  cells: Cell[]
  numRows: number
  numCols: number
};

const shuffle = <T,>(array: T[]): T[] => {
  return array.sort(() => Math.random() - 0.5);
}

const countNeighbors = (board: Board, pos: number, directions: number[]): number => {
  const row = pos / board.numCols;
  const col = pos / board.numRows;
  
  return  directions
            .map((direction) => {
              const newPos = pos + direction;
              const directionCol = newPos / board.numRows;

              if (Math.abs(directionCol - col) > 1) return;
              
              return getCell(board, newPos);
            })
            .filter((a) => a && a.bomb)
            .length;
};

const createRandomBoard = (rows: number, cols: number, numBombs: number): Board => {
  let a = Array.from({length: rows * cols}).map((_, index) => ({
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

const floodFill = (board: Board, pos: number, numCols: number, directions: number[]) => {
  const cell = getCell(board, pos);
  const neighbors = countNeighbors(board, pos, directions);
  if (!cell || cell.shown || cell.bomb) return;
  cell.shown = true;


  if (neighbors === 0) {
    floodFill(board, pos - numCols, numCols, directions)
    floodFill(board, pos + numCols, numCols, directions)
    if (pos % numCols !== numCols - 1){
      floodFill(board, pos + 1, numCols, directions)
    }
    if (pos % numCols !== 0) {
      floodFill(board, pos - 1, numCols, directions)
    }
  }
}

function App() {
  const [numRows, setNumRows] = useState(10);
  const [numCols, setNumCols] = useState(10);
  const [numBombs, setNumBombs] = useState(10);
  const [board, setBoard] = useState(() => createRandomBoard(numRows, numCols, numBombs));
  const [lose, setLose] = useState(false);

  const directions = [
  numCols,
  numCols + 1,
  numCols - 1,
  -numCols,
  -numCols + 1,
  -numCols - 1,
  1,
  -1
]

  const showCell = (i: number) => produce<Board>(board, (boardCopy) => {
    if (boardCopy.cells[i].bomb) {
      boardCopy.cells.forEach((cell) => {
        if (cell.bomb) {
          cell.shown = true;
        }
      });
      setLose(true);
    } else {
      floodFill(boardCopy, i, numCols, directions);
    }

    return boardCopy;
  });

  const flag = (event: {preventDefault: () => void}, i: number) => produce<Board>(board, (boardCopy) => {
    event.preventDefault();
    const cell = getCell(boardCopy, i);
    if (!cell) return;
    cell.flagged = !cell.flagged;
    return boardCopy;
  });

  const onlyBombs = board.cells.every(cell => cell.shown || cell.bomb);

  const [win, setWin] = useState(false);
  useEffect(() => {
    setWin(onlyBombs)
  }, [onlyBombs]);


  const neighbors = board.cells.map((_, i) => countNeighbors(board, i, directions));

  const buttonMessage = (cell: Cell, i: number) => {
    if (cell.shown) {
      if (cell.bomb) {
        return 'BOOM';
      }

      return neighbors[i] > 0 ? `${neighbors[i]}` : '';
    } else {
      if (cell.flagged) {
        return 'Flag'
      }

      return '';
    }
  };

  const reset = () => {
    setWin(false);
    setLose(false);
    setBoard(createRandomBoard(numRows, numCols, numBombs))
  }

  return (
    <div className="page">
      <h1>minesweeper</h1>
      <h2>
        {win ? "You win!" : lose ? "You lose :(" : null}
      </h2>
      <div className="minesweeper-board" style={{gridTemplateColumns: `repeat(${board.numCols}, ${size}px)`}}>
        {board.cells.map((cell, i) => 
          <button disabled={cell.shown} onClick={() => setBoard(showCell(i))} style={{height: `${size}px`}} onContextMenu={(event) => setBoard(flag(event, i))}>
            {buttonMessage(cell, i)}
          </button>
        )}
      </div>
      
      <small>Press reset to apply changes</small>
      <label>Rows <input id="rows" type='number' onChange={(event) => setNumRows(Number(event.target.value))} value={numRows} /></label>
      <label>Cols <input id="cols" type='number' onChange={(event) => setNumCols(Number(event.target.value))} value={numCols} /></label>
      <label>Bombs <input id="bombs" type='number' onChange={(event) => setNumBombs(Number(event.target.value))} value={numBombs} /></label>
      <button className="reset" onClick={reset}>Reset</button>
    </div>
  );
}

export default App;
