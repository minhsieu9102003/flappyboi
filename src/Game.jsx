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

    // Determine if the device is mobile based on screen width
    const isMobile = window.innerWidth <= 768;

    // Scaling factor for mobile devices
    const scaleFactor = isMobile ? 0.55 : 1; // Adjust scaling as needed

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

    // Game variables accessible throughout useEffect
    let birdWidth = 100 * scaleFactor;
    let birdHeight = 70 * scaleFactor;

    let birdX = 50 * scaleFactor;
    let birdY = (canvas.height / 2) * scaleFactor;
    let birdVelocity = 0;
    let gravity = 0.1 * scaleFactor;
    let isGameOver = false;
    let score = 0;

    let jumpVelocity = -5 * scaleFactor;

    // Pipe image dimensions
    const totalPipeImageWidth = 360;
    const totalPipeImageHeight = 693;
    const visiblePipeWidth = 90;
    const visiblePipeHeight = 680;

    const transparentLeft = 135;
    const transparentRight = 135;

    const pipeScaleFactor = 1;
    let pipeWidth = visiblePipeWidth * pipeScaleFactor * scaleFactor;

    let pipeGap = 250 * scaleFactor;
    let pipeSpeed = 2 * scaleFactor;
    let pipes = [];

    // Background scrolling
    let bgX = 0;
    let bgSpeed = 0.5 * scaleFactor;

    // Declare image variables
    let birdImg, pipeImg, bgImg;

    // Generate pipes function
    const generatePipe = () => {
      // Randomly determine the height of the top pipe
      let minPipeHeight = 50 * scaleFactor;
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

    // Game loop function
    const gameLoop = () => {
      if (isGameOver) {
        showGameOver();
        return;
      }

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move background
      bgX -= bgSpeed;
      if (bgX <= -canvas.width) {
        bgX = 0;
      }

      // Draw the background
      ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);

      // Bird physics
      birdVelocity += gravity;
      birdY += birdVelocity;

      // Calculate bird rotation angle based on velocity
      let maxAngle = 25;
      let angle = (birdVelocity / 10) * maxAngle;
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
        pipe.x -= pipeSpeed;

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

        // Draw bottom pipe (flipped vertically)
        ctx.save();
        ctx.translate(pipe.x + dWidth / 2, pipe.bottomPipeY + pipe.bottomPipeHeight / 2);
        ctx.rotate(Math.PI); // Rotate 180 degrees
        ctx.drawImage(
          pipeImg,
          sx, sy, sWidth, sHeight,
          -dWidth / 2, -pipe.bottomPipeHeight / 2,
          dWidth, pipe.bottomPipeHeight
        );
        ctx.restore();

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
      ctx.font = `${30 * scaleFactor}px Arial`;
      ctx.fillText('Score: ' + score, 10 * scaleFactor, 50 * scaleFactor);

      // Check for collision with ground or ceiling
      if (birdY + birdHeight > canvas.height || birdY < 0) {
        isGameOver = true;

        // Play hit sound
        hitSound.currentTime = 0;
        hitSound.play();
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Show Game Over screen function
    const showGameOver = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fff';
      ctx.font = `${60 * scaleFactor}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 30 * scaleFactor);
      ctx.font = `${30 * scaleFactor}px Arial`;
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20 * scaleFactor);
      ctx.fillText(
        'Click or Tap to Restart',
        canvas.width / 2,
        canvas.height / 2 + 60 * scaleFactor
      );
    };

    // Restart the game
    const restartGame = () => {
      if (!isGameOver) return;

      // Reset game variables
      birdX = 50 * scaleFactor;
      birdY = (canvas.height / 2) * scaleFactor;
      birdVelocity = 0;
      isGameOver = false;
      score = 0;
      pipes = [];
      bgX = 0;

      // Clear previous intervals and animation frames
      cancelAnimationFrame(animationFrameId);
      clearInterval(pipeInterval);

      // Start generating pipes again
      generatePipe();
      pipeInterval = setInterval(generatePipe, 2000);

      // Start the game loop again
      gameLoop();
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

      // Start the game loop
      gameLoop();
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
