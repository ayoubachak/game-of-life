import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Download, Upload, Settings, Zap, Grid3X3 } from 'lucide-react';


const GameOfLife = () => {
    const [gridSize, setGridSize] = useState({ width: 80, height: 50 });
    const [cellSize, setCellSize] = useState(8);
    const [grid, setGrid] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(100);
    const [generation, setGeneration] = useState(0);
    const [population, setPopulation] = useState(0);
    const [showGrid, setShowGrid] = useState(true);
    const [trailEffect, setTrailEffect] = useState(false);
    const [colorMode, setColorMode] = useState('classic');
    const [rules, setRules] = useState({ birth: [3], survival: [2, 3] });
    const [showSettings, setShowSettings] = useState(false);
    const [brushSize, setBrushSize] = useState(1);
    const [selectedPattern, setSelectedPattern] = useState('');
    
    const runningRef = useRef(isRunning);
    const intervalRef = useRef();
    const canvasRef = useRef();
    const trailGridRef = useRef([]);
  
    // Predefined patterns
    const patterns = {
      glider: [[0,1,0],[0,0,1],[1,1,1]],
      beacon: [[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]],
      pulsar: [
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,0,0,0,1,1,1,0,0]
      ],
      gosperGun: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ]
    };
  
    // Initialize grid
    const createEmptyGrid = useCallback(() => {
      const newGrid = Array(gridSize.height).fill().map(() => Array(gridSize.width).fill(0));
      if (trailEffect) {
        trailGridRef.current = Array(gridSize.height).fill().map(() => Array(gridSize.width).fill(0));
      }
      return newGrid;
    }, [gridSize, trailEffect]);
  
    // Initialize grid on mount
    useEffect(() => {
      setGrid(createEmptyGrid());
    }, [createEmptyGrid]);
  
    // Count neighbors
    const countNeighbors = useCallback((grid, x, y) => {
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const newX = x + i;
          const newY = y + j;
          if (newX >= 0 && newX < gridSize.height && newY >= 0 && newY < gridSize.width) {
            count += grid[newX][newY];
          }
        }
      }
      return count;
    }, [gridSize]);
  
    // Game logic step
    const runSimulation = useCallback(() => {
      setGrid(currentGrid => {
        const newGrid = currentGrid.map(arr => [...arr]);
        let newPop = 0;
        
        for (let i = 0; i < gridSize.height; i++) {
          for (let j = 0; j < gridSize.width; j++) {
            const neighbors = countNeighbors(currentGrid, i, j);
            const isAlive = currentGrid[i][j];
            
            if (isAlive) {
              newGrid[i][j] = rules.survival.includes(neighbors) ? 1 : 0;
            } else {
              newGrid[i][j] = rules.birth.includes(neighbors) ? 1 : 0;
            }
            
            if (newGrid[i][j]) newPop++;
            
            // Update trail
            if (trailEffect && trailGridRef.current[i] && trailGridRef.current[i][j] !== undefined) {
              if (newGrid[i][j]) {
                trailGridRef.current[i][j] = Math.min(255, trailGridRef.current[i][j] + 50);
              } else {
                trailGridRef.current[i][j] = Math.max(0, trailGridRef.current[i][j] - 10);
              }
            }
          }
        }
        
        setPopulation(newPop);
        setGeneration(g => g + 1);
        return newGrid;
      });
    }, [gridSize, countNeighbors, rules, trailEffect]);
  
    // Animation loop
    useEffect(() => {
      runningRef.current = isRunning;
      if (isRunning) {
        intervalRef.current = setInterval(runSimulation, speed);
      } else {
        clearInterval(intervalRef.current);
      }
      return () => clearInterval(intervalRef.current);
    }, [isRunning, speed, runSimulation]);
  
    // Canvas drawing
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      canvas.width = gridSize.width * cellSize;
      canvas.height = gridSize.height * cellSize;
      
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw cells
      for (let i = 0; i < gridSize.height; i++) {
        for (let j = 0; j < gridSize.width; j++) {
          const x = j * cellSize;
          const y = i * cellSize;
          
          if (grid[i] && grid[i][j]) {
            // Live cell colors based on mode
            switch (colorMode) {
              case 'rainbow':
                const hue = (generation + i + j) % 360;
                ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
                break;
              case 'heat':
                const intensity = trailEffect && trailGridRef.current[i] ? 
                  Math.min(255, trailGridRef.current[i][j]) : 255;
                ctx.fillStyle = `rgb(${intensity}, ${Math.floor(intensity * 0.3)}, 0)`;
                break;
              case 'neon':
                ctx.fillStyle = '#00ff41';
                ctx.shadowColor = '#00ff41';
                ctx.shadowBlur = 3;
                break;
              default:
                ctx.fillStyle = '#ffffff';
            }
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.shadowBlur = 0;
          } else if (trailEffect && trailGridRef.current[i] && trailGridRef.current[i][j] > 0) {
            // Trail effect
            const alpha = trailGridRef.current[i][j] / 255;
            ctx.fillStyle = `rgba(100, 100, 255, ${alpha * 0.3})`;
            ctx.fillRect(x, y, cellSize, cellSize);
          }
          
          // Grid lines
          if (showGrid && cellSize >= 4) {
            ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);
          }
        }
      }
    }, [grid, gridSize, cellSize, showGrid, colorMode, generation, trailEffect]);
  
    // Handle canvas click
    const handleCanvasClick = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellSize);
      const y = Math.floor((e.clientY - rect.top) / cellSize);
      
      setGrid(currentGrid => {
        const newGrid = [...currentGrid];
        for (let i = -Math.floor(brushSize/2); i <= Math.floor(brushSize/2); i++) {
          for (let j = -Math.floor(brushSize/2); j <= Math.floor(brushSize/2); j++) {
            const newY = y + i;
            const newX = x + j;
            if (newY >= 0 && newY < gridSize.height && newX >= 0 && newX < gridSize.width) {
              newGrid[newY] = [...newGrid[newY]];
              newGrid[newY][newX] = newGrid[newY][newX] ? 0 : 1;
            }
          }
        }
        return newGrid;
      });
    };
  
    // Place pattern
    const placePattern = (patternName, x, y) => {
      const pattern = patterns[patternName];
      if (!pattern) return;
      
      setGrid(currentGrid => {
        const newGrid = currentGrid.map(row => [...row]);
        for (let i = 0; i < pattern.length; i++) {
          for (let j = 0; j < pattern[i].length; j++) {
            const newY = y + i;
            const newX = x + j;
            if (newY >= 0 && newY < gridSize.height && newX >= 0 && newX < gridSize.width) {
              newGrid[newY][newX] = pattern[i][j];
            }
          }
        }
        return newGrid;
      });
    };
  
    // Random fill
    const randomFill = (density = 0.3) => {
      setGrid(currentGrid => {
        return currentGrid.map(row => 
          row.map(() => Math.random() < density ? 1 : 0)
        );
      });
      setGeneration(0);
    };
  
    // Clear grid
    const clear = () => {
      setGrid(createEmptyGrid());
      setGeneration(0);
      setPopulation(0);
      if (trailEffect) {
        trailGridRef.current = Array(gridSize.height).fill().map(() => Array(gridSize.width).fill(0));
      }
    };
  
    // Export/Import
    const exportGrid = () => {
      const data = {
        grid,
        generation,
        rules,
        gridSize,
        timestamp: Date.now()
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-of-life-${Date.now()}.json`;
      a.click();
    };
  
    const importGrid = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setGrid(data.grid);
          setGeneration(data.generation || 0);
          if (data.rules) setRules(data.rules);
          if (data.gridSize) setGridSize(data.gridSize);
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    };
  
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Conway's Game of Life
            </h1>
            <div className="flex justify-center items-center gap-6 text-sm text-gray-300">
              <span>Generation: <span className="text-blue-400 font-mono">{generation}</span></span>
              <span>Population: <span className="text-green-400 font-mono">{population}</span></span>
              <span>Speed: <span className="text-yellow-400 font-mono">{speed}ms</span></span>
            </div>
          </div>
  
          {/* Controls */}
          <div className="mb-6 flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={clear}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-all"
            >
              <Square size={20} />
              Clear
            </button>
            
            <button
              onClick={() => randomFill()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all"
            >
              <Zap size={20} />
              Random
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
            >
              <Settings size={20} />
              Settings
            </button>
          </div>
  
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Speed Control */}
                <div>
                  <label className="block text-sm font-medium mb-2">Speed (ms)</label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{speed}ms per generation</div>
                </div>
  
                {/* Cell Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Cell Size</label>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={cellSize}
                    onChange={(e) => setCellSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{cellSize}px cells</div>
                </div>
  
                {/* Grid Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Grid Size</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={gridSize.width}
                      onChange={(e) => setGridSize(prev => ({...prev, width: Number(e.target.value)}))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      placeholder="Width"
                    />
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={gridSize.height}
                      onChange={(e) => setGridSize(prev => ({...prev, height: Number(e.target.value)}))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      placeholder="Height"
                    />
                  </div>
                </div>
  
                {/* Color Mode */}
                <div>
                  <label className="block text-sm font-medium mb-2">Color Mode</label>
                  <select
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  >
                    <option value="classic">Classic</option>
                    <option value="neon">Neon</option>
                    <option value="rainbow">Rainbow</option>
                    <option value="heat">Heat Map</option>
                  </select>
                </div>
  
                {/* Brush Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Brush Size</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{brushSize}x{brushSize} cells</div>
                </div>
  
                {/* Patterns */}
                <div>
                  <label className="block text-sm font-medium mb-2">Insert Pattern</label>
                  <select
                    value={selectedPattern}
                    onChange={(e) => {
                      setSelectedPattern(e.target.value);
                      if (e.target.value) {
                        placePattern(e.target.value, Math.floor(gridSize.width/2), Math.floor(gridSize.height/2));
                      }
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Select pattern...</option>
                    <option value="glider">Glider</option>
                    <option value="beacon">Beacon</option>
                    <option value="pulsar">Pulsar</option>
                    <option value="gosperGun">Gosper Gun</option>
                  </select>
                </div>
              </div>
  
              {/* Toggles */}
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded"
                  />
                  <Grid3X3 size={16} />
                  Show Grid
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trailEffect}
                    onChange={(e) => setTrailEffect(e.target.checked)}
                    className="rounded"
                  />
                  Trail Effect
                </label>
              </div>
  
              {/* Rules */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Birth Rules (neighbors needed)</label>
                  <input
                    type="text"
                    value={rules.birth.join(',')}
                    onChange={(e) => setRules(prev => ({
                      ...prev, 
                      birth: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    placeholder="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Survival Rules (neighbors needed)</label>
                  <input
                    type="text"
                    value={rules.survival.join(',')}
                    onChange={(e) => setRules(prev => ({
                      ...prev, 
                      survival: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    placeholder="2,3"
                  />
                </div>
              </div>
  
              {/* Export/Import */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={exportGrid}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-all"
                >
                  <Download size={16} />
                  Export
                </button>
                
                <label className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm cursor-pointer transition-all">
                  <Upload size={16} />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={importGrid}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
  
          {/* Game Canvas */}
          <div className="flex justify-center">
            <div className="border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="block cursor-crosshair"
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  imageRendering: 'pixelated'
                }}
              />
            </div>
          </div>
  
          {/* Instructions */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Click on cells to toggle them • Use settings to customize rules and visuals • Try different patterns!</p>
            <p className="mt-1">Classic rules: Birth on 3 neighbors, Survival on 2-3 neighbors</p>
          </div>
        </div>
      </div>
    );
  };
  
  
export default GameOfLife;  