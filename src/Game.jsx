// src/Game.jsx
import React, { useRef, useEffect } from 'react';
import birdImgSrc from './assets/bird1.png';
import pipeImgSrc from './assets/pipe.png';
import bgImgSrc from './assets/bg.png';

// Import audio files
import flapSoundSrc from './assets/flap.mp3';
import pipeSoundSrc from './assets/pipe.mp3';
import onichiwaSoundSrc from './assets/onichiwa.mp3';
import hitSoundSrc from './assets/hit.mp3'; // Import hit sound

const Game = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Access canvas and context
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Remove scaling factor for consistent behavior across devices
    const scaleFactor = 1;

    // Function to load images
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    };

    // Load audio files
    const flapSound = new Audio(flapSoundSrc);
    const pipeSound = new Audio(pipeSoundSrc);
    const onichiwaSound = new Audio(onichiwaSoundSrc);
    const hitSound = new Audio(hitSoundSrc); // Load hit sound

    // Ensure sounds can be played without user interaction
    flapSound.load();
    pipeSound.load();
    onichiwaSound.load();
    hitSound.load();

    let animationFrameId;
    let pipeInterval;
    let lastTime = performance.now(); // Initialize lastTime for time-based movement

    // Game variables accessible throughout useEffect
    let birdWidth = 100 * scaleFactor;
    let birdHeight = 70 * scaleFactor;

    let birdX = 50 * scaleFactor;
    let birdY = canvas.height / 2;
    let birdVelocity = 0;
    let gravity = 1500; // Gravity in pixels per second squared
    let isGameOver = false;
    let score = 0;

    let jumpVelocity = -200; // Jump velocity in pixels per second

    // Pipe image dimensions
    const totalPipeImageWidth = 360; // Total width of pipe.png image
    const totalPipeImageHeight = 693; // Total height of pipe.png image
    const visiblePipeWidth = 90; // Width of the actual visible pipe
    const visiblePipeHeight = 680; // Height of the actual visible pipe

    // Transparent space on sides
    const transparentLeft = 135; // Transparent space on the left
    const transparentRight = 135; // Transparent space on the right

    // Scaling factor for pipe width
    const pipeScaleFactor = 1; // Adjust to scale the pipe size in the game
    let pipeWidth = visiblePipeWidth * pipeScaleFactor; // Width of the pipe in the game

    let pipeGap = 250; // Gap between pipes in pixels
    let pipeSpeed = 200; // Pipe speed in pixels per second
    let pipes = [];

    // Background scrolling
    let bgX = 0;
    let bgSpeed = 50; // Background speed in pixels per second

    // Declare image variables
    let birdImg, pipeImg, bgImg;

    // Generate pipes function
    const generatePipe = () => {
      // Randomly determine the height of the top pipe
      let minPipeHeight = 50;
      let maxPipeHeight = canvas.height - pipeGap - minPipeHeight;
      let topPipeHeight =
        Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;

      let bottomPipeY = topPipeHeight + pipeGap;
      let bottomPipeHeight = canvas.height - bottomPipeY;

      pipes.push({
        x: canvas.width,
        topPipeHeight: topPipeHeight,
        bottomPipeY: bottomPipeY,
        bottomPipeHeight: bottomPipeHeight,
        passed: false,
      });
    };

    // Game loop function with time-based movement
    const gameLoop = (currentTime) => {
      if (isGameOver) {
        showGameOver();
        return;
      }

      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move background
      bgX -= bgSpeed * deltaTime;
      if (bgX <= -canvas.width) {
        bgX += canvas.width;
      }

      // Draw the background
      ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);

      // Bird physics
      birdVelocity += gravity * deltaTime;
      birdY += birdVelocity * deltaTime;

      // Calculate bird rotation angle based on velocity
      let maxAngle = 25;
      let angle = (birdVelocity / 500) * maxAngle;
      angle = Math.max(Math.min(angle, maxAngle), -maxAngle);
      let angleInRadians = (angle * Math.PI) / 180;

      // Draw the bird with rotation
      ctx.save();
      ctx.translate(birdX + birdWidth / 2, birdY + birdHeight / 2);
      ctx.rotate(angleInRadians);
      ctx.drawImage(
        birdImg,
        -birdWidth / 2,
        -birdHeight / 2,
        birdWidth,
        birdHeight
      );
      ctx.restore();

      // Draw and update pipes
      for (let i = 0; i < pipes.length; i++) {
        let pipe = pipes[i];
        pipe.x -= pipeSpeed * deltaTime;

        // Source coordinates for the visible pipe part
        let sx = transparentLeft;
        let sy = 0;
        let sWidth = visiblePipeWidth;
        let sHeight = totalPipeImageHeight;

        // Destination dimensions on the canvas
        let dx = pipe.x;
        let dWidth = pipeWidth;

        // Draw top pipe
        let topPipeHeight = pipe.topPipeHeight;
        ctx.drawImage(
          pipeImg,
          sx, sy, sWidth, sHeight,
          dx, 0, dWidth, topPipeHeight
        );

        // Draw bottom pipe
        let bottomPipeY = pipe.bottomPipeY;
        let bottomPipeHeight = pipe.bottomPipeHeight;
        ctx.drawImage(
          pipeImg,
          sx, sy, sWidth, sHeight,
          dx, bottomPipeY, dWidth, bottomPipeHeight
        );

        // Collision detection
        if (
          birdX + birdWidth > pipe.x &&
          birdX < pipe.x + pipeWidth &&
          (
            birdY < pipe.topPipeHeight ||
            birdY + birdHeight > pipe.bottomPipeY
          )
        ) {
          isGameOver = true;

          // Play hit sound
          hitSound.currentTime = 0;
          hitSound.play();
        }

        // Increase score
        if (!pipe.passed && pipe.x + pipeWidth < birdX) {
          score++;
          pipe.passed = true;

          // Play pipe sound
          pipeSound.currentTime = 0;
          pipeSound.play();

          // Play onichiwa sound every 10 points
          if (score % 10 === 0) {
            onichiwaSound.currentTime = 0;
            onichiwaSound.play();
          }
        }
      }

      // Remove off-screen pipes
      if (pipes.length && pipes[0].x < -pipeWidth) {
        pipes.shift();
      }

      // Draw score
      ctx.fillStyle = '#000';
      ctx.font = `30px Arial`;
      ctx.fillText('Score: ' + score, 10, 50);

      // Check for collision with ground or ceiling
      if (birdY + birdHeight > canvas.height || birdY < 0) {
        isGameOver = true;

        // Play hit sound
        hitSound.currentTime = 0;
        hitSound.play();
      }

      // Request next frame
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Show Game Over screen function
    const showGameOver = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fff';
      ctx.font = `60px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = `30px Arial`;
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText(
        'Click or Tap to Restart',
        canvas.width / 2,
        canvas.height / 2 + 60
      );
    };

    // Restart the game
    const restartGame = () => {
      if (!isGameOver) return;

      // Reset game variables
      birdX = 50;
      birdY = canvas.height / 2;
      birdVelocity = 0;
      isGameOver = false;
      score = 0;
      pipes = [];
      bgX = 0;
      lastTime = performance.now();

      // Clear previous intervals and animation frames
      cancelAnimationFrame(animationFrameId);
      clearInterval(pipeInterval);

      // Start generating pipes again
      generatePipe();
      pipeInterval = setInterval(generatePipe, 2000);

      // Start the game loop again
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Event handlers
    const handleKeyDown = (event) => {
      if (isGameOver) return;

      if (event.code === 'Space' || event.code === 'ArrowUp') {
        birdVelocity = jumpVelocity;
        flapSound.currentTime = 0;
        flapSound.play();
      }
    };

    const handleCanvasClick = (event) => {
      if (isGameOver) {
        restartGame();
      } else {
        birdVelocity = jumpVelocity;
        flapSound.currentTime = 0;
        flapSound.play();
      }
    };

    const handleCanvasTouchStart = (event) => {
      event.preventDefault(); // Prevent default scrolling behavior

      if (isGameOver) {
        restartGame();
      } else {
        birdVelocity = jumpVelocity;
        flapSound.currentTime = 0;
        flapSound.play();
      }
    };

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouchStart);

    const startGame = async () => {
      // Load images and assign to variables accessible in gameLoop
      [birdImg, pipeImg, bgImg] = await Promise.all([
        loadImage(birdImgSrc),
        loadImage(pipeImgSrc),
        loadImage(bgImgSrc),
      ]);

      // Generate initial pipes
      generatePipe();
      // Generate pipes every 2000ms
      pipeInterval = setInterval(generatePipe, 2000);

      // Start the game loop with initial timestamp
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Start the game
    startGame();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(pipeInterval);
      document.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('touchstart', handleCanvasTouchStart);
    };
  }, []);

  return (
    <canvas
      id="gameCanvas"
      ref={canvasRef}
      style={{
        display: 'block',
        backgroundColor: '#70c5ce',
      }}
    />
  );
};

export default Game;
