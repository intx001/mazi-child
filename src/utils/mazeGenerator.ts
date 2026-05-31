import { useEffect, useState, useCallback } from 'react';

// Maze generator using Recursive Backtracking
export enum CellType {
  WALL = 0,
  PATH = 1,
}

export type Point = { x: number; y: number };
export type MazeGrid = CellType[][];

export function generateMaze(width: number, height: number): { grid: MazeGrid, start: Point, end: Point } {
  // Ensure dimensions are odd
  const w = width % 2 === 0 ? width + 1 : width;
  const h = height % 2 === 0 ? height + 1 : height;

  const grid: MazeGrid = Array(h).fill(null).map(() => Array(w).fill(CellType.WALL));
  
  const carvePath = (x: number, y: number) => {
    grid[y][x] = CellType.PATH;

    const directions = [
      [0, -2], [0, 2], [-2, 0], [2, 0] // Up, Down, Left, Right
    ];
    
    // Shuffle directions for randomness
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny][nx] === CellType.WALL) {
        grid[y + dy / 2][x + dx / 2] = CellType.PATH; // Carve the wall between
        carvePath(nx, ny);
      }
    }
  };

  // Start carving from top-left-ish
  carvePath(1, 1);

  // Define start and end points
  const start = { x: 1, y: 1 };
  const end = { x: w - 2, y: h - 2 };
  
  // Ensure end is a path (sometimes backtracking might not reach the exact bottom right if dimensions are small or even)
  grid[end.y][end.x] = CellType.PATH;
  
  // Make sure there's a path to the end if blocked (very basic check)
  if (grid[end.y - 1][end.x] === CellType.WALL && grid[end.y][end.x - 1] === CellType.WALL) {
      grid[end.y - 1][end.x] = CellType.PATH;
  }

  return { grid, start, end };
}
