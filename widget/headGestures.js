// headGestureModule.js

const headGestureModule = (function () {
  // Encapsulate in an IIFE for modularity

  let videoElement = null;
  let canvasElement = null;
  let gestureOutput = null;

  let previousGesture = 'None';
  let consecutiveFrames = 0;
  const requiredConsecutiveFrames = 5;

  // Gesture hold variables
  let gestureHoldTime = 0;
  const gestureHoldDuration = 20;
  let currentGesture = 'None';
  let eyeCloseStartTime = null;
  const eyeCloseThreshold = 500;

  // Direction thresholds - ADJUST AS NEEDED!
  const verticalThreshold = 0.025; // For up/down
  const horizontalThreshold = 0.035; // For left/right

  let initialNoseY = null; // For vertical movement
  let initialNoseX = null; // For horizontal movement

  // Add recent history arrays:
  const historyLength = 3; // Adjust for smoothing
  let recentDeltaYs = [];
  let recentDeltaXs = [];

  let initialFrames = 10; // Wait before gestures are enabled

  // Debounce timer (now only used to prevent multiple events in rapid succession *while holding the gesture*)
  let debounceTimer = null;
  const debounceDelay = 250; // milliseconds

  // **Cooldown after event dispatch**
  let cooldownTimer = null;
  const cooldownDuration = 1000; // milliseconds (1 second)
  let isCoolingDown = false;

  // Flag to temporarily disable gesture detection
  let disableGestureDetection = false;

  // Custom event name
  const gestureEventName = 'GuidyHeadGesture';
  const terminateEventName = 'GuidyHeadGestureTerminate';

  let faceMesh = null; // Instance of MediaPipe FaceMesh
  let isInitialized = false;
  let stream = null; // Keep track of the video stream
  let isLoading = false; // Flag to track loading state
  let faceMeshLoading = false;
  let wasmInitialized = false; // Track WASM initialization

  async function initialize(videoElementId, canvasElementId, gestureOutputId) {
    // Prevent multiple initializations
    console.log('Initializing HeadGestureModule...', isInitialized);
    if (isInitialized) {
      console.warn('HeadGestureModule is already initialized. Ignoring.');
      return false; // Indicate that initialization was skipped
    }
    isInitialized = true;
    videoElement = document.getElementById(videoElementId);
    canvasElement = document.getElementById(canvasElementId);
    gestureOutput = document.getElementById(gestureOutputId);
    isLoading = true; // Set loading state
    showLoadingIndicator(); // Display the loading indicator

    //Load the FaceMesh library
    try {
      if (!wasmInitialized) {
        await loadFaceMeshLibrary();
        wasmInitialized = true;
      }
    } catch (error) {
      console.error('Failed to load FaceMesh library:', error);
      hideLoadingIndicator(); // Hide loading indicator on failure
      isLoading = false;
      return false; // Indicate initialization failure
    }

    if (!videoElement || !canvasElement || !gestureOutput) {
      console.error('Error: Required elements not found.');
      hideLoadingIndicator(); // Hide loading indicator on failure
      isLoading = false;
      return false; // Indicate failure to initialize
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = stream;

      // Ensure video is loaded before continuing
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          resolve();
        };
      });
      //Check video is playing before continuing
      await videoElement.play();
      console.log('Video is playing', videoElement.paused);
      if (!faceMesh) {
        faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@latest/${file}`;
          },
        });
      }

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);

      processFrame(); // Start processing frames
      // Keep isLoading true until face landmarks are first detected

      return true; // Indicate successful initialization
    } catch (error) {
      console.error('Error during initialization:', error);
      hideLoadingIndicator(); // Hide loading indicator on failure
      isLoading = false;
      return false; // Indicate failure
    }
  }

  async function loadFaceMeshLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@latest/face_mesh.js';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function drawFaceOverlay(landmarks, gesture) {
    if (!landmarks) return;
    const canvasCtx = canvasElement.getContext('2d'); // Get context each time

    // Clear the canvas *before* drawing.  This is crucial!
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Calculate Bounding Box
    let minX = Infinity,
      minY = Infinity,
      maxX = Infinity,
      maxY = Infinity;
    for (const landmark of landmarks) {
      minX = Math.min(minX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxX = Math.max(maxX, landmark.x);
      maxY = Math.max(maxY, landmark.y);
    }

    const boxX = minX * canvasElement.width;
    const boxY = minY * canvasElement.height;
    const boxWidth = (maxX - minX) * canvasElement.width;
    const boxHeight = (maxY - minY) * canvasElement.height;

    // Draw Bounding Box
    canvasCtx.strokeStyle = 'cyan';
    canvasCtx.lineWidth = 3;
    canvasCtx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Determine Eye Color based on gesture
    let eyeColor = 'yellow'; // Default color
    if (gesture === 'Up') {
      eyeColor = 'green';
    } else if (gesture === 'Down') {
      eyeColor = 'red';
    } else if (gesture === 'Left') {
      eyeColor = 'blue';
    } else if (gesture === 'Right') {
      eyeColor = 'orange';
    }

    // Draw Eye Highlights
    drawEyeHighlights(
      canvasCtx,
      landmarks,
      [133, 160, 159, 158, 157, 173, 130, 246],
      eyeColor
    ); // Left Eye
    drawEyeHighlights(
      canvasCtx,
      landmarks,
      [362, 387, 386, 385, 384, 398, 359, 466],
      eyeColor
    ); // Right Eye
  }

  function drawEyeHighlights(ctx, landmarks, eyeIndices, color) {
    ctx.fillStyle = color; // Set the fill color
    ctx.beginPath();
    for (const index of eyeIndices) {
      const x = landmarks[index].x * canvasElement.width;
      const y = landmarks[index].y * canvasElement.height;
      ctx.lineTo(x, y); // create the polygon.
    }
    ctx.closePath(); // close the polygon so it's filled.
    ctx.fill(); // fill the polygon with color.
  }

  function detectGesture(landmarks) {
    if (disableGestureDetection) {
      return 'None'; // Immediately return 'None' if detection is disabled
    }

    if (!landmarks) return 'None';
    const noseX = landmarks[1].x;
    const noseY = landmarks[1].y;

    if (initialNoseY === null) {
      initialNoseY = noseY;
    }

    if (initialNoseX === null) {
      initialNoseX = noseX;
    }

    const deltaY = noseY - initialNoseY;
    const deltaX = noseX - initialNoseX;

    //Store them in the recent history
    recentDeltaYs.push(deltaY);
    if (recentDeltaYs.length > historyLength) {
      recentDeltaYs.shift(); // Remove the oldest value
    }

    recentDeltaXs.push(deltaX);
    if (recentDeltaXs.length > historyLength) {
      recentDeltaXs.shift(); // Remove the oldest value
    }

    //Calculate the total delta over recent history to smooth the signal
    let totalDeltaY = recentDeltaYs.reduce((a, b) => a + b, 0);
    let totalDeltaX = recentDeltaXs.reduce((a, b) => a + b, 0);

    //Prioritize Left/Right detection
    if (
      Math.abs(totalDeltaX) > Math.abs(totalDeltaY) &&
      (totalDeltaX > horizontalThreshold * historyLength ||
        totalDeltaX < -horizontalThreshold * historyLength)
    ) {
      if (totalDeltaX < -horizontalThreshold * historyLength) {
        return 'Right';
      } else if (totalDeltaX > horizontalThreshold * historyLength) {
        return 'Left';
      }
    } else {
      if (totalDeltaY < -verticalThreshold * historyLength) {
        return 'Up';
      } else if (totalDeltaY > verticalThreshold * historyLength) {
        return 'Down';
      }
    }

    return 'None';
  }

  function dispatchHeadGesture(gesture) {
    if (isCoolingDown) {
      return; // Prevent dispatching during cooldown
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer); // Clear the existing debounce timer
    }

    debounceTimer = setTimeout(() => {
      const event = new CustomEvent(gestureEventName, {
        detail: { gesture: gesture },
      });
      document.dispatchEvent(event); // Dispatch on the document
      debounceTimer = null; // Clear the debounce timer

      // Start the cooldown period
      isCoolingDown = true;
      disableGestureDetection = true; // Disable gesture detection

      cooldownTimer = setTimeout(() => {
        isCoolingDown = false;
        disableGestureDetection = false; // Re-enable gesture detection
        cooldownTimer = null;
      }, cooldownDuration);

      // Reset gesture-related variables
      currentGesture = 'None';
      gestureHoldTime = 0;
      recentDeltaYs = [];
      recentDeltaXs = [];
      initialNoseY = null;
      initialNoseX = null;
      gestureOutput.textContent = `Gesture: None`;
    }, debounceDelay);
  }

  async function onResults(results) {
    if (!canvasElement) return; // Exit early if canvas is not initialized

    const canvasCtx = canvasElement.getContext('2d'); // Get context each time
    // Clear the canvas *before* drawing.  This is crucial!
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      videoElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (isLoading) {
      // Ensure loading state is still true before showing indicator.
      showLoadingIndicator();
    }

    if (results.multiFaceLandmarks && initialFrames <= 0) {
      // Only hide loading and set isLoading to false when face landmarks are first detected
      if (isLoading) {
        hideLoadingIndicator();
        isLoading = false;
      }

      const landmarks = results.multiFaceLandmarks[0];
      let gesture = detectGesture(landmarks); // Detect gesture

      if (gesture !== 'None') {
        //Hold gesture
        currentGesture = gesture;
        gestureHoldTime = 0;
        initialNoseY = landmarks[1].y; // Reset baseline to current
        initialNoseX = landmarks[1].x;
        dispatchHeadGesture(currentGesture);
        return;
      }

      if (gestureHoldTime < gestureHoldDuration) {
        gestureOutput.textContent = `Gesture: ${currentGesture}`;
        gestureHoldTime++;
      } else {
        // This block now only resets if not disabled AND not holding a gesture
        if (!disableGestureDetection && currentGesture === 'None') {
          gestureOutput.textContent = `Gesture: None`;
          recentDeltaYs = [];
          recentDeltaXs = [];
        }
      }

      drawFaceOverlay(landmarks, currentGesture); // Call new
    } else {
      initialFrames--; // Decrement only when we get face landmarks

      gestureOutput.textContent = 'Gesture: None';
      currentGesture = 'None';
      gestureHoldTime = 0;
      recentDeltaYs = [];
      recentDeltaXs = [];
      initialNoseY = null;
      initialNoseX = null;
    }

    function isEyeClosed(landmarks, left = true) {
      const eyeIndices = left
        ? [159, 145] // Left eye: upper and lower eyelid landmarks
        : [386, 374]; // Right eye: upper and lower eyelid landmarks
      if (eyeIndices.length !== 2 || !landmarks?.length) return;
      const eyeTop = landmarks[eyeIndices[0]];
      const eyeBottom = landmarks[eyeIndices[1]];

      const eyeDistance = Math.abs(eyeTop.y - eyeBottom.y);
      return eyeDistance < 0.008; // Adjust threshold if needed
    }

    if (results.multiFaceLandmarks) {
      const landmarks = results.multiFaceLandmarks[0];

      const isBothEyesClosed =
        isEyeClosed(landmarks, true) && isEyeClosed(landmarks, false);

      if (isBothEyesClosed) {
        if (!eyeCloseStartTime) {
          eyeCloseStartTime = Date.now();
        }

        const elapsedTime = Date.now() - eyeCloseStartTime;
        if (elapsedTime >= eyeCloseThreshold) {
          dispatchHeadGesture('Blink');
          eyeCloseStartTime = null; // Reset the timer after triggering
        }
      } else {
        eyeCloseStartTime = null; // Reset timer if eyes are open
      }
    }
  }

  async function processFrame() {
    if (!faceMesh || !wasmInitialized) {
      // Exit if faceMesh is null or WASM is not initialized
      console.warn(
        'processFrame: faceMesh is null or WASM not initialized. Skipping frame.'
      );
      return;
    }

    try {
      await faceMesh.send({ image: videoElement });
      requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('processFrame: Error sending image to faceMesh:', error);
    }
  }

  function terminate() {
    isLoading = false; // Ensure loading is stopped
    hideLoadingIndicator(); // Hide the indicator
    wasmInitialized = false;

    if (isInitialized) {
      // Stop the video stream
      if (stream) {
        const tracks = stream.getTracks();

        // Iterate backwards to avoid issues if stopping modifies the array
        for (let i = tracks.length - 1; i >= 0; i--) {
          try {
            tracks[i].stop();
          } catch (error) {
            console.error('Error stopping track:', error);
          }
        }

        //Remove the srcObject *before* stopping the tracks.
        if (videoElement) {
          videoElement.srcObject = null;
          // Safari-specific hack to reset the video element
          videoElement.removeAttribute('src');
          videoElement.load();
        }
        stream = null; // Clear the stream reference after stopping
      }

      // Dispose of FaceMesh (if applicable - check MediaPipe docs)
      if (faceMesh) {
        try {
          faceMesh.close(); // Or faceMesh.dispose(), check the API
        } catch (error) {
          console.error('Error closing faceMesh:', error);
        }
        faceMesh = null;
      }

      // Clear timers
      clearTimeout(debounceTimer);
      clearTimeout(cooldownTimer);

      // Reset variables to initial state
      videoElement = null;
      canvasElement = null;
      gestureOutput = null;
      previousGesture = 'None';
      consecutiveFrames = 0;
      gestureHoldTime = 0;
      currentGesture = 'None';
      initialNoseY = null;
      initialNoseX = null;
      recentDeltaYs = [];
      recentDeltaXs = [];
      isCoolingDown = false;
      disableGestureDetection = false;

      isInitialized = false; // Mark as not initialized

      console.log('HeadGestureModule terminated.');
    } else {
      console.log('HeadGestureModule was not initialized.');
    }
  }

  // Event listener for termination
  document.addEventListener(terminateEventName, terminate);

  function showLoadingIndicator() {
    if (!canvasElement) return;

    const canvasCtx = canvasElement.getContext('2d');
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height); // Clear previous content

    canvasCtx.font = '30px Arial';
    canvasCtx.fillStyle = 'white';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText(
      'Loading...',
      canvasElement.width / 2,
      canvasElement.height / 2
    );
  }

  function hideLoadingIndicator() {
    if (!canvasElement) return;

    const canvasCtx = canvasElement.getContext('2d');
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height); // Clear the loading text
  }

  return {
    initialize: initialize,
    terminate: terminate, //Expose the terminate function.
  };
})();

export default headGestureModule;
