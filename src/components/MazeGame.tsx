import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Settings, Home, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateMaze, CellType, Point, MazeGrid } from '../utils/mazeGenerator';
import { audio } from '../utils/audio';
import { characters, targets, themeColors, stickers } from '../utils/constants';
import { Difficulty, difficulties } from '../utils/difficulty';

type GameState = 'menu' | 'playing' | 'won';

export default function MazeGame() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [character, setCharacter] = useState(characters[0]);
  const [target, setTarget] = useState(targets[0]);
  const [theme, setTheme] = useState(themeColors[0]);
  const [grid, setGrid] = useState<MazeGrid>([]);
  const [playerPos, setPlayerPos] = useState<Point>({ x: 1, y: 1 });
  const [endPos, setEndPos] = useState<Point>({ x: 1, y: 1 });
  
  // Sticker book
  const [collectedStickers, setCollectedStickers] = useState<string[]>([]);
  const [showStickerBook, setShowStickerBook] = useState(false);

  // References for touch events
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch/Swipe references
  const touchStart = useRef<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    
    // Min swipe distance 30px
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) movePlayer(dx > 0 ? 1 : -1, 0);
    } else {
      if (Math.abs(dy) > 30) movePlayer(0, dy > 0 ? 1 : -1);
    }
    touchStart.current = null;
  };

  const startNewGame = useCallback(() => {
    // Pick a random theme
    const randomTheme = themeColors[Math.floor(Math.random() * themeColors.length)];
    setTheme(randomTheme);
    
    // Pick the character and its matching target if in simple match mode, or random otherwise. 
    // Here we'll just pair them up sequentially for simplicity or random pair.
    const randomCharIdx = Math.floor(Math.random() * characters.length);
    const char = characters[randomCharIdx];
    const matchingTarget = targets.find(t => t.matchedTo === char.id) || targets[0];
    
    setCharacter(char);
    setTarget(matchingTarget);

    const config = difficulties[difficulty];
    const maze = generateMaze(config.size, config.size);
    setGrid(maze.grid);
    setPlayerPos(maze.start);
    setEndPos(maze.end);
    setGameState('playing');
    
    // warm up audio context on user interaction
    audio.init();
  }, [difficulty]);

  const handleWin = useCallback(() => {
    audio.playTada();
    setGameState('won');
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#34D399', '#38BDF8', '#FBBF24', '#FB7185', '#C084FC']
    });

    // Award a random sticker
    const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];
    setCollectedStickers(prev => [...prev, randomSticker]);
  }, []);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    setPlayerPos(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;

      if (
        newY >= 0 && newY < grid.length &&
        newX >= 0 && newX < grid[0].length &&
        grid[newY][newX] === CellType.PATH
      ) {
        audio.playPop();
        
        // Check win
        if (newX === endPos.x && newY === endPos.y) {
          setTimeout(handleWin, 100);
        }
        
        return { x: newX, y: newY };
      } else {
        audio.playBonk();
        return prev;
      }
    });
  }, [gameState, grid, endPos, handleWin]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  // D-Pad and Touch swipe variables can be added here if needed, but simple D-Pad buttons are best for kids

  // Group collected stickers and count duplicates
  const stickerCounts = collectedStickers.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 ${gameState === 'playing' ? theme.main : 'bg-[#FDFBF7]'}`}>
      
      {/* Menu State */}
      <AnimatePresence mode="wait">
        {gameState === 'menu' && !showStickerBook && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white p-8 rounded-[40px] shadow-[0_8px_0_0_#F0F0F0] border-4 border-[#FFE082] max-w-md w-full text-center"
          >
            <h1 className="text-4xl font-black text-[#F06292] mb-6 tracking-tight drop-shadow-sm bubbly-font">
              LITTLE HERO
              <br/>
              <span className="text-[#64B5F6]">MAZE</span>
            </h1>
            
            <div className="flex justify-center space-x-4 mb-8 text-5xl">
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>🦁</motion.span>
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}>🏆</motion.span>
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.4 }}>🚀</motion.span>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-xl bubbly-font text-[#F06292]">Choose Difficulty:</p>
              <div className="flex flex-col gap-3">
                {(Object.entries(difficulties) as [Difficulty, typeof difficulties[Difficulty]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`py-4 rounded-3xl text-2xl font-bold transition-transform transform active:scale-95 bubbly-font border-4 ${
                      difficulty === key 
                        ? `${config.color} text-white ${config.shadow} scale-105 border-white` 
                        : 'bg-gray-100 text-gray-400 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full bg-[#81C784] hover:bg-[#66BB6A] text-white text-3xl font-black py-4 rounded-[40px] shadow-[0_6px_0_0_#66BB6A] active:translate-y-2 active:shadow-[0_0px_0_0_#66BB6A] transition-all flex items-center justify-center gap-3 bubbly-font"
            >
              <Play fill="currentColor" size={32} />
              PLAY NOW!
            </button>
            
            <button
              onClick={() => setShowStickerBook(true)}
              className="mt-6 flex items-center justify-center gap-2 text-xl font-bold text-[#FFCA28] mx-auto hover:text-[#FFB300] transition-colors bubbly-font"
            >
              <Trophy size={28} />
              Sticker Book ({collectedStickers.length})
            </button>
          </motion.div>
        )}

        {/* Sticker Book */}
        {gameState === 'menu' && showStickerBook && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-[#FFF8E1] p-8 rounded-[40px] border-4 border-white shadow-xl max-w-lg w-full text-center"
          >
            <h2 className="text-4xl bubbly-font text-[#8D6E63] mb-6 flex items-center justify-center gap-3">
              <Star fill="currentColor" className="text-[#FFCA28]" />
              MY STICKERS
              <Star fill="currentColor" className="text-[#FFCA28]" />
            </h2>
            
            <div className="bg-transparent mb-8 min-h-[200px]">
              {collectedStickers.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-[#8D6E63] opacity-60 font-bold text-2xl gap-4 bubbly-font">
                  <span className="text-6xl">🐾</span>
                  <p>Play games to win stickers!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 justify-center">
                  {Object.entries(stickerCounts).map(([sticker, count], i) => (
                    <motion.div
                      key={sticker}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.1, type: 'spring' }}
                      className="text-5xl sticker-slot p-4 rounded-2xl shadow-sm flex items-center justify-center relative"
                    >
                      {sticker}
                      {count > 1 && (
                        <div className="absolute -top-3 -right-3 bg-[#F06292] text-white text-lg font-black w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md bubbly-font z-10 p-0 leading-none">
                          <span style={{ marginTop: '-2px' }}>x{count}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowStickerBook(false)}
              className="w-full bg-[#64B5F6] hover:bg-[#42A5F5] text-white text-2xl bubbly-font py-4 rounded-[40px] shadow-[0_6px_0_0_#42A5F5] active:translate-y-2 active:shadow-[0_0px_0_0_#42A5F5] transition-all flex items-center justify-center gap-3"
            >
              <Home size={28} />
              BACK TO MENU
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playing / Won State */}
      {(gameState === 'playing' || gameState === 'won') && (
        <div className="w-full max-w-2xl flex flex-col items-center">
          
          <div className="w-full flex justify-between items-center mb-6 px-6 py-3 bg-white rounded-[40px] shadow-[0_8px_0_0_#F0F0F0] border-4 border-[#FFE082]">
             <button
              onClick={() => setGameState('menu')}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 active:scale-90 transition-transform"
            >
              <Home size={24} />
            </button>
            <div className={`text-2xl bubbly-font ${theme.text} drop-shadow-sm flex items-center gap-2 uppercase tracking-wide`}>
               {character.emoji} Help {character.name}!
            </div>
            <button
              onClick={startNewGame}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 active:scale-90 transition-transform"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          {/* Context header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`text-xl md:text-2xl bubbly-font ${theme.text} mb-6 text-center ${gameState === 'won' ? 'animate-bounce' : ''}`}
          >
            {gameState === 'won' ? (
              <span className="text-[#FFCA28] drop-shadow-sm">You did it! 🎉</span>
            ) : (
              <span className="bg-white/80 px-6 py-2 rounded-full shadow-sm">Take the {character.emoji} to the {target.emoji}!</span>
            )}
          </motion.div>

          {/* The Maze and Controls Container */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10 lg:gap-12 w-full max-w-5xl">
            {/* The Maze */}
            <div 
              ref={containerRef}
              className={`bg-white rounded-[40px] border-[12px] ${theme.border} shadow-xl p-3 sm:p-4 md:p-6 relative transition-all duration-300 flex items-center justify-center shrink-0 w-full max-w-[85vw] md:max-w-[50vw] lg:max-w-[55vh] aspect-square ${gameState === 'won' ? 'scale-105 rotate-1' : ''}`}
              style={{ touchAction: 'none' }} // Prevent swipe to go back on mobile and scrolling
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className={`grid select-none w-full h-full ${difficulty === 'hard' ? 'gap-[2px]' : difficulty === 'medium' ? 'gap-1' : 'gap-1.5'}`}
                style={{ 
                  gridTemplateColumns: `repeat(${grid[0]?.length || 1}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${grid.length || 1}, minmax(0, 1fr))`
                }}
              >
                {grid.map((row, y) => (
                  row.map((cell, x) => (
                    <div 
                      key={`${x}-${y}`} 
                      className={`
                        relative flex items-center justify-center w-full h-full
                        ${cell === CellType.WALL ? 'maze-wall' : 'maze-path'}
                      `}
                    >
                      {/* Render target emoji */}
                      {x === endPos.x && y === endPos.y && (
                        <div className={`absolute inset-0 flex items-center justify-center animate-pulse character-shadow pb-1 z-0 ${difficulty === 'easy' ? 'text-2xl md:text-3xl lg:text-4xl' : difficulty === 'medium' ? 'text-xl md:text-2xl' : 'text-sm md:text-xl'}`}>
                          {target.emoji}
                        </div>
                      )}

                      {/* Render Player Character */}
                      {x === playerPos.x && y === playerPos.y && (
                        <motion.div
                          layoutId="player"
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none drop-shadow-lg"
                        >
                          <motion.div 
                            animate={gameState === 'won' ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
                            transition={{ repeat: gameState === 'won' ? Infinity : 0, duration: 0.5 }}
                            className={`flex items-center justify-center pb-1 ${difficulty === 'easy' ? 'text-3xl md:text-4xl lg:text-5xl' : difficulty === 'medium' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}
                          >
                            {character.emoji}
                          </motion.div>
                        </motion.div>
                      )}
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Right sidebar: Context & Controls */}
            <div className="flex flex-col items-center">
              {/* D-Pad controls for touch devices */}
              {gameState === 'playing' && (
                <div className="mt-2 grid grid-cols-3 gap-3 w-56 touch-manipulation pb-8">
                  <div />
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); movePlayer(0, -1); }}
                    className="bg-[#FFCC80] active:bg-[#FFA726] p-4 rounded-2xl shadow-[0_6px_0_0_#FFA726] active:translate-y-1 active:shadow-[0_0px_0_0_#FFA726] flex items-center justify-center text-white transition-all h-16 w-16 text-3xl"
                  >
                    ⬆️
                  </button>
                  <div />
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); movePlayer(-1, 0); }}
                    className="bg-[#FFCC80] active:bg-[#FFA726] p-4 rounded-2xl shadow-[0_6px_0_0_#FFA726] active:translate-y-1 active:shadow-[0_0px_0_0_#FFA726] flex items-center justify-center text-white transition-all h-16 w-16 text-3xl"
                  >
                    ⬅️
                  </button>
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); movePlayer(0, 1); }}
                    className="bg-[#FFCC80] active:bg-[#FFA726] p-4 rounded-2xl shadow-[0_6px_0_0_#FFA726] active:translate-y-1 active:shadow-[0_0px_0_0_#FFA726] flex items-center justify-center text-white transition-all h-16 w-16 text-3xl"
                  >
                    ⬇️
                  </button>
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); movePlayer(1, 0); }}
                    className="bg-[#FFCC80] active:bg-[#FFA726] p-4 rounded-2xl shadow-[0_6px_0_0_#FFA726] active:translate-y-1 active:shadow-[0_0px_0_0_#FFA726] flex items-center justify-center text-white transition-all h-16 w-16 text-3xl"
                  >
                     ➡️
                  </button>
                </div>
              )}

          {/* Victory actions */}
          {gameState === 'won' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: 'spring' }}
              className="mt-12 flex space-x-4 mb-8"
            >
              <button
                onClick={() => setGameState('menu')}
                className="px-8 py-4 bg-white text-[#F06292] font-black text-2xl rounded-[40px] shadow-[0_6px_0_0_#cbd5e1] active:translate-y-2 active:shadow-[0_0px_0_0_#cbd5e1] transition-all flex items-center gap-2 bubbly-font"
              >
                <Home size={28} /> MENU
              </button>
              <button
                onClick={startNewGame}
                className="px-8 py-4 bg-[#81C784] text-white font-black text-2xl rounded-[40px] shadow-[0_6px_0_0_#66BB6A] active:translate-y-2 active:shadow-[0_0px_0_0_#66BB6A] transition-all flex items-center gap-2 bubbly-font"
              >
                <Play fill="currentColor" size={28} /> NEXT LEVEL
              </button>
            </motion.div>
          )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
