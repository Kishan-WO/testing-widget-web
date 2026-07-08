import { rootElement } from './constants.js';

let lastGesture = null;
let gestureStartTime = null;
const gestureHoldDuration = 1500;

const signLanguageModule = (() => {
  let video, canvas, ctx, detector, animationFrameId;

  function showLoadingSpan(canvasId) {
    const canvas = document.getElementById(canvasId);

    // Create the loading span
    const loadingSpan = document.createElement('span');
    loadingSpan.id = 'canvas-loading-span';
    loadingSpan.innerText = 'Loading...';
    loadingSpan.style.display = 'flex';
    loadingSpan.style.alignItems = 'center';
    loadingSpan.style.justifyContent = 'center';
    loadingSpan.style.position = 'fixed';
    loadingSpan.style.top = canvas.offsetTop + 'px';
    loadingSpan.style.left = canvas.offsetLeft + 'px';
    loadingSpan.style.width = canvas.offsetWidth + 'px';
    loadingSpan.style.height = canvas.offsetHeight + 'px';
    loadingSpan.style.background = 'rgba(0, 0, 0, 0.2)';
    loadingSpan.style.color = 'white';
    loadingSpan.style.fontSize = '24px';
    loadingSpan.style.zIndex = 2147483645;
    loadingSpan.style.borderRadius = '12px';
    // Append to body
    rootElement.appendChild(loadingSpan);
  }

  function hideLoadingSpan() {
    const loadingSpan = document.getElementById('canvas-loading-span');
    if (loadingSpan) {
      loadingSpan.remove();
    }
  }

  const initialize = async (videoElementId, canvasElementId) => {
    video = document.getElementById(videoElementId);
    canvas = document.getElementById(canvasElementId);
    ctx = canvas.getContext('2d');

    showLoadingSpan(canvasElementId);

    try {
      // Load necessary external scripts via CDN
      if (!window.handPoseDetection) {
        await loadExternalScripts();
      }

      // Setup webcam
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Initialize MediaPipe Hands detector
      detector = await window.handPoseDetection.createDetector(
        window.handPoseDetection.SupportedModels.MediaPipeHands,
        {
          runtime: 'mediapipe',
          modelType: 'full', // or 'full'
          maxHands: 1,
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands', // MediaPipe asset path
        }
      );

      hideLoadingSpan();

      // Start detecting
      const detectHands = async () => {
        const hands = await detector.estimateHands(video, {
          flipHorizontal: true,
        });

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);

        hands.forEach((hand) => {
          hand.keypoints.forEach(({ x, y }) => {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          });

          const landmarks = hand.keypoints3D?.map(({ x, y, z }) => [x, y, z]);
          if (landmarks && landmarks.length) {
            const gesture = GE.estimate(landmarks, 7);
            if (gesture.gestures?.length > 0) {
              const [bestMatch] = gesture.gestures.sort(
                (a, b) => b.score - a.score
              );
              const currentGesture = bestMatch.name;

              const now = Date.now();

              if (lastGesture !== currentGesture) {
                lastGesture = currentGesture;
                gestureStartTime = now;
              } else if (now - gestureStartTime >= gestureHoldDuration) {
                const event = new CustomEvent('guidySignGestureDetected', {
                  detail: { name: currentGesture, timestamp: now },
                });
                window.dispatchEvent(event);
                // Reset so it can detect the same gesture again after a pause
                lastGesture = null;
                gestureStartTime = null;
              }
            } else {
              lastGesture = null;
              gestureStartTime = null;
            }
          }
        });

        ctx.restore();
        animationFrameId = requestAnimationFrame(detectHands);
      };

      detectHands();
      const { Finger, FingerCurl, FingerDirection, GestureDescription } =
        window.fp;

      // INDEX FINGER POINTING UP
      const indexUp = new GestureDescription('index_up');
      indexUp.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
      indexUp.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.8);
      for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
        indexUp.addCurl(finger, FingerCurl.FullCurl, 0.8);
        indexUp.addCurl(finger, FingerCurl.HalfCurl, 0.8);
      }

      // INDEX FINGER POINTING DOWN
      const indexDown = new GestureDescription('index_down');
      indexDown.addCurl(Finger.Index, FingerCurl.NoCurl, 0.5);
      indexDown.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.5);
      indexDown.addDirection(Finger.Index, FingerDirection.VerticalDown, 0.8);
      indexDown.addDirection(
        Finger.Index,
        FingerDirection.DiagonalDownLeft,
        0.8
      );
      indexDown.addDirection(
        Finger.Index,
        FingerDirection.DiagonalDownRight,
        0.8
      );
      for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
        indexDown.addCurl(finger, FingerCurl.HalfCurl, 0.8);
        indexDown.addCurl(finger, FingerCurl.FullCurl, 0.8);
      }

      // INDEX FINGER POINTING LEFT
      const indexLeft = new GestureDescription('index_left');
      indexLeft.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
      indexLeft.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.8);
      for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
        indexLeft.addCurl(finger, FingerCurl.HalfCurl, 0.8);
        indexLeft.addCurl(finger, FingerCurl.FullCurl, 0.8);
      }

      // INDEX FINGER POINTING RIGHT
      const indexRight = new GestureDescription('index_right');
      indexRight.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
      indexRight.addDirection(
        Finger.Index,
        FingerDirection.HorizontalRight,
        0.8
      );
      for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
        indexRight.addCurl(finger, FingerCurl.FullCurl, 0.8);
        indexRight.addCurl(finger, FingerCurl.HalfCurl, 0.8);
      }

      const closedHand = new GestureDescription('closed_hand');
      closedHand.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
      closedHand.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
      for (let finger of [
        Finger.Index,
        Finger.Middle,
        Finger.Ring,
        Finger.Pinky,
      ]) {
        closedHand.addCurl(finger, FingerCurl.FullCurl, 0.8);
      }

      const GE = new fp.GestureEstimator([
        indexUp,
        indexDown,
        indexLeft,
        indexRight,
        closedHand,
      ]);

      return true; // Indicate successful initialization
    } catch (error) {
      console.error('Error during sign language initialization:', error);
      hideLoadingSpan();
      return false; // Indicate failure
    }
  };

  const loadExternalScripts = async () => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js',
      'https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection@2.0.1/dist/hand-pose-detection.min.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js',
      'https://cdn.jsdelivr.net/npm/fingerpose@0.1.0/dist/fingerpose.min.js',
    ];

    for (let src of scripts) {
      if (!document.querySelector(`script[src="${src}"]`)) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    }
  };

  const terminate = () => {
    hideLoadingSpan();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    if (video?.srcObject) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();

      for (let i = tracks.length - 1; i >= 0; i--) {
        try {
          tracks[i].stop();
        } catch (error) {
          console.error('Error stopping track:', error);
        }
      }

      // Clean up the video element (Safari hack included)
      video.srcObject = null;
      video.removeAttribute('src');
      video.load();
    }

    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  document.addEventListener('GuidySignGestureTerminate', terminate);

  return {
    initialize,
    terminate,
  };
})();

export default signLanguageModule;
