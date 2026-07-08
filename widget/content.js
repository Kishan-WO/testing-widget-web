import {
  callGuidyDashboard,
  defaultKeyboardShortcuts,
  getDataById,
  getImageAlts,
  getLocalStorage,
  getLocalStorageData,
  getTranslations,
  hideLoaderOnButton,
  isNotVisible,
  isWoTestExists,
  localStorageKey,
  rootElement,
  setLocalStorageData,
  showLoaderOnButton,
  translateContent,
  currentConfig,
  miniWidgetOptions,
  nanoWidgetOptions,
  translateText,
  rgbToHex,
  waitForSelector,
  debounce,
  sendPageViewsEvent,
  speak,
  getAccountKey,
  CODE_TO_KEY,
} from './constants.js';

const menuOptionsToRefresh = {
  toolTip: false,
  lineHeight: false,
  textAlignment: false,
  screenReader: false,
  partialReader: false,
  muteSounds: false,
  adjustFontSizing: false,
  adjustLetterSpacing: false,
  adjustLineHeight: false,
  adjustWordSpacing: false,
  contentScale: false,
  adjustTextColors: false,
  adjustTitleColors: false,
  adjustBackgroundColors: false,
  stopAnimation: false,
  displayInText: false,
};

const setMenuOptionToRefresh = (flag, key, value) => {
  if (flag) {
    menuOptionsToRefresh[key] = value;
  } else {
    menuOptionsToRefresh[key] = false;
  }
};

const { staticPath, iFrameCDN, environment } = currentConfig;

let visuals = {
  highlight: {
    highlightSize: 2,
    highlightOpacity: 1,
    highlightColor: '#ffdd00',
  },
  guide: {
    guideSize: 1,
    guideOpacity: 1,
    guideColor: '#0000FF',
    readingGuideDefault: '#ffdd00',
  },
  cursorIcon: {
    cursorSize: 32,
    cursorSpeed: 10,
    cursorColor: '#0000FF',
  },
};
let floatingButton;
let lastCursorKey = undefined;
let syllabicDivision = undefined;
let isVirtualKeyboardOn = false;
let isVoiceNavigationOn = false;
let isKeyboardShortcutsOn = false;
let isKeyboardNavigationOn = false;
let moveWidgetDiv;
let keyboardNavigation;
let widgetConfig = window.woAccConfig;
let audioElement;
let virtualKeyboard;
let keyboardShortcut;
let focusedInput;
let voiceNavigation;
let recognizer;
let voiceNavigationButton;
let voiceNavigationText;
let commandsSection;
let isShifted = false;
let isJapanese = false;
let currentOpenModal = '';
let innerContainer;
let collectedElements;
let elements = {};
let globalStartedFrom = 0;
let breakFlag = false;
let currentReadSpeed;
let styleElement;
let shortcuts;
let imageAltData;
let alwaysOnGuidyBoard = false;
let isWidgetOpen = false;
let preventWidgetClose = false;
let titlesColor;
let textColor;
let lazyLoadTranslationObserver;
let translationBucket = [];
let furiganaBucket = [];
let batchTimeout;
let furiganaBatchTimeout;
let isFuriganaInitialized = false;
let timer;
let readModeObserver;
let isHeadGestureInitialized = false;
let isSignGestureInitialized = false;
let summarizationTooltip = null;
let guidyCursor = null;
let guidyCurrentCursorFocusedElement = null;
let hoverStyles = [];
let guidyCursorIndicator = null;
let previousHoveredElements = [];
const summarizationEventBucket = [];
let isKeyReadyToAccept = true;
let FilterKeyThreshold = 1000;
let toggleAudio = null;
const localConfig = {};
const readingModeElementState = new Map();
const READING_MODE_STYLE_ID = 'guidy-reading-mode-style';
let screenReaderRef = null;
let isActive = { partialReader: false, screenReader: false };
const textMagnifierTooltip = document.createElement('div');
const furiganaTooltip = document.createElement('div');
const imageDescriptionTooltip = document.createElement('div');
let sayCallVersion = 0;
let mouseX, mouseY;
let newLinks = []; // to store new links for websiteStateContext
let formsMetaData = {}; // to store forms metadata for websiteStateContext;
document.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});
let activeContentAdjustments = [];
const customCursorIcons = {
  default:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" stroke="#fff" stroke-width="1.5" d="m6 3l12 11l-5 1l3 5.5l-3 1.5l-3-6l-4 3z"/></svg>',
  pointer:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16.083" height="20" fill="none" viewBox="0 0 16.083 20"><path fill="#000" stroke="#fff" stroke-width=".833" d="M6.333.5c1.167 0 2 .917 2 2v2.333h.333c.75 0 1.333.25 1.667.75a1.5 1.5 0 0 1 .833-.167c.833 0 1.583.5 1.917 1.25h.5c1.417.001 2.25.834 2.25 2.167v1.917a16.7 16.7 0 0 1-.583 4.167c-.333 1.25-.667 2.5-.667 4 0 .167-.083.417-.25.583s-.417.167-.667.167h-7.5c-.167 0-.417 0-.583-.167s-.25-.417-.25-.667c0-.833-.333-1.333-1-2.167L3 14.999A28 28 0 0 1 .5 9.916c-.25-.833 0-1.5.25-1.917.25-.5.833-.667 1.417-.667.5 0 .833.25 1.333.5l.667.583V2.5c0-1 .833-2 2.166-2Z"/></svg>',
  text: '<svg xmlns="http://www.w3.org/2000/svg" width="6.25" height="20" fill="none" viewBox="0 0 6.25 20" stroke="#fff" stroke-width=".6"><path fill="#000" d="M6 1.25V0H0.25v1.25H2.5v17.5H0.25V20h5.75v-1.25H3.75v-17.5z"/></svg>',
  'not-allowed':
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"><g clip-path="url(#a)"><path fill="#fff" d="M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path stroke="#000" stroke-width="3" d="m3.5 3.5 13 13M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></g><rect width="19.5" height="19.5" x=".3" y=".3" stroke="#fff" stroke-width=".8" rx="9.8"/><defs><clipPath id="a"><rect width="20" height="20" fill="#fff" rx="10"/></clipPath></defs></svg>',
  'no-drop':
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"><g clip-path="url(#a)"><path fill="#fff" d="M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path stroke="#000" stroke-width="3" d="m3.5 3.5 13 13M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></g><rect width="19.5" height="19.5" x=".3" y=".3" stroke="#fff" stroke-width=".8" rx="9.8"/><defs><clipPath id="a"><rect width="20" height="20" fill="#fff" rx="10"/></clipPath></defs></svg>',
  'zoom-in':
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><filter id="a" width="1.3" height="1.3" x="-.2" y="-.1" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.2"/></filter><g transform="matrix(.7 0 0 .7 -120.6 -588.2)"><path d="M190.5 855.4a7.5 7.5 0 0 0 0 15c1.3 0 2.4-.4 3.4-1l.3.3a1 1 0 0 0 0 1.5l4 4c.4.3 1 .3 1.5 0l2-2.2c.5-.3.5-1 0-1.4l-4-4a1 1 0 0 0-1.3 0l-.2-.1c1-1.3 1.8-2.9 1.8-4.6 0-4.2-3.4-7.5-7.5-7.5" filter="url(#a)" opacity=".2"/><path d="M190.5 854.4a7.5 7.5 0 0 0 0 15c1.3 0 2.4-.4 3.4-1l.3.3a1 1 0 0 0 0 1.5l4 4a1 1 0 0 0 1.5 0l2-2.2a1 1 0 0 0 0-1.4l-4-4a1 1 0 0 0-1.3 0l-.2-.1c1-1.3 1.8-2.9 1.8-4.6 0-4.2-3.4-7.5-7.5-7.5"/><path fill="#fefefe" d="M190.5 855.4a6.5 6.5 0 0 0 0 13c1.4 0 2.6-.5 3.7-1.2l1.5 1.5-.8.7 4 4 2.2-2-4-4-.8.6-1.4-1.4a6.4 6.4 0 0 0 2.1-4.7 6.5 6.5 0 0 0-6.5-6.5"/><circle cx="190.5" cy="861.9" r="5.5"/><path fill="#fefefe" d="M190 858.4v3h-3v1h3v3h1v-3h3v-1h-3v-3z"/></g></svg>',
  'zoom-out':
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><filter id="a" width="1.3" height="1.3" x="-.2" y="-.1" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.2"/></filter><g transform="matrix(.7 0 0 .7 -155.5 -588.2)"><path d="M240.5 855.4a7.5 7.5 0 0 0 0 15c1.3 0 2.4-.4 3.4-1l.3.3a1 1 0 0 0 0 1.5l4 4c.4.3 1 .3 1.5 0l2-2.2c.5-.3.5-1 0-1.4l-4-4a1 1 0 0 0-1.3 0l-.2-.1c1-1.3 1.8-2.9 1.8-4.6 0-4.2-3.4-7.5-7.5-7.5" filter="url(#a)" opacity=".2"/><path d="M240.5 854.4a7.5 7.5 0 0 0 0 15c1.3 0 2.4-.4 3.4-1l.3.3a1 1 0 0 0 0 1.5l4 4a1 1 0 0 0 1.5 0l2-2.2a1 1 0 0 0 0-1.4l-4-4a1 1 0 0 0-1.3 0l-.2-.1c1-1.3 1.8-2.9 1.8-4.6 0-4.2-3.4-7.5-7.5-7.5"/><path fill="#fefefe" d="M240.5 855.4a6.5 6.5 0 0 0 0 13c1.4 0 2.6-.5 3.7-1.2l1.5 1.5-.8.7 4 4 2.2-2-4-4-.8.6-1.4-1.4a6.4 6.4 0 0 0 2.1-4.7 6.5 6.5 0 0 0-6.5-6.5"/><circle cx="240.5" cy="861.9" r="5.5"/><path fill="#fefefe" d="M237 861.4h7v1h-7z"/></g></svg>',
};

/**
 * Cursor configuration
 */
const cursorConfig = {
  movements: {
    up: 'Numpad8',
    down: 'Numpad2',
    left: 'Numpad4',
    right: 'Numpad6',
  },
  actions: {
    click: 'Numpad5',
    dblClick: 'NumpadAdd',
    rightClick: 'NumpadDivide',
  },
};
const screenReaderElementMappings = {
  button: 'button',
  link: 'link',
  a: 'link',
  input: 'input',
  h1: 'header',
  h2: 'header',
  h3: 'header',
  h4: 'header',
  h5: 'header',
  h6: 'header',
  img: 'image',
  section: 'section',
};

let constants = {
  contrast: {
    default: {
      className: '',
    },
    highContrast: {
      className: 'woAcc-FCONT1',
    },
    darkContrast: {
      className: 'woAcc-FCONT2',
    },
    lightContrast: {
      className: 'woAcc-FCONT3',
    },
  },
  smartContrast: {
    default: {
      className: '',
    },
    smartContrast: {
      className: 'woAcc-FSMCONT1',
    },
  },
  saturationSettings: {
    default: {
      className: '',
    },
    lowSaturation: {
      className: 'woAcc-FS1',
    },
    highSaturation: {
      className: 'woAcc-FS2',
    },
    monochrome: {
      className: 'woAcc-FS3',
    },
  },
  colorAdjustments: {
    default: { className: '' },
    blueLightReduction: { className: 'woAcc-CA1' },
    colorSoftening: { className: 'woAcc-CA2' },
    invertColors: { className: 'woAcc-CA3' },
  },
  enlargeText: {
    default: {
      className: '',
    },
    large1: {
      className: 'woAcc-FLD1',
    },
    large2: {
      className: 'woAcc-FLD2',
    },
    large3: {
      className: 'woAcc-FLD3',
    },
    large4: {
      className: 'woAcc-FLD4',
    },
  },
  textSpacing: {
    default: {
      className: '',
    },
    space1: {
      className: 'woAcc-FTS1',
    },
    space2: {
      className: 'woAcc-FTS2',
    },
    space3: {
      className: 'woAcc-FTS3',
    },
  },
  font: {
    default: {
      className: '',
    },
    dyslexiaFriendly: {
      className: 'woAcc-FFONT1',
    },
    readableFont: {
      className: 'woAcc-FFONT2',
    },
    arial: {
      className: 'woAcc-FFONT3',
    },
    verdana: {
      className: 'woAcc-FFONT4',
    },
    georgia: {
      className: 'woAcc-FFONT5',
    },
    'B612 Mono': {
      className: 'woAcc-FFONT6',
    },
    comic: {
      className: 'woAcc-FFONT7',
    },
    atkinsonHyperlegible: {
      className: 'woAcc-FFONT8',
    },
    openDyslexic: {
      className: 'woAcc-FFONT9',
    },
    sylexiadSans: {
      className: 'woAcc-FFONT10',
    },
    eido: {
      className: 'woAcc-FFONT11',
    },
    luciole: {
      className: 'woAcc-FFONT12',
    },
    andika: {
      className: 'woAcc-FFONT13',
    },
  },
  partialReader: {
    default: {
      className: '',
    },
    moderateSpeed: {
      className: 'woAcc-FPSR1',
    },
    fastReading: {
      className: 'woAcc-FPSR2',
    },
    slowReading: {
      className: 'woAcc-FPSR3',
    },
  },
  screenReader: {
    default: {
      className: '',
    },
    screenReader: {
      className: '',
    },
  },
  muteSounds: {
    default: {},
    muteSounds: {},
  },
  stopAnimation: {
    default: {
      className: '',
    },
    stopAnimation: {
      className: 'woAcc-FPA',
    },
  },
  hideImages: {
    default: {
      className: '',
    },
    hideImages: {
      className: 'woAcc-FIH',
    },
  },
  displayInText: {
    default: {},
    displayInText: {},
  },
  textAlignment: {
    default: {},
    alignLeft: {},
    alignRight: {},
    centerAlign: {},
  },
  readingGuide: {
    default: {
      className: '',
    },
    readingGuide: {
      className: 'woAcc-FCUR3',
    },
    readingMask: { className: 'woAcc-FCUR2' },
    simpleRuler: {},
    rulerWithHighlighter: {},
  },
  readingMask: {
    default: {
      className: '',
    },
    readingMask: {
      className: 'woAcc-FCUR2',
    },
  },
  readingMode: {
    default: {
      className: '',
    },
    readingMode: {
      className: '',
    },
  },
  highlightTitles: {
    default: {
      className: '',
    },
    highlightTitles: {
      className: 'woAcc-FLHT1',
    },
  },
  linkHighlight: {
    default: {
      className: '',
    },
    linkHighlight: {
      className: 'woAcc-FLH1',
    },
  },
  textMagnifier: {
    default: {
      className: '',
    },
    textMagnifier: {
      className: '',
    },
  },
  highlightHover: {
    default: {
      className: '',
    },
    highlightHover: {
      className: '',
    },
  },
  highlightForm: {
    default: {
      className: '',
    },
    highlightForm: {
      className: 'woAcc-FLF1',
    },
  },
  bigBlackCursor: {
    default: {
      className: '',
    },
    bigBlackCursor: {
      className: 'woAcc-FCUR1-black',
    },
  },
  bigWhiteCursor: {
    default: {
      className: '',
    },
    bigWhiteCursor: {
      className: 'woAcc-FCUR1-white',
    },
  },
  pageStructure: {
    default: {},
    pageStructure: {},
  },
  toolTip: {
    default: {
      className: '',
    },
    toolTip: {},
  },
  imageDescription: {
    default: {
      className: '',
    },
    imageDescription: {
      className: '',
    },
  },
  virtualKeyboard: { default: {}, virtualKeyboard: {} },
  voiceNavigation: { default: {}, voiceNavigation: {} },
  furigana: { default: {}, furigana: {}, furiganaAdvance: {} },
  keyboardNavigation: { default: {}, keyboardNavigation: {} },
  keyboardShortcut: { default: {}, keyboardShortcut: {} },
  syllabicDivision: {
    default: {},
    separatorDash: {},
    separatorColor: {},
    separatorHighlight: {},
    separatorUnderline: {},
  },
  removeItalics: { default: {}, removeItalics: {} },
  removeUnderlines: { default: {}, removeUnderlines: {} },
  removeShadows: { default: {}, removeShadows: {} },
  cursorIcon: { default: {}, italic: {}, hand: {}, bigCursor: {} },
  lineHeight: {},
  adjustFontSizing: {},
  adjustLetterSpacing: {},
  adjustWordSpacing: {},
  adjustLineHeight: {},
  contentScale: {},
  adjustTitleColors: {},
  adjustTextColors: {},
  adjustBackgroundColors: {},
  headGestures: {
    default: {},
    headGestures: {},
  },
  signLanguage: {
    default: {},
    signLanguage: {},
  },
  toggleKeys: {
    default: {},
    toggleKeys: {},
  },
  filterKeys: {
    default: {},
    filterKeysSlow: {},
    filterKeysMid: {},
    filterKeysFast: {},
  },
  mouseKeys: {
    default: {},
    mouseKeys: {},
  },
  summarizer: {
    default: {},
    summarizer: {},
  },
};

const screenReaderSpeed = {
  default: 1,
  moderateSpeed: 1,
  fastReading: 1.5,
  slowReading: 0.5,
};

const screenReaderPrompts = {
  default: 'Speak normally like a screen reader.',
  moderateSpeed: 'Speak normally like a screen reader.',
  fastReading:
    'Speak extreamly fast like a screen reader. maintain the pitch to low.',
  slowReading:
    'Speak extreamly slow like a screen reader. maintain the pitch to low.',
};
let initialCSStyles;

function setInitialStyles() {
  initialCSStyles = `
  #woAcc-Modal h1,
  #woAcc-Modal h2,
  #woAcc-Modal h3,
  #woAcc-Modal h4,
  #woAcc-Modal h5 {
    font-weight: 700 !important;
  }
  .woAcc-RootEle {
    z-index: 1000000000;
    position: fixed !important;
    transform: none !important;
  }
  
  .woAcc-CA1 {
    filter: brightness(90%) sepia(10%) hue-rotate(-20deg) saturate(150%);
  }
  .woAcc-CA2 {
    filter: sepia(50%) hue-rotate(-10deg) saturate(60%) brightness(90%) contrast(80%);
  }
  .woAcc-CA3 {
    filter: invert(1);
  }
  
  .woAcc-FCONT1 {
    filter: contrast(135%) !important
  }
  body.woAcc-FCONT2 {
    background-color: #000 !important;
  }
  .woAcc-FCONT2 > :not(#woAcc-RootEle) :not(a):not(a *):not(:empty) {
    background-color: #000 !important;
    border-color: #fff !important;
    color: #50d0a0 !important;
  }
  .woAcc-FCONT2 > :not(#woAcc-RootEle) a:not(:empty) {
    background-color: #000 !important;
    border-color: #fff !important;
    color: #fcff3c !important;
  }
  .woAcc-FCONT2 > :not(#woAcc-RootEle) ::placeholder:not(:empty) {
    color: #fff !important;
  }
  .woAcc-FCONT2 ::before:not(:empty) {
    color: #50d0a0 !important;
  }
  .woAcc-FCONT3 ::before:not(:empty),
  .woAcc-SpeakWord {
    color: #000 !important;
  }
  .woAcc-FCONT2 > :not(#woAcc-RootEle) svg {
    fill: rgb(80, 208, 160) !important;
  }
  .woAcc-FCONT2 > :not(#woAcc-RootEle) a svg {
    fill: rgb(252, 255, 60) !important;
  }
  .woAcc-FCONT2 > :not(#woAcc-RootEle) a ::before:not(:empty),
  .woAcc-FCONT2 > :not(#woAcc-RootEle) a::before:not(:empty) {
    color: #fcff3c !important;
  }
  body.woAcc-FCONT3:not(:empty) {
    background-color: #fff !important;
  }
  .woAcc-FCONT3 > :not(#woAcc-RootEle) :not(a):not(a *):not(:empty) {
    background-color: #fff !important;
    border-color: #000 !important;
    color: #000 !important;
  }
  .woAcc-FCONT3 > :not(#woAcc-RootEle) a :not(:empty),
  .woAcc-FCONT3 > :not(#woAcc-RootEle) a:not(:empty) {
    background-color: #fff !important;
    border-color: #000 !important;
    color: #0000d3 !important;
  }
  .woAcc-FCONT3 > :not(#woAcc-RootEle) ::placeholder {
    color: #191919 !important;
  }
  .woAcc-FCONT3 > :not(#woAcc-RootEle) svg:not(:empty) {
    fill: rgb(0, 0, 0) !important;
  }
  .woAcc-FCONT3 > :not(#woAcc-RootEle) a svg:not(:empty) {
    fill: rgb(0, 0, 211) !important;
  }
  .woAcc-FCONT3 > :not(#woAcc-RootEle) a ::before:not(:empty),
  .woAcc-FCONT3 > :not(#woAcc-RootEle) a::before:not(:empty) {
    color: #0000d3 !important;
  }
  .woAcc-FSMCONT1 {
    filter: hue-rotate(15deg);
  }
  .woAcc-FLF1 > :not(#woAcc-RootEle) form {
    outline: 2px solid ${hexToRgba(
      visuals.highlight.highlightColor,
      visuals.highlight.highlightOpacity
    )} !important;
    outline-offset: ${Number(visuals.highlight.highlightSize) + 2}px !important;
  }
  .woAcc-FLH1 > :not(#woAcc-RootEle) a {
    outline: 2px solid ${hexToRgba(
      visuals.highlight.highlightColor,
      visuals.highlight.highlightOpacity
    )} !important;
    outline-offset: ${Number(visuals.highlight.highlightSize) + 2}px !important;
  }
  .woAcc-FLHT1 > :not(#woAcc-RootEle) h1,
  .woAcc-FLHT1 > :not(#woAcc-RootEle) h2,
  .woAcc-FLHT1 > :not(#woAcc-RootEle) h3,
  .woAcc-FLHT1 > :not(#woAcc-RootEle) h4,
  .woAcc-FLHT1 > :not(#woAcc-RootEle) h5,
  .woAcc-FLHT1 > :not(#woAcc-RootEle) h6 {
    outline: 2px solid ${hexToRgba(
      visuals.highlight.highlightColor,
      visuals.highlight.highlightOpacity
    )} !important;
    outline-offset: ${Number(visuals.highlight.highlightSize) + 2}px !important;
  }
  .woAcc-FLD1 > :not(#woAcc-RootEle) {
    zoom: 1.2;
  }
  .woAcc-FLD2 > :not(#woAcc-RootEle) {
    zoom: 1.3;
  }
  .woAcc-FLD3 > :not(#woAcc-RootEle) {
    zoom: 1.4;
  }
  .woAcc-FLD4 > :not(#woAcc-RootEle) {
    zoom: 1.5;
  }
  .woAcc-FTS1 > :not(#woAcc-RootEle) {
    word-spacing: 0.25em !important;
    letter-spacing: 0.25em !important;
  }
  .woAcc-FTS2 > :not(#woAcc-RootEle) {
    word-spacing: 0.5em !important;
    letter-spacing: 0.5em !important;
  }
  .woAcc-FTS3 > :not(#woAcc-RootEle) {
    word-spacing: 0.75em !important;
    letter-spacing: 0.75em !important;
  }
  .woAcc-FPA > :not(#woAcc-RootEle) *,
  .woAcc-FPA > :not(#woAcc-RootEle) :after,
  .woAcc-FPA > :not(#woAcc-RootEle) :before {
    transition: none !important;
    animation: none !important;
  }
  .woAcc-FIH > :not(#woAcc-RootEle):not(#guidy-custom-cursor) img,
  .woAcc-FIH > :not(#woAcc-RootEle):not(#guidy-custom-cursor) svg {
    visibility: hidden;
  }
  .woAcc-FIH :not(#woAcc-RootEle) > *,
  .woAcc-FIH :not(#woAcc-RootEle) > :after,
  .woAcc-FIH :not(#woAcc-RootEle) > :before,
  .woAcc-FITT :not(#woAcc-RootEle) > *,
  .woAcc-FITT :not(#woAcc-RootEle) > :after,
  .woAcc-FITT :not(#woAcc-RootEle) > :before {
    background-image: none !important;
  }
  .woAcc-FFONT1 > :not(#woAcc-RootEle),
  .woAcc-FFONT1 > :not(#woAcc-RootEle) * {
    font-family: Lexend, sans-serif !important;
  }
  .woAcc-FFONT2 > :not(#woAcc-RootEle),
  .woAcc-FFONT2 > :not(#woAcc-RootEle) * {
    font-family: "Noto Sans JP", sans-serif !important;
  }
  .woAcc-FFONT3 > :not(#woAcc-RootEle),
  .woAcc-FFONT3 > :not(#woAcc-RootEle) * {
    font-family: "Arial", sans-serif !important;
  }
  .woAcc-FFONT4 > :not(#woAcc-RootEle),
  .woAcc-FFONT4 > :not(#woAcc-RootEle) * {
    font-family: "Verdana", sans-serif !important;
  }
  .woAcc-FFONT5 > :not(#woAcc-RootEle),
  .woAcc-FFONT5 > :not(#woAcc-RootEle) * {
    font-family: "Georgia", serif !important;
  }
  .woAcc-FFONT6 > :not(#woAcc-RootEle),
  .woAcc-FFONT6 > :not(#woAcc-RootEle) * {
    font-family: "B612 Mono", monospace !important;
  }
  .woAcc-FFONT7 > :not(#woAcc-RootEle),
  .woAcc-FFONT7 > :not(#woAcc-RootEle) * {
    font-family: "Comic Sans MS", "Comic Sans", "Patrick Hand", sans-serif !important;
  }
  .woAcc-FFONT8 > :not(#woAcc-RootEle),
  .woAcc-FFONT8 > :not(#woAcc-RootEle) * {
    font-family: "Atkinson Hyperlegible", sans-serif !important;
  }
  .woAcc-FFONT9 > :not(#woAcc-RootEle),
  .woAcc-FFONT9 > :not(#woAcc-RootEle) * {
    font-family: "OpenDyslexic", sans-serif !important;
  }
  .woAcc-FFONT10 > :not(#woAcc-RootEle),
  .woAcc-FFONT10 > :not(#woAcc-RootEle) * {
    font-family: "Sylexiad Sans", sans-serif !important;
  }
  .woAcc-FFONT11 > :not(#woAcc-RootEle),
  .woAcc-FFONT11 > :not(#woAcc-RootEle) * {
    font-family: "Eido", sans-serif !important;
  }
  .woAcc-FFONT12 > :not(#woAcc-RootEle),
  .woAcc-FFONT12 > :not(#woAcc-RootEle) * {
    font-family: "Luciole", sans-serif !important;
  }
  .woAcc-FFONT13 > :not(#woAcc-RootEle),
  .woAcc-FFONT13 > :not(#woAcc-RootEle) * {
    font-family: "Andika", sans-serif !important;
  }
  .woAcc-FCUR1-black,
  .woAcc-FCUR1-black *,
  .woAcc-FCUR1-black [type="submit"],
  .woAcc-FCUR1-black a {
    cursor: url(${staticPath}images/big-black-cursor.svg) 0 0, auto !important;
  }
  .woAcc-FCUR1-white,
  .woAcc-FCUR1-white *,
  .woAcc-FCUR1-white [type="submit"],
  .woAcc-FCUR1-white a {
    cursor: url(${staticPath}images/big-white-cursor.svg) 0 0, auto !important;
  }
  .woAcc-FCURSOR-custom,
  .woAcc-FCURSOR-custom *,
  .woAcc-FCURSOR-custom [type="submit"],
  .woAcc-FCURSOR-custom a,
  .woAcc-FCURSOR-custom button {
    cursor: var(--woAcc-custom-cursor-url) !important;
  }
  
  .woAcc-FS1 {
    filter: saturate(0.5) !important;
  }
  .woAcc-FS2 {
    filter: saturate(3) !important;
  }
  .woAcc-FS3 {
    filter: saturate(0) !important;
  }
  .woAcc-FS1.woAcc-FCONT1 {
    filter: saturate(0.5) invert(1) !important;
  }
  .woAcc-FS2.woAcc-FCONT1 {
    filter: saturate(3) invert(1) !important;
  }
  .woAcc-FS3.woAcc-FCONT1 {
    filter: saturate(0) invert(1) !important;
  }
  .woAcc-FSMCONT1.woAcc-FCONT1 {
    filter: hue-rotate(15deg) invert(1) !important;
  }
  .woAcc-FSMCONT1.woAcc-FS1 {
    filter: hue-rotate(15deg) saturate(0.5) !important;
  }
  .woAcc-FSMCONT1.woAcc-FS2 {
    filter: hue-rotate(15deg) saturate(3) !important;
  }
  .woAcc-FSMCONT1.woAcc-FS3 {
    filter: hue-rotate(15deg) saturate(0) !important;
  }
  .woAcc-FSMCONT1.woAcc-FCONT1.woAcc-FS1 {
    filter: hue-rotate(15deg) invert(1) saturate(0.5) !important;
  }
  .woAcc-FSMCONT1.woAcc-FCONT1.woAcc-FS2 {
    filter: hue-rotate(15deg) invert(1) saturate(3) !important;
  }
  .woAcc-FSMCONT1.woAcc-FCONT1.woAcc-FS3 {
    filter: hue-rotate(15deg) invert(1) saturate(0) !important;
  }
  .woAcc-FCUR3 .woAcc-cursor3Contain {
    box-sizing: border-box;
    background: ${hexToRgba('#000000', visuals.guide.guideOpacity)};
    width: calc(40vw + ${
      (visuals.guide.guideSize === 'default'
        ? 0
        : visuals.guide.guideSize - 1) * 100
    }px);
    position: fixed;
    height: 12px;
    border: 3px solid ${hexToRgba(
      visuals.guide.guideColor !== '#0000FF'
        ? visuals.guide.guideColor
        : visuals.guide.readingGuideDefault,
      visuals.guide.guideOpacity
    )};
    border-radius: 5px;
    top: 20px;
    z-index: 2147483647;
    transform: translateX(-50%);
    pointer-events: none;
  }
  .woAcc-FCUR3 .woAcc-cursor3Contain .readingGuide::after,
  .woAcc-FCUR3 .woAcc-cursor3Contain .readingGuide::before {
    content: "";
    bottom: 100%;
    left: 50%;
    border: solid transparent;
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }
  .woAcc-FCUR3 .woAcc-cursor3Contain .readingGuide::before {
    border-bottom-color: ${hexToRgba(
      visuals.guide.guideColor !== '#0000FF'
        ? visuals.guide.guideColor
        : visuals.guide.readingGuideDefault,
      visuals.guide.guideOpacity
    )};
    border-width: 15px;
    margin-left: -15px;
  }
  .woAcc-FCUR3 .woAcc-cursor3Contain .readingGuide::after {
    border-bottom-color: ${hexToRgba('#000000', visuals.guide.guideOpacity)};
    border-width: 10px;
    margin-left: -10px;
  }
  [data--woAccessibility--img--to--text] {
    display: none !important;
  }
  #woAcc-Modal {
    font-size: 0.875rem;
  }
  #woAcc-Modal a,
  #woAcc-Modal button,
  #woAcc-Modal h1,
  #woAcc-Modal h2,
  #woAcc-Modal h3,
  #woAcc-Modal h4,
  #woAcc-Modal h5,
  #woAcc-Modal h6,
  #woAcc-Modal p {
    margin: 0.5em 0 !important;
  }
  #woAcc-Modal h1 {
    font-style: normal !important;
    font-size: 1.4rem !important;
    line-height: 33.6px !important;
  }
  #woAcc-Modal h2 {
    font-style: bold !important;
    font-size: 1.3125rem !important;
    line-height: 31.5px !important;
  }
  #woAcc-Modal h3,
  #woAcc-Modal h4,
  #woAcc-Modal h5,
  #woAcc-Modal h6 {
    font-style: normal !important;
  }
  #woAcc-Modal ul {
    margin: 1em 0 !important;
  }
  #woAcc-Modal a:-webkit-any-link {
    color: -webkit-link;
    cursor: pointer;
    text-decoration: underline;
  }
  #woAcc-Modal h3 {
    font-size: 1.225rem !important;
  }
  #woAcc-Modal h4 {
    font-size: 1.1375rem !important;
  }
  #woAcc-Modal h5 {
    font-size: 1.05rem !important;
  }
  #woAcc-Modal h6 {
    font-weight: 500 !important;
    font-size: 0.9625rem !important;
  }
  #woAcc-Modal code,
  #woAcc-Modal menu,
  #woAcc-Modal ol,
  #woAcc-Modal ul {
    border-radius: 8px;
    background: #f4f4f4;
    padding: 1.5em 4rem;
    margin: 1em 0;
    font-size: 0.875rem;
  }
  .woAcc-SpeakWord {
    background: #ff0 !important;
    border-color: #000 !important;
  }
  #woAccessibilityRootEle #woAcc-PageStructure li[data-hover="true"] {
    border-radius: 10px;
    list-style-type: none;
    font-size: 14px;
    padding: 10px;
    cursor: pointer;
    color:black;
  }
  #woAccessibilityRootEle #woAcc-PageStructure li[data-hover="true"]:hover {
    background-color: #eee;
  }
  
  .woAcc-no-italic * {
    font-style: normal !important;
  }
  
  .woAcc-no-underline * {
    border-bottom: none !important;
    text-decoration: none !important;
  }
  
  .woAcc-no-shadows * {
    box-shadow: none !important;
    text-shadow: none !important;
  }

  .woAcc-ruler {
    position: fixed;
    height: calc(15vh + ${
      (visuals.guide.guideSize === 'default'
        ? 0
        : visuals.guide.guideSize - 1) * 10
    }px);
    width: 100vw;
    left: 0px;
    background: ${hexToRgba(visuals.guide.guideColor === '#0000FF' ? '#f9d040' : visuals.guide.guideColor, visuals.guide.guideOpacity)};
    box-sizing: content-box;
    z-index: 2147483647;
  }

  .woAcc-rulerHighlighter {
    background: ${hexToRgba('#000000', visuals.guide.guideOpacity)};
  }

  .woAcc-rulerHighlighter::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 100%;
    width: 100%;
    border-top: 5vh solid ${hexToRgba(
      visuals.guide.guideColor !== '#0000FF'
        ? visuals.guide.guideColor
        : visuals.guide.readingGuideDefault,
      0.5
    )};
    box-sizing: border-box;
  }
  
  .woAcc-floatingButton {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    border-radius: 500px;
    background: #00000080;
    position: fixed;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
  }
  
  .woAcc-menuButton {
    transition: all 0.2s;
    border-radius:50%;
    padding: 0;
    border: none;
  }
  
  .woAcc-menuButton:hover {
    transform: scale(1.2);
  }
  
  .woAcc-menuButton img {
    height: 70%;
  }
  
  .woAcc-shortCutsInfo {
  font-family: "Open Sans", sans-serif;
    display: none;
    height: 452px;
    background: #1E293BF2;
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 130px;
    width: 50%;
    max-width: 470px;
    border-radius: 20px;
    padding: 20px;
    color:white !important;
  }
  
  .woAcc-shortCutsInfo-header {
    color: white;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .woAcc-shortCutsInfo-header h4 {
    margin-bottom: 0px;
    font-weight: 700;
    font-size: 16px;
    line-height: 21.79px;
  }
  
  .woAcc-shortCutsInfo-content {
    height: calc(100% - 60px);
    color: white;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: #4b5d73 transparent;
  }

  .woAcc-shortCutsInfo-content h5 {
    font-size: 14px;
    font-weight: 600;
    line-height: 19.07px;
    width: 100%;
    color: white !important;
  }

  .woAcc-shortCutsInfo-shortcut {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .woAcc-shortCutsInfo-shortcut-wrapper {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 15px;
    background-color: #00000040;
    padding: 5px 8px;
    width: 100%;
    border-radius: 5px;
  }

  .woAcc-shortCutsInfo-shortcut-wrapper h5 {
    font-size: 13px;
    font-weight: 400;
    line-height: 17.7px;
    text-align: left;
  }

  .woAcc-button {
    border: none;
    border-radius: 15px;
    text-overflow: ellipsis;
    background: transparent;
    outline: none;
  }
  .woAcc-button svg {
    pointer-events: none;
  }

  .woAcc-shortCutsInfo-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .woAcc-shortCutsInfo-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .woAcc-shortCutsInfo-content::-webkit-scrollbar-thumb {
    background: #4b5d73;
    border-radius: 999px;
    border: 2px solid #1E293A;
  }

  .woAcc-shortCutsInfo-content::-webkit-scrollbar-thumb:hover {
    background: #1593EF;
  }

  .woAcc-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #4b5d73 transparent;
  }

  .woAcc-modal-scroll::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .woAcc-modal-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .woAcc-modal-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #4b5d73 0%, #314154 100%);
    border-radius: 999px;
    border: 2px solid #1E293A;
  }

  .woAcc-modal-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #5d728d 0%, #1593EF 100%);
  }
  
  @media screen and (max-width: 1024px) {
    .woAcc-shortCutsInfo {
      width: 70%;
    }
  }
  
  @media screen and (max-width: 768px) {
    .woAcc-shortCutsInfo {
      width: 100%;
    }

    .guidy-moveWidgetDiv {
      display: none !important;
    }
  }

  .woAcc-syllabic-hover:hover {
    background: #FFFDD0;
  }

  .guidy-moveWidgetDiv {
    display: none;
    z-index: 1000000000001;
    position: fixed;
    width: 390px;
    max-width: 480px;
    height: 70px;
    top: 0px;
    right: 100px;
    background: transparent;
    cursor: ew-resize;
  }
  .guidy-focused {
    border-color: #0038ff !important;
    outline: 2.5px solid #0038ff !important;
    outline-offset: 2.5px !important;
    box-shadow: 0 0 0 8px rgba(0, 56, 255, 0.42) !important;
  }

  .guidy-summary-tooltip {
    display: none;
    position: absolute;
    transition: all 0.1s ease-in-out;
    font-size: 17px;
    line-height: normal;
    max-width: 35%;
    box-sizing: border-box;
    border: 2px solid rgb(255, 255, 255);
    background: rgb(52, 57, 77);
    color: rgb(255, 255, 255);
    font-weight: 600;
    border-radius: 10px;
    text-align: left;
    padding: 13px 18px;
    box-shadow: rgba(66, 73, 96, 0.4) 0px 0px 15px;
    height: auto;
    white-space: pre-wrap;
    word-break: break-word;
    z-index: 2147483647;
    min-width: 150px;
  }

  .container{
    padding : 0 2px;
  }
  .syllable {
        display: inline;
  }
  .color1 {
    color: red;
  }
  .color2 {
    color: blue;
  }
  .bg1{
    background-color : skyblue;
  }
  .bg2{
    background-color : pink;
  }

  .syllabicUnderline {
      position: relative;
    }
    
  .syllabicUnderline:after {
      content: "";
      position: absolute;
      bottom: -5px;
      left: 0;
      height: 70px;
      width: 100%;
      border: solid 2px #cb1829;
      border-color: #cb1829 transparent transparent transparent;
      border-radius: 15px;
      transform: rotate(180deg);
    }
  
  @font-face {
    font-family: 'B612 Mono';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/b612mono/v14/kmK_Zq85QVWbN1eW6lJV0A7d.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  
  @font-face {
    font-family: 'Patrick Hand';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/patrickhand/v23/LDI1apSQOAYtSuYWp8ZhfYe8UcLLq7s.woff2) format('woff2');
    unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
  }

  @font-face {
    font-family: 'Patrick Hand';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/patrickhand/v23/LDI1apSQOAYtSuYWp8ZhfYe8UMLLq7s.woff2) format('woff2');
    unicode-range: U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }

  @font-face {
    font-family: 'Patrick Hand';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/patrickhand/v23/LDI1apSQOAYtSuYWp8ZhfYe8XsLL.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
    
  @font-face {
    font-family: 'Atkinson Hyperlegible';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/atkinsonhyperlegible/v11/9Bt23C1KxNDXMspQ1lPyU89-1h6ONRlW45G07JIoSwQ.woff2) format('woff2');
    unicode-range: U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }

  @font-face {
    font-family: 'Atkinson Hyperlegible';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/atkinsonhyperlegible/v11/9Bt23C1KxNDXMspQ1lPyU89-1h6ONRlW45G04pIo.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  
  @font-face {
    font-family: 'Andika';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/andika/v25/mem_Ya6iyW-LwqgwZ7YQarw.woff2) format('woff2');
    unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
  }

  @font-face {
    font-family: 'Andika';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/andika/v25/mem_Ya6iyW-LwqgwbrYQarw.woff2) format('woff2');
    unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
  }

  @font-face {
    font-family: 'Andika';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/andika/v25/mem_Ya6iyW-LwqgwZbYQarw.woff2) format('woff2');
    unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
  }

  @font-face {
    font-family: 'Andika';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/andika/v25/mem_Ya6iyW-LwqgwZLYQarw.woff2) format('woff2');
    unicode-range: U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }

  @font-face {
    font-family: 'Andika';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/andika/v25/mem_Ya6iyW-LwqgwarYQ.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  
  @font-face {
    font-family: 'Luciole';
    font-style: normal;
    font-weight: 400;
    src: url(${staticPath}fonts/Luciole.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

  @font-face {
    font-family: 'OpenDyslexic';
    font-style: normal;
    font-weight: 400;
    src: url(${staticPath}fonts/OpenDyslexic.otf) format('opentype');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  @font-face {
    font-family: 'Sylexiad Sans';
    font-style: normal;
    font-weight: 400;
    src: url(${staticPath}fonts/SylexiadSansMedium.otf) format('opentype');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  @font-face {
    font-family: 'Eido';
    font-style: normal;
    font-weight: 400;
    src: url(${staticPath}fonts/eido.otf) format('opentype');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  .woAcc-shortCutsDivWrapper {
  }

  .woAcc-shortCutsDivWrapper-child {
    display: flex;
    flex-direction: column;
    width: 270px;
    position: fixed;
    left: 50%;
    bottom: 130px;
    color: #ffffff;
    padding: 20px;
    background: #1E293BF2;
    z-index: 250;
    transform: translateX(-50%);
    border-radius: 20px;
    gap: 10px;
  }

  .woAcc-shortCutsDiv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  }
    
  .woAcc-shortCutsDiv {
    width: 100%;
    display: flex;
    gap: 10px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .woAcc-shortcutKey {
    width: fit-content;
    height: 30px;
    padding: 5px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: 6px;
    opacity: 0px;
    background: #1593EF;
  }

  .woAcc-shortcutDesc{
    text-align: end;
  }

  .guidy-headGesture-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    border-radius: 12px;
  }

  .guidy-headGesture-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    border-radius: 12px;
  }

  .guidy-headGesture-hide {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 4;
    border: 2px solid #00499e;
    background: white;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: black;
  }

  .guidy-headGesture-wrapper {
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 400px;
    height: 300px;
    z-index: 2147483644;
  }

  .guidy-headGesture-error {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border: 2px solid #ef4444;
    border-radius: 12px;
    padding: 20px;
    box-sizing: border-box;
    text-align: center;
    color: #991b1b;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    z-index: 3;
  }

  .guidy-headGesture-error svg {
    color: #dc2626;
    width: 48px;
    height: 48px;
  }

  .guidy-headGesture-error span {
    font-weight: 500;
  }

  .guidy-custom-cursor-wrapper {
    position: absolute;
    z-index: 21474836479;
    top: 500px;
    left: 900px;
    width: 5px;
    height: 5px;
  }
  
  @media screen and (max-width: 450px) {
    .guidy-headGesture-wrapper {
      width: 250px;
      height: 188px;
    }
  }
  .guidy-custom-cursor-icon {
    box-shadow: rgb(38, 57, 77) 0px 20px 30px -10px;
  }
  
  .guidy-custom-cursor-icon svg {
    filter: drop-shadow(0px 1px 2px #00000080);
  }

  `;
}

let isIframeLoaded = false;

const virtualKeyboardStyles = `
#woAcc-guidykeyboard {
  display: none;
  position: fixed;
  bottom: 130px;
  width: 80%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999999999;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  background: #1E293A;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.guidy-theme-default {
  background: #1E293A;
  border-radius: 16px;
  box-sizing: border-box;
  font-family: HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;
  overflow: hidden;
  padding: 10px;
  touch-action: manipulation;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  width: 100%
}

.guidy-theme-default .guidy-button span {
  pointer-events: none
}

.guidy-theme-default button.guidy-button {
  border-width: 0;
  font-size: inherit;
  outline: 0
}

.guidy-theme-default .guidy-button {
  display: inline-block;
  flex-grow: 1
}

.guidy-theme-default .guidy-row {
  display: flex
}

.guidy-theme-default .guidy-row:not(:last-child) {
  margin-bottom: 6px
}

.guidy-theme-default .guidy-row .guidy-button-container,.guidy-theme-default .guidy-row .guidy-button:not(:last-child) {
  margin-right: 6px
}

.guidy-theme-default .guidy-row>div:last-child {
  margin-right: 0
}

.guidy-theme-default .guidy-row .guidy-button-container {
  display: flex
}

.guidy-theme-default .guidy-button {
  align-items: center;
  background: linear-gradient(180deg, #29384c 0%, #212f42 100%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-bottom: 1px solid rgba(0, 0, 0, 0.45);
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 2px 10px rgba(0, 0, 0, 0.22);
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  height: 40px;
  justify-content: center;
  padding: 5px;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
  color: #f8fafc;
  transition:
    transform 0.12s ease,
    background-color 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}

.guidy-theme-default .guidy-button:hover {
  background: linear-gradient(180deg, #314154 0%, #273649 100%);
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.26);
  transform: translateY(-1px);
}

.guidy-theme-default .guidy-button.guidy-standardBtn {
  width: -1px
}

.guidy-theme-default .guidy-button.guidy-activeButton {
  background: linear-gradient(180deg, #314154 0%, #1E293A 100%);
  border-color: rgba(255, 255, 255, 0.26);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.guidy-theme-default.hg-layout-numeric .guidy-button {
  align-items: center;
  display: flex;
  height: 60px;
  justify-content: center;
  width: 33.3%
}

.guidy-theme-default .guidy-button.guidy-button-numpadadd,.guidy-theme-default .guidy-button.guidy-button-numpadenter {
  height: 85px
}

.guidy-theme-default .guidy-button.guidy-button-numpad0 {
  width: 105px
}

.guidy-theme-default .guidy-button.guidy-button-com {
  max-width: 85px
}

.guidy-theme-default .guidy-button.guidy-standardBtn.guidy-button-at {
  max-width: 45px
}

.guidy-theme-default .guidy-button.hg-selectedButton {
  background: linear-gradient(180deg, #304256 0%, #1E293A 100%);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff
}

.guidy-theme-default .guidy-button.guidy-standardBtn[data-skbtn=".com"] {
  max-width: 82px
}

.guidy-theme-default .guidy-button.guidy-standardBtn[data-skbtn="@"] {
  max-width: 60px
}

.guidy-candidate-box {
  background: #1E293A;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-bottom: 2px solid rgba(0, 0, 0, 0.34);
  border-radius: 10px;
  display: inline-flex;
  margin-top: -10px;
  position: absolute;
  transform: translateY(-100%);
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none
}

ul.guidy-candidate-box-list {
  display: flex;
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 0
}

li.guidy-candidate-box-list-item {
  align-items: center;
  display: flex;
  height: 40px;
  justify-content: center;
  width: 40px
}

li.guidy-candidate-box-list-item:hover {
  background: #273649;
  cursor: pointer
}

li.guidy-candidate-box-list-item:active {
  background: #314154
}

.guidy-candidate-box-prev:before {
  content: "◄"
}

.guidy-candidate-box-next:before {
  content: "►"
}

.guidy-candidate-box-next,.guidy-candidate-box-prev {
  align-items: center;
  color: #d9e2ec;
  cursor: pointer;
  display: flex;
  padding: 0 10px
}

.guidy-candidate-box-next {
  border-bottom-right-radius: 5px;
  border-top-right-radius: 5px
}

.guidy-candidate-box-prev {
  border-bottom-left-radius: 5px;
  border-top-left-radius: 5px
}

.guidy-candidate-box-btn-active {
  color: #ffffff
}

@media screen and (max-width: 450px) {
  #woAcc-guidykeyboard {
    width: 100%;
  }
}
`;

const voiceNavigationStyles = `
  .woAcc-voice-navigation * {
    box-sizing: border-box !important;
  }
  .woAcc-voice-navigation {
    color: white;
    display: none;
    width: 50%;
    position: fixed;
    bottom: 130px;
    max-width: 605px;
    left: 50%;
    transform: translate(-50%);
    z-index: 10001;
    letter-spacing: normal;
    border: none;
  }
    
    .woAcc-voice-navigation-header {
      font-family: "Open Sans", sans-serif;
      padding: 15px 20px;
      background-color: #1E293B;
      display: flex;
      align-items: center;
      border-radius: 20px;
      min-height: 80px;
      height: auto;
      width: 100%;
    }

  .woAcc-voice-navigation-button-wrapper {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .woAcc-voice-navigation-actions-wrapper {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 20px;
    padding-left: 10px;
  }

  .woAcc-voice-navigation-header-actions {
    width: 25%;
  }

  .woAcc-voice-navigation-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 45px;
    border-radius: 50%;
    width: 45px;
    background-color: #fff; 
    position: relative;
    border: none;
    padding: 0;
    flex-shrink: 0;
  }

  .woAcc-voice-navigation-btn.active {
    animation: pulse 1s infinite;
  }

  .woAcc-voice-navigation-info-btn.active {
    animation: none;
    background: #1593EF;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.2);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(255, 255, 255, 0.5);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 1);
    }
  }

  .woAcc-voice-navigation-text {
    color: white;
    font-size: 20px;
    text-transform: capitalize;
    overflow-wrap: break-word;
    word-break: break-all;
    flex: 1;
    min-width: 0;
    line-height: 1.2;
  }

  .woAcc-commands {
    height: 0px;
    background: #1E293BF2;
    transition: height 0.5s ease-in-out, padding 0.5s ease-in-out;
    border-radius: 20px;
    font-family: "Open Sans", sans-serif;
    margin-bottom: 30px;
  }

  .woAcc-expanded {
    padding: 20px;
    height: 400px !important;
  }

  .woAcc-commands-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #4b5d73 transparent;
  }

    .woAcc-commands-wrapper h6 {
      font-size: 14px;
      font-weight: 600;
      line-height: 19.07px;
    }

  .woAcc-commands-wrapper::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .woAcc-commands-wrapper::-webkit-scrollbar-track {
    background: transparent;
  }

  .woAcc-commands-wrapper::-webkit-scrollbar-thumb {
    background: #4b5d73;
    border-radius: 999px;
    border: 2px solid #1E293A;
  }

  .woAcc-commands-wrapper::-webkit-scrollbar-thumb:hover {
    background: #1593EF;
  }

  .woAcc-commands-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 0;
    padding-top: 10px;
    box-sizing: border-box
  }

  .woAcc-command {
    border: 1px solid #0076FF;
    padding: 5px 10px;
    border-radius: 6px;
    color: #FFFFFF ;
    font-size: 14px;
    font-weight: 600;
    line-height: 19.07px;
  }

  @media screen and (max-width: 1024px) {
    .woAcc-voice-navigation {
      width: 70%;
    }
  }

  @media screen and (max-width: 768px) {
    .woAcc-voice-navigation {
      width: 100%;
    }
  }

  @media screen and (max-width: 425px) {
    .woAcc-voice-navigation-header {
      padding: 0 10px;
    }
    .woAcc-voice-navigation-button-wrapper {
      gap: 10px;
    }
    .woAcc-voice-navigation-text {
      font-size: 16px;
    }
    .woAcc-voice-navigation-actions-wrapper {
      gap: 5px;
    }
    .woAcc-voice-navigation-text {
    font-size: 14px;
  }
  }
`;

let tooltipMouseOverListener = [];
let textMagnifierListener = [];
let furiganaListener = [];
let highLightHoverListener = [];
let imageDescriptionListener = [];
let tempListeners = [];

let highlightHoverTag = new Set([]);
let readingMask;
let readingGuide;
let simpleRuler;
const mouseMoveListeners = [];
const iframe = document.createElement('iframe');
iframe.style.zIndex = '100001';

const lineHeight = {
  lineHeight1: 1.5,
  lineHeight2: 1.75,
  lineHeight3: 2,
};
const textAlignment = {
  alignLeft: { text: 'left', div: 'left' },
  alignRight: { text: 'right', div: 'right' },
  centerAlign: { text: 'center', div: 'center' },
  justify: { text: 'justify', div: 'center' },
  default: { text: null, div: null },
};

let observer;

(function () {
  let throttleTimeout = null;

  // Throttled version of onNavigationChange with a 500ms delay
  const throttledOnNavigationChange = () => {
    if (throttleTimeout) return;

    throttleTimeout = setTimeout(() => {
      console.log('Navigation changed and DOM is fully updated');
      // Add your logic here

      handlePageChange();

      // Clear the throttle timeout
      throttleTimeout = null;
    }, 2 * 100); // 500ms throttle
  };

  // Observe DOM changes
  const observeDOMChanges = () => {
    observer?.disconnect?.();
    observer = new MutationObserver(() => {
      throttledOnNavigationChange();
    });

    // Observe the entire body for changes
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // Detect navigation changes by overriding history methods and using popstate
  const detectNavigationChange = () => {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override pushState to detect route changes
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      throttledOnNavigationChange(); // Route changed
      observeDOMChanges(); // Start observing DOM changes after route change
    };

    // Override replaceState to detect route changes
    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      throttledOnNavigationChange(); // Route changed
      observeDOMChanges(); // Start observing DOM changes after route change
    };

    // Listen to the back/forward navigation events
    window.addEventListener('popstate', () => {
      throttledOnNavigationChange(); // Route changed
      observeDOMChanges(); // Start observing DOM changes after route change
    });
  };

  // Start listening for navigation changes
  detectNavigationChange();
})();

function handlePageChange() {
  sendPostMessage('pageChange', {
    site: window.location.href,
  });
  sendPageViewsEvent(window.location.href);
  imageAltData = null;
  setAiGeneratedImageAlt();
  hoverStyles = getAllHoverStyles();
  elements = {};
  Object.entries(menuOptionsToRefresh).forEach(([key, value]) => {
    changeClassName(key, 'default');
    if (value !== false) {
      changeClassName(key, value);
      if (key === 'displayInText') {
        handleDisplayInTextOnPageChange(key, value);
      }
    }
  });

  observer.disconnect();
  lazyLoadTranslationObserver.disconnect();
  lazyLoadTranslationObserver = undefined;
  saveTextNodeValues([document.body]);
  translateDOMContent();
  if (isFuriganaInitialized) {
    handleAdvanceFurigana();
  }
  observeLazyLoadedContent();
}

let old;

function handleDisplayInTextOnPageChange(key, value) {
  if (old) {
    clearTimeout(old);
  }

  old = setTimeout(() => {
    if (menuOptionsToRefresh[key] !== false) {
      changeClassName(key, value);
    }
  }, 3 * 1000);
}

// window.addEventListener("popstate", handlePageChange);

// window.addEventListener("hashchange", handlePageChange);

// const originalPushState = history.pushState;
// const originalReplaceState = history.replaceState;

// history.pushState = function (...args) {
//   originalPushState.apply(history, args);
//   handlePageChange();
// };

// history.replaceState = function (...args) {
//   originalReplaceState.apply(history, args);
//   handlePageChange();
// };

function addTooltipStyle(element) {
  element.style.position = 'absolute';
  element.style.transition = 'opacity 0.1s ease-in-out';
  element.style.fontSize = '17px';
  element.style.lineHeight = 'normal';
  element.style.maxWidth = '35%';
  element.style.boxSizing = 'border-box';
  element.style.border = 'solid 2px #fff';
  element.style.background = '#34394d';
  element.style.color = '#fff';
  element.style.fontWeight = 600;
  element.style.borderRadius = '10px';
  element.style.textAlign = 'left';
  element.style.padding = '13px 18px';
  element.style.boxShadow = '0 0 15px rgba(66, 73, 96, 0.4)';
  element.style.height = 'auto';
  element.style.whiteSpace = 'pre-wrap';
  element.style.wordBreak = 'break-word';
  element.style.zIndex = 2147483647;
  element.style.minWidth = '150px';
}

let convertedStrings = {};

const textSelectFuriganaTooltip = async () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    const abortController = new AbortController();
    // const signal = abortController.signal;
    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    furiganaTooltip.style.left = `${rect.left + window.scrollX}px`;
    furiganaTooltip.style.top = `${rect.bottom + window.scrollY}px`;
    furiganaTooltip.style.display = 'block';
    furiganaTooltip.textContent = `${getTranslations('Loading')}...`;
    if (convertedStrings[selectedText]) {
      furiganaTooltip.textContent = convertedStrings[selectedText];
    } else {
      // getHiragana(selectedText, signal).then((converted) => {
      //   furiganaTooltip.textContent = converted;
      //   convertedStrings[selectedText] = converted;
      // });
      callGuidyDashboard({
        path: 'convert-to-hiragana',
        body: { words: selectedText },
      }).then((converted) => {
        if (!(converted instanceof Error)) {
          furiganaTooltip.textContent = converted;
          convertedStrings[selectedText] = converted;
        }
      });
    }
    const removeTooltip = () => {
      furiganaTooltip.style.display = 'none';
      abortController.abort();
      document.removeEventListener('mousedown', removeTooltip);
    };
    document.addEventListener('mousedown', removeTooltip);
  }
};

/**
 *
 * @param {String} furiganaNode String like innterHTML of furigana
 * @param {Node} oldNode Node to be replaced
 * @returns {Node} Replaced node
 */
function replaceFuriagana(furiganaNode, oldNode) {
  const tempFragment = document
    .createRange()
    .createContextualFragment(furiganaNode);
  oldNode.parentNode.isFuriganaProcessed = true;
  return oldNode.parentNode.replaceChild(tempFragment, oldNode);
}

async function convertToFurigana(target) {
  const textNodes = elementsUnder(target, {
    images: false,
    inputs: false,
    isRuby: true,
  });
  if (!textNodes.length) return;
  let payload = {},
    nodes = {};
  for (let { node: element, type } of textNodes) {
    let textContent = element.guidyOriginalText;
    if (textContent?.trim?.()) {
      let nodeId = await generateID(`${textContent + type}`);
      if (nodes[nodeId]) {
        nodes[nodeId].nodes.push(element);
        continue;
      }
      (payload[nodeId] = textContent),
        (nodes[nodeId] = {
          text: textContent,
          nodes: [element],
          type,
        });
    }
  }
  try {
    const furiganaResponse = await callGuidyDashboard({
      path: 'convert-to-furigana',
      body: payload,
    });
    for (let node in nodes) {
      let furiganaNode = furiganaResponse[node],
        currentNodes = nodes[node];
      switch (currentNodes.type) {
        case 'text':
          furiganaNode &&
            currentNodes &&
            currentNodes.nodes.forEach((n) =>
              replaceFuriagana(furiganaNode, n)
            );
          break;
        default:
          break;
      }
    }
  } catch (error) {
    console.warn(error);
  }
}

function handleAdvanceFurigana() {
  convertToFurigana([document.body]);
}

function handleAdvanceFuriganaBucket(node) {
  furiganaBucket.push(node);

  if (furiganaBatchTimeout) {
    clearTimeout(furiganaBatchTimeout);
  }
  furiganaBatchTimeout = setTimeout(() => {
    if (furiganaBucket.length > 0) {
      convertToFurigana(furiganaBucket);
      furiganaBucket = [];
    }
  }, 1000);
}

function handleFurigana(newKey) {
  addTooltipStyle(furiganaTooltip);
  if (newKey === 'default') {
    furiganaTooltip.style.display = 'none';
    furiganaTooltip.remove();
    furiganaListener.forEach(({ tag, eventName, event }) => {
      tag.removeEventListener(eventName, event);
    });
    furiganaListener.length = 0;
    isFuriganaInitialized = false;
  }

  if (newKey === 'furigana') {
    document.body.appendChild(furiganaTooltip);
    furiganaListener.push({
      eventName: 'mouseup',
      event: textSelectFuriganaTooltip,
      tag: document.body,
    });
    document.body.addEventListener('mouseup', textSelectFuriganaTooltip);
    isFuriganaInitialized = false;
  }

  if (newKey === 'furiganaAdvance') {
    furiganaTooltip.style.display = 'none';
    furiganaTooltip.remove();
    furiganaListener.forEach(({ tag, eventName, event }) => {
      tag.removeEventListener(eventName, event);
    });
    furiganaListener.length = 0;
    handleAdvanceFurigana();
    isFuriganaInitialized = true;
  }
}

function replaceTags(selector, newKey, fieldId) {
  if (newKey !== 'default') {
    setMenuOptionToRefresh(true, fieldId, newKey);
    const tags = document.querySelectorAll(selector);
    tags.forEach((tag) => {
      const divs = document.createElement('div');
      divs.innerHTML = tag.innerHTML;
      const attributes = Array.from(tag.attributes).filter(
        (attr) => attr.name !== selector
      );
      attributes.forEach((attr) => divs.setAttribute(attr.name, attr.value));
      divs.classList.add(`${selector}-replacement`);
      tag.parentNode.replaceChild(divs, tag);
    });
  } else {
    setMenuOptionToRefresh(false, fieldId);
    const divs = document.querySelectorAll(`.${selector}-replacement`);
    divs.forEach((div) => {
      const tags = document.createElement(selector);
      tags.innerHTML = div.innerHTML;
      const attributes = Array.from(div.attributes).filter(
        (attr) => attr.name !== 'class'
      );
      attributes.forEach((attr) => tags.setAttribute(attr.name, attr.value));
      div.parentNode.replaceChild(tags, div);
    });
  }
}

function handleStopAnimation(newKey, fieldId) {
  replaceTags('marquee', newKey, fieldId);
}

const shortCuts = {
  H: 'Headings',
  M: 'Menu',
  G: 'Graphics (Image)',
  B: 'Button',
  F: 'Form',
};

const shortCutDivId = 'woAcc-shortCutsDivWrapper';

function shortCutsInfo() {
  keyboardNavigation = document.createElement('div');
  const keyboardNavigationChild = document.createElement('div');
  keyboardNavigationChild.classList.add('woAcc-shortCutsDivWrapper-child');
  keyboardNavigation.appendChild(keyboardNavigationChild);
  keyboardNavigation.classList.add(shortCutDivId);
  // if (
  //   !window.woAccConfig?.buttonLocationDesktop?.position ||
  //   window.woAccConfig?.buttonLocationDesktop?.position === "bottom-right"
  // ) {
  //   mainDiv.style.left = "0px";
  // } else {
  //   mainDiv.style.right = "0px";
  // }

  const header = document.createElement('div');
  header.classList.add('woAcc-shortCutsDiv-header');
  const heading = document.createElement('div');
  header.appendChild(heading);
  header.style.paddingBottom = '5px';
  heading.setAttribute('data-translate', 'Guidy Shortcuts');
  heading.innerText = getTranslations('Guidy Shortcuts');
  const closeButton = document.createElement('div');
  closeButton.innerHTML = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.4375 4.06865C11.3797 4.01071 11.311 3.96474 11.2354 3.93338C11.1598 3.90201 11.0787 3.88587 10.9969 3.88587C10.915 3.88587 10.834 3.90201 10.7584 3.93338C10.6828 3.96474 10.6141 4.01071 10.5563 4.06865L7.50002 7.11865L4.44377 4.0624C4.3859 4.00453 4.31721 3.95863 4.24161 3.92732C4.166 3.896 4.08497 3.87988 4.00314 3.87988C3.92131 3.87988 3.84028 3.896 3.76468 3.92732C3.68908 3.95863 3.62038 4.00453 3.56252 4.0624C3.50465 4.12026 3.45875 4.18895 3.42744 4.26456C3.39612 4.34016 3.38 4.42119 3.38 4.50302C3.38 4.58485 3.39612 4.66588 3.42744 4.74149C3.45875 4.81709 3.50465 4.88578 3.56252 4.94365L6.61877 7.9999L3.56252 11.0561C3.50465 11.114 3.45875 11.1827 3.42744 11.2583C3.39612 11.3339 3.38 11.4149 3.38 11.4968C3.38 11.5786 3.39612 11.6596 3.42744 11.7352C3.45875 11.8108 3.50465 11.8795 3.56252 11.9374C3.62038 11.9953 3.68908 12.0412 3.76468 12.0725C3.84028 12.1038 3.92131 12.1199 4.00314 12.1199C4.08497 12.1199 4.166 12.1038 4.24161 12.0725C4.31721 12.0412 4.3859 11.9953 4.44377 11.9374L7.50002 8.88114L10.5563 11.9374C10.6141 11.9953 10.6828 12.0412 10.7584 12.0725C10.834 12.1038 10.9151 12.1199 10.9969 12.1199C11.0787 12.1199 11.1598 12.1038 11.2354 12.0725C11.311 12.0412 11.3797 11.9953 11.4375 11.9374C11.4954 11.8795 11.5413 11.8108 11.5726 11.7352C11.6039 11.6596 11.62 11.5786 11.62 11.4968C11.62 11.4149 11.6039 11.3339 11.5726 11.2583C11.5413 11.1827 11.4954 11.114 11.4375 11.0561L8.38127 7.9999L11.4375 4.94365C11.675 4.70615 11.675 4.30615 11.4375 4.06865Z" fill="white"/>
</svg>`;
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    const infoDiv = getElementReference('keyboardNavigation');
    if (infoDiv) {
      floatingButtonsChild['keyboardNavigation']?.innerHTML
        ? (floatingButtonsChild['keyboardNavigation'].innerHTML =
            floatingButtonsData['keyboardNavigation']?.icon)
        : null;
      floatingButtonsChild['keyboardNavigation']?.classList.remove('active');
      infoDiv.style.display = 'none';
    }
  };
  header.appendChild(closeButton);
  keyboardNavigationChild.appendChild(header);

  Object.keys(shortCuts).map((shortcut) => {
    const shortCutDiv = document.createElement('div');
    shortCutDiv.classList.add('woAcc-shortCutsDiv');
    // if (shortcut === shortCuts[shortcut]) {
    //   shortCutDiv.innerHTML += `<h4>${shortcut}</h4>`;
    // } else {
    shortCutDiv.innerHTML += `<div class="woAcc-shortcutKey">${shortcut}</div><div data-translate="${shortCuts[shortcut]}">${getTranslations(shortCuts[shortcut])}</div>`;
    // }
    keyboardNavigationChild.appendChild(shortCutDiv);
  });
  return keyboardNavigation;
}

function focusOnElement(element, flag = false) {
  document.body.classList.add('tabNavigation');
  let elementSelector;
  if (!elements[element]) {
    elements[element] = {};
    switch (element) {
      case 'headings':
        elementSelector =
          'h1:not(.woAcc-RootEle *), h2:not(.woAcc-RootEle *), h3:not(.woAcc-RootEle *), h4:not(.woAcc-RootEle *), h5:not(.woAcc-RootEle *), h6:not(.woAcc-RootEle *), [role="heading"]';
        break;
      case 'menu':
        elementSelector =
          'nav:not(.woAcc-RootEle *), [role="menu"]:not(.woAcc-RootEle *)';
        break;
      case 'form':
        elementSelector =
          'form:not(.woAcc-RootEle *), [role="form"]:not(.woAcc-RootEle *)';
        break;
      case 'button':
        elementSelector =
          'button:not(.woAcc-RootEle *), [role="button"]:not(.woAcc-RootEle *)';
        break;
      case 'graphic':
        elementSelector =
          'img:not(.woAcc-RootEle *), [role="button"]:not(.woAcc-RootEle *)';
        break;
      case 'focusableElements':
        elementSelector = selector;
        break;
    }
    elements[element].elements = Array.from(
      document.querySelectorAll(elementSelector)
    ).filter((ele) => !isNotVisible(ele));
  }
  let index = elements[element]?.currentIndex || 0;
  const currentElements = elements[element].elements;
  if (
    document.activeElement.nodeName.toLowerCase() === 'body' &&
    currentElements[0]
  ) {
    for (let i = 0; i < currentElements.length; i++) {
      const element = currentElements[i];
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      element.tabIndex = 0;
      element.focus();
      break;
    }
  } else {
    if (flag) {
      index = index - 1 < 0 ? currentElements.length - 1 : index - 1;
    } else {
      index = index + 1 === currentElements.length ? 0 : index + 1;
    }
    if (currentElements[index]) {
      currentElements[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      currentElements[index].tabIndex = 0;
      currentElements[index].focus();
    }
  }
  elements[element].currentIndex = index;
}

function focusOnLandmark(elementToFocus) {
  const elements = Array.from(
    document.querySelectorAll(
      `${elementToFocus}, [role="${elementToFocus}"], [class*="${elementToFocus}"]`
    )
  );
  if (elements.length) {
    for (const element of elements) {
      if (
        element &&
        (element.parentElement.tagName === 'HTML' ||
          element.parentElement.tagName === 'BODY') &&
        !isNotVisible(element)
      ) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        element.focus();
        return;
      }
    }
  }
  const element = document.querySelector(
    `${elementToFocus}, [role="${elementToFocus}"], [class*="${elementToFocus}"]`
  );
  if (element && !isNotVisible(element)) {
    element.setAttribute('tabindex', 0);
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    element.focus();
  }
}

function handleKeyDownKeyboardNavigation(event) {
  let elementToFocus;
  // note: need to get the event keys from full widget for future form sendPostMessage
  if (
    event.target.nodeName.toLowerCase() !== 'input' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    const flag = event.shiftKey;
    switch (event.code) {
      case 'KeyH':
        elementToFocus = 'headings';
        break;
      case 'KeyM':
        elementToFocus = 'menu';
        break;
      case 'KeyF':
        elementToFocus = 'form';
        break;
      case 'KeyB':
        elementToFocus = 'button';
        break;
      case 'KeyG':
        elementToFocus = 'graphic';
        break;
    }
    if (elementToFocus) {
      focusOnElement(elementToFocus, flag);
    }
  }
  // }
  // }
}

function removeKeyboardNavigation() {
  window.removeEventListener('keydown', handleKeyDownKeyboardNavigation);
  removeShortCutInfoDiv();
}

function removeShortCutInfoDiv() {
  const [infoDiv] = rootElement.getElementsByClassName(shortCutDivId);
  if (infoDiv) {
    rootElement.removeChild(infoDiv);
  }
}
const selector =
  'button, [href], input, select, textarea, video, [tabindex]:not([tabindex="-1"])';

function handleKeyboardNavigation(newKey) {
  isKeyboardNavigationOn = false;
  removeKeyboardNavigation();
  if (newKey !== 'default') {
    isKeyboardNavigationOn = true;
    window.addEventListener('keydown', handleKeyDownKeyboardNavigation);
    rootElement.appendChild(shortCutsInfo());
    translateContent();
  }
  handleFloatingButton('keyboardNavigation');
}

function handleTextMagnifier(newKey) {
  textMagnifierTooltip.style.display = 'none';
  addTooltipStyle(textMagnifierTooltip);
  textMagnifierTooltip.style.fontSize = '25px';
  textMagnifierTooltip.remove();
  textMagnifierListener.forEach(({ tag, eventName, event }) => {
    tag.removeEventListener(eventName, event);
  });
  textMagnifierListener.length = 0;
  if (newKey === 'textMagnifier') {
    document.body.appendChild(textMagnifierTooltip);

    textMagnifierListener.push({
      eventName: 'mousemove',
      event: mouseMoveTextMagnifier,
      tag: document.body,
    });
    document.body.addEventListener('mousemove', mouseMoveTextMagnifier);
  }
}

function hexToRgba(hex, opacity) {
  // Remove the '#' if present
  hex = hex.replace('#', '');

  // Parse the hex string into red, green, and blue components
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Return the RGBA color
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function handleHighlightHover(newKey) {
  highLightHoverListener.forEach(({ tag, eventName, event }) => {
    tag.removeEventListener(eventName, event);
  });
  highlightHoverTag.forEach((element) => {
    element.style.outline = '';
    element.style.outlineOffset = '';
  });
  highlightHoverTag.clear();
  highLightHoverListener.length = 0;
  if (newKey === 'highlightHover') {
    const mouseOver = function (event) {
      const element = event.target;
      if (!element.closest('#woAcc-RootEle')) {
        element.style.outline = `${hexToRgba(
          visuals.highlight.highlightColor,
          visuals.highlight.highlightOpacity
        )} solid 2px`;
        element.style.outlineOffset = `${visuals.highlight.highlightSize}px`;
        highlightHoverTag.add(element);
      }
    };
    highLightHoverListener.push({
      eventName: 'mouseover',
      event: mouseOver,
      tag: document.body,
    });
    document.body.addEventListener('mouseover', mouseOver);
    const mouseOut = function (event) {
      const element = event.target;
      if (!element.closest('#woAcc-RootEle')) {
        element.style.outline = '';
        element.style.outlineOffset = '';
        highlightHoverTag.delete(element);
      }
    };
    highLightHoverListener.push({
      eventName: 'mouseout',
      event: mouseOut,
      tag: document.body,
    });
    document.body.addEventListener('mouseout', mouseOut);
  }
}
// Store the initial styles
const initialStyles = new Map();

function saveInitialStyles(element) {
  const computedStyle = window.getComputedStyle(element);
  if (!initialStyles.has(element)) {
    initialStyles.set(element, {
      fontSize: element.style.fontSize || '',
      letterSpacing: element.style.letterSpacing || '',
      wordSpacing: element.style.wordSpacing || '',
      lineHeight: element.style.lineHeight || '',
      transform: element.style.transform || '',
      color: element.style.color || '',
      computed: {
        fontSize: computedStyle.fontSize || '',
        letterSpacing: computedStyle.letterSpacing || '',
        wordSpacing: computedStyle.wordSpacing || '',
        lineHeight: computedStyle.lineHeight || '',
        transform: computedStyle.transform || '',
      },
    });
  }
}

function applyStyle(styleType, value) {
  getAllTextNodeParents();
  const isColor = styleType.includes('Colors');
  for (const [element, initialStyle] of initialStyles.entries()) {
    if (isColor) {
      textColor = value;
      element.style.setProperty('color', value, 'important');
    } else {
      const percentage = parseFloat(value) / 100;
      switch (styleType) {
        case 'adjustFontSizing': {
          element.style.fontSize =
            parseFloat(initialStyle.computed.fontSize) * (1 + percentage) +
            'px';
          break;
        }
        case 'adjustLetterSpacing': {
          let currentLetterSpacing = initialStyle.computed.letterSpacing;
          if (currentLetterSpacing === 'normal') {
            currentLetterSpacing = '-1px';
          }
          element.style.letterSpacing =
            parseFloat(currentLetterSpacing) + percentage * 2 + 'px';
          break;
        }
        case 'adjustWordSpacing': {
          let currentWordSpacing = initialStyle.computed.wordSpacing;
          if (currentWordSpacing === 'normal') {
            currentWordSpacing = '-1px';
          }
          element.style.wordSpacing =
            parseFloat(currentWordSpacing) + percentage * 2 + 'px';
          break;
        }
        case 'adjustLineHeight': {
          element.style.lineHeight =
            parseFloat(initialStyle.computed.lineHeight) * (1 + percentage) +
            'px';
          break;
        }
        case 'contentScale': {
          let currentScale = 1;
          const transform = initialStyle.computed.transform;
          if (transform !== 'none') {
            const match = transform.match(
              /matrix\(([\d.]+), 0, 0, ([\d.]+), 0, 0\)/
            );
            if (match) {
              currentScale = parseFloat(match[1]);
            }
          }
          element.style.transform = `scale(${currentScale * (1 + percentage)})`;
          break;
        }
      }
    }
  }
  if (titlesColor) {
    handleUpdateTitleColor(titlesColor);
  }
}

function resetStyle(styleType) {
  for (const [element, initialStyle] of initialStyles.entries()) {
    switch (styleType) {
      case 'adjustFontSizing':
        element.style.fontSize = initialStyle.fontSize;
        break;
      case 'adjustLetterSpacing':
        element.style.letterSpacing = initialStyle.letterSpacing;
        break;
      case 'adjustWordSpacing':
        element.style.wordSpacing = initialStyle.wordSpacing;
        break;
      case 'adjustLineHeight':
        element.style.lineHeight = initialStyle.lineHeight;
        break;
      case 'contentScale':
        element.style.transform = initialStyle.transform;
        break;
      case 'adjustTextColors':
        textColor = undefined;
        element.style.color = initialStyle.color;
        break;
    }
  }
  if (titlesColor) {
    handleUpdateTitleColor(titlesColor);
  }
}

function handleContentAdjustments(fieldId, newKey) {
  if (newKey === 'default' && activeContentAdjustments.includes(fieldId)) {
    activeContentAdjustments.splice(
      activeContentAdjustments.indexOf(fieldId),
      1
    );
    setMenuOptionToRefresh(false, fieldId);
    resetStyle(fieldId);
  } else if (newKey !== 'default') {
    if (!activeContentAdjustments.includes(fieldId)) {
      activeContentAdjustments.push(fieldId);
    }
    setMenuOptionToRefresh(true, fieldId, newKey);
    applyStyle(fieldId, newKey);
  }
}

const initialStylesTitleColors = new Map();

function handleUpdateTitleColor(newKey, fieldId) {
  const elements = getAllTextNodeParents();
  elements.forEach((element) => {
    if (element.closest('h1, h2, h3, h4, h5, h6, [role="heading"]')) {
      if (!initialStylesTitleColors.has(element)) {
        initialStylesTitleColors.set(element, {
          color: element.style.color || '',
        });
      }
    }
  });
  for (const [element, initialStyle] of initialStylesTitleColors.entries()) {
    if (newKey === 'default') {
      titlesColor = undefined;
      setMenuOptionToRefresh(false, fieldId);
      element.style.color = initialStyle.color;
      if (textColor) {
        handleContentAdjustments('adjustTextColors', textColor);
      }
    } else {
      titlesColor = newKey;
      setMenuOptionToRefresh(true, fieldId, newKey);
      element.style.setProperty('color', newKey, 'important');
    }
  }
}

const initialStylesBackgroundColors = new Map();

function handleUpdateBackgroundColor(newKey, fieldId) {
  const allElements = document.querySelectorAll('*');
  allElements.forEach((element) => {
    if (!element.closest('#woAcc-RootEle')) {
      const bgColor = window.getComputedStyle(element).backgroundColor;
      if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        if (!initialStylesBackgroundColors.has(element)) {
          initialStylesBackgroundColors.set(element, {
            backgroundColor: element.style.backgroundColor || '',
          });
        }
      }
    }
  });
  for (const [
    element,
    initialStyle,
  ] of initialStylesBackgroundColors.entries()) {
    if (newKey === 'default') {
      setMenuOptionToRefresh(false, fieldId);
      element.style.backgroundColor = initialStyle.backgroundColor;
    } else {
      setMenuOptionToRefresh(true, fieldId, newKey);
      element.style.setProperty('background-color', newKey, 'important');
    }
  }
}

function handleImageDescription(newKey) {
  imageDescriptionTooltip.style.display = 'none';
  addTooltipStyle(imageDescriptionTooltip);
  imageDescriptionTooltip.remove();
  imageDescriptionListener.forEach(({ tag, eventName, event }) => {
    tag.removeEventListener(eventName, event);
  });
  imageDescriptionListener.length = 0;
  if (newKey === 'imageDescription') {
    document.body.appendChild(imageDescriptionTooltip);

    imageDescriptionListener.push({
      eventName: 'mousemove',
      event: mouseMoveImageDescription,
      tag: document.body,
    });
    document.body.addEventListener(
      'mousemove',
      mouseMoveImageDescription,
      true
    );
  }
}

function appendReadModeStyles() {
  if (document.getElementById(READING_MODE_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = READING_MODE_STYLE_ID;
  style.innerHTML = `
.guidy-read-mode {
  padding: 50px;
  background: #f2f3f8;
  max-width: 600px;
  margin: auto;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 15px;
  color: #222;
  line-height: 1.5;
}
.guidy-read-mode > :not(.woAcc-modal):not(#woAcc-RootEle) * {
  position: static !important;
  box-sizing: border-box !important;
  display: block !important;
  background: none !important;
  height: auto !important;
}
.guidy-read-mode > :not(#woAcc-RootEle) h1 {
  font-size: 32px;
}
.guidy-read-mode > :not(#woAcc-RootEle) h2 {
  font-size: 26px;
}
.guidy-read-mode > :not(#woAcc-RootEle) h3 {
  font-size: 22px;
}
.guidy-read-mode > :not(#woAcc-RootEle) h4,
.guidy-read-mode > :not(#woAcc-RootEle) h5,
.guidy-read-mode > :not(#woAcc-RootEle) h6 {
  font-size: 17px;
}
.guidy-read-mode > :not(#woAcc-RootEle) h1,
.guidy-read-mode > :not(#woAcc-RootEle) h2,
.guidy-read-mode > :not(#woAcc-RootEle) h3,
.guidy-read-mode > :not(#woAcc-RootEle) h4,
.guidy-read-mode > :not(#woAcc-RootEle) h5,
.guidy-read-mode > :not(#woAcc-RootEle) h6 {
  font-weight: bold;
  margin: 20px 0;
}
.guidy-read-mode > :not(#woAcc-RootEle) ul,
.guidy-read-mode > :not(#woAcc-RootEle) ol {
  padding: 0 20px;
  margin: 20px 0;
}
.guidy-read-mode > :not(#woAcc-RootEle) ul li,
.guidy-read-mode > :not(#woAcc-RootEle) ol li {
  margin: 10px 0;
}
.guidy-read-mode > :not(#woAcc-RootEle) a {
  color: #146ff8;
  text-decoration: none;
}
.guidy-read-mode > :not(#woAcc-RootEle) * > p {
  margin: 20px 0;
}
.guidy-read-mode > :not(.woAcc-modal):not(#woAcc-RootEle) * > img {
  display: block;
  max-width: 100%;
  background: rgba(0, 0, 0, 0.3) !important;
}
.guidy-read-mode .guidy-skip-links.guidy-ready,
.guidy-read-mode .guidy-navigator-wrapper {
  display: none !important;
}`;
  document.head.appendChild(style);
}

function isReadingModeManagedElement(element) {
  const excludedElements = ['svg', 'path', 'script'];

  return (
    !element.closest('.woAcc-RootEle') &&
    !element.closest('.woAcc-modal') &&
    !excludedElements.includes(element.nodeName.toLowerCase())
  );
}

function preserveReadingModeState() {
  const elements = document.body.querySelectorAll('*');

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    if (!isReadingModeManagedElement(element)) {
      continue;
    }

    if (!readingModeElementState.has(element)) {
      readingModeElementState.set(element, {
        className:
          typeof element.className === 'string' ? element.className : null,
        id: element.id || '',
      });
    }
  }
}

function clearReadingModeElementAttributes() {
  const elements = document.body.querySelectorAll('*');

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    if (!isReadingModeManagedElement(element)) {
      continue;
    }

    if (typeof element.className === 'string') {
      element.className = '';
    }

    if (element.id) {
      element.id = '';
    }
  }
}

function resetReadingModeState() {
  if (readModeObserver) {
    readModeObserver.disconnect();
    readModeObserver = null;
  }

  document.body.classList.remove('guidy-read-mode');

  const styleElement = document.getElementById(READING_MODE_STYLE_ID);
  styleElement?.remove?.();

  document.body.removeEventListener(
    'keydown',
    handleEscapeKeyPressInReadingModal
  );

  if (currentOpenModal === 'readingMode') {
    closeModal();
  }

  readingModeElementState.forEach((value, element) => {
    if (!element?.isConnected) {
      return;
    }

    if (typeof value.className === 'string') {
      element.className = value.className;
    }

    element.id = value.id || '';
  });

  readingModeElementState.clear();

  window.isGuidyReadingModeApplied = false;
}

function observeReadmodeChanges() {
  readModeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.target !== document.body) {
        if (
          mutation.target.className &&
          typeof mutation.target.className === 'string'
        ) {
          mutation.target.className = '';
        }
        if (mutation.target.id) {
          mutation.target.id = '';
        }
      }
    });
  });

  readModeObserver.observe(document.body, {
    attributes: true, // Observe attribute changes
    attributeFilter: ['class', 'id'], // Only observe changes to the 'aria-hidden' attribute
    subtree: true, // Observe all descendants of the target
    childList: false,
  });
}
/**
 * Maps the function handlers for effecient calling
 * @todo need to migrate from if else for better performance for other functions
 */
const guidyFunctionsImplementerMapper = {
  mouseKeys: mouseKeysImplementer,
  filterKeys: filterKeysImplementer,
  toggleKeys: toggleKeysImplementer,
};

async function changeClassName(fieldId, newKey) {
  const currentConfig = constants[fieldId];
  if (currentConfig) {
    const allClasses = Object.keys(currentConfig).map(
      (configKey) => currentConfig[configKey].className
    );
    allClasses.forEach((className) => {
      if (className && document.body.classList.contains(className)) {
        document.body.classList.remove(className);
      }
      if (document.documentElement.classList.contains(className)) {
        document.documentElement.classList.remove(className);
      }
    });
    const newCurrentClass = currentConfig[newKey]?.className || '';
    if (
      [
        'woAcc-FCONT1',
        'woAcc-FCONT2',
        'woAcc-FCONT3',
        'woAcc-FSMCONT1',
        'woAcc-FS1',
        'woAcc-FS2',
        'woAcc-FS3',
        'woAcc-CA1',
        'woAcc-CA2',
        'woAcc-CA3',
      ].includes(newCurrentClass)
    ) {
      document.documentElement.classList.add(newCurrentClass);
    } else {
      if (newCurrentClass) {
        document.body.classList.add(newCurrentClass);
      }
    }
  }
  if (fieldId === 'readingGuide') {
    handleReadingGuide(newKey);
  } else if (fieldId === 'font') {
    const fontLinkExist = document.getElementById('woAccFontLink');
    if (!fontLinkExist) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';

      fontLink.id = 'woAccFontLink';
      fontLink.href =
        'https://fonts.googleapis.com/css?family=Sofia|Lexend|Noto+Sans+JP';
      document.head.appendChild(fontLink);
    }
  }
  // else if (fieldId === "hideImages") {
  //   const allImages = document.querySelectorAll("img:not(#woAcc-RootEle img)");
  //   for (let i = 0; i < allImages.length; i++) {
  //     const image = allImages.item(i);
  //     image.removeAttribute("data-woAccessibility--img-to-text");
  //     if (newKey === "default") {
  //       const previous = image?.previousSibling;
  //       if (previous && previous.nodeName === "SPAN") {
  //         image.parentNode.removeChild(previous);
  //       }
  //     }
  //   }
  // }
  else if (fieldId === 'toolTip') {
    tooltipMouseOverListener.forEach(({ tag, eventName, event }) => {
      event();
      tag.removeEventListener(eventName, event);
    });
    tooltipMouseOverListener.length = 0;
    setMenuOptionToRefresh(false, fieldId);
    if (newKey === 'toolTip') {
      setMenuOptionToRefresh(true, fieldId, newKey);
      const tooltipMouseOverTags = document.querySelectorAll('a,[alt]');
      tooltipMouseOverTags.forEach((element) => {
        const mouseOver = handleHoverTooltip;
        tooltipMouseOverListener.push({
          eventName: 'mouseover',
          event: mouseOver,
          tag: element,
        });
        element.addEventListener('mouseover', mouseOver);
      });
    }
  } else if (fieldId === 'textMagnifier') {
    handleTextMagnifier(newKey);
  } else if (fieldId === 'lineHeight') {
    setMenuOptionToRefresh(true, fieldId, newKey);
    const elements = document.querySelectorAll(
      'h1, h2, h3, h4, h5, h6 [role="heading"], p, a, td, th, dd, dt, li'
    );
    const qw = new Map();
    for (const element of elements) {
      const t = element;
      if (newKey === 'default') {
        setMenuOptionToRefresh(false, fieldId);
        t.style.removeProperty('line-height');
      }
      t.style.removeProperty('line-height');
      const r = lineHeight[newKey];
      const a = window.getComputedStyle(element);
      const i = a.lineHeight;

      if (!qw.has(element)) {
        qw.set(element, i);
      }

      const o = parseFloat(a.fontSize);
      const s = parseFloat(qw.get(element)) / o;
      t.style.lineHeight = `${s * r}em`;
    }
  } else if (fieldId === 'textAlignment') {
    manageStyleApply('textAlignment', newKey, fieldId);
  } else if (fieldId === 'pageStructure') {
    if (currentOpenModal === 'pageStructure') {
      closeModal();
      return;
    }
    closeModal();
    if (newKey === 'pageStructure') {
      showPageStructureModal();
    }
  } else if (fieldId === 'readingMode') {
    if (newKey === 'readingMode') {
      window.isGuidyReadingModeApplied = true;
      appendReadModeStyles();
      observeReadmodeChanges();
      preserveReadingModeState();
      document.body.classList.add('guidy-read-mode');
      clearReadingModeElementAttributes();
    } else {
      resetReadingModeState();
    }
  } else if (fieldId === 'screenReader') {
    isActive.screenReader = false;
    cancelSpeechSynthesis();
    say(' ');
    removeSoundElement();
    setMenuOptionToRefresh(false, fieldId);
    const elements = document.querySelectorAll('.woAcc-SpeakWord');
    elements.forEach(function (element) {
      element.classList.remove('woAcc-SpeakWord');
    });
    breakFlag = true;
    if (newKey === 'screenReader') {
      setMenuOptionToRefresh(true, fieldId, newKey);
      isActive.screenReader = true;
      addSoundElement();
      globalStartedFrom = 0;
      breakFlag = false;
      currentReadSpeed = 'moderateSpeed';
      startScreenReader();
    }
  } else if (fieldId === 'partialReader') {
    if (isActive.partialReader && currentReadSpeed === newKey) {
      return;
    }
    isActive.partialReader = false;
    removePartialScreenReader();
    cancelSpeechSynthesis();
    say(' ');
    removeSoundElement();
    setMenuOptionToRefresh(false, fieldId);
    const elements = document.querySelectorAll('.woAcc-SpeakWord');
    elements.forEach(function (element) {
      element.classList.remove('woAcc-SpeakWord');
    });
    if (newKey !== 'default') {
      setMenuOptionToRefresh(true, fieldId, newKey);
      addSoundElement();
      isActive.partialReader = true;
      currentReadSpeed = newKey;
      startPartialScreenReader();
    } else {
      currentReadSpeed = 'moderateSpeed';
    }
  } else if (fieldId === 'muteSounds') {
    manageSoundMute(newKey, fieldId);
  } else if (fieldId === 'disableWidget') {
    if (newKey === 'disableWidget') {
      hideLoaderOnButton();
      rootElement.style.display = 'none';
    }
  } else if (fieldId === 'highlightHover') {
    handleHighlightHover(newKey);
  } else if (fieldId === 'imageDescription') {
    handleImageDescription(newKey);
  } else if (
    [
      'adjustFontSizing',
      'adjustLetterSpacing',
      'adjustLineHeight',
      'adjustWordSpacing',
      'contentScale',
      'adjustTextColors',
    ].includes(fieldId)
  ) {
    handleContentAdjustments(fieldId, newKey);
  } else if (fieldId === 'adjustTitleColors') {
    handleUpdateTitleColor(newKey, fieldId);
  } else if (fieldId === 'adjustBackgroundColors') {
    handleUpdateBackgroundColor(newKey, fieldId);
  } else if (fieldId === 'furigana') {
    handleFurigana(newKey);
  } else if (fieldId === 'stopAnimation') {
    handleStopAnimation(newKey, fieldId);
  } else if (fieldId === 'keyboardNavigation') {
    handleKeyboardNavigation(newKey);
  } else if (fieldId === 'virtualKeyboard') {
    handleVirtualKeyboard(newKey);
  } else if (fieldId === 'voiceNavigation') {
    handleVoiceNavigation(newKey);
  } else if (fieldId === 'woAccessibilityLang') {
    if (recognizer) {
      if (isRecognizing) {
        recognizer.stop();
        recognizerRunning = false;
      }
      recognizer.lang =
        `${getDataById('woAccessibilityLang')}` ||
        document.querySelector('html').getAttribute('lang') ||
        navigator.language;
      try {
        if (isRecognizing) {
          startRecognizer();
        }
      } catch (e) {
        console.log(e, ':::: Guidy Recognizer already listenining.');
      }
    }
    translateContent();
    translateDOMContent();
  } else if (fieldId === 'removeItalics') {
    handleRemoveItalics(newKey);
  } else if (fieldId === 'removeUnderlines') {
    handleRemoveUnderlines(newKey);
  } else if (fieldId === 'removeShadows') {
    handleRemoveShadows(newKey);
  } else if (
    fieldId === 'highlightSize' ||
    fieldId === 'highlightOpacity' ||
    fieldId === 'highlightColor'
  ) {
    handleVisuals('highlight', fieldId, newKey);
  } else if (
    fieldId === 'cursorSize' ||
    fieldId === 'cursorSpeed' ||
    fieldId === 'cursorColor'
  ) {
    handleVisuals('cursorIcon', fieldId, newKey);
    createCustomCursor(lastCursorKey);
  } else if (
    fieldId === 'guideSize' ||
    fieldId === 'guideOpacity' ||
    fieldId === 'guideColor'
  ) {
    const oldSize =
      visuals.guide.guideSize === 'default' ? 0 : visuals.guide.guideSize - 1;
    handleVisuals('guide', fieldId, newKey);
    const size =
      visuals.guide.guideSize === 'default' ? 0 : visuals.guide.guideSize - 1;
    if (readingGuide) {
      readingGuide.style.width = `calc(40vw + ${size * 100}px)`;
    }
    if (readingMask) {
      const sizeDifference = oldSize - size;
      const topPart = readingMask.children[0];
      const bottomPart = readingMask.children[1];

      topPart.style.height = `${
        Number(topPart.style.height.slice(0, -2)) + sizeDifference * 5
      }px`;

      bottomPart.style.top = `${
        Number(bottomPart.style.top.slice(0, -2)) - sizeDifference * 5
      }px`;

      topPart.style.borderColor = hexToRgba(
        visuals.guide.guideColor,
        visuals.guide.guideOpacity
      );
      bottomPart.style.borderColor = hexToRgba(
        visuals.guide.guideColor,
        visuals.guide.guideOpacity
      );
      readingMask.style.opacity = 1;
    }
    if (simpleRuler) {
      simpleRuler.style.height = `calc(15vh + ${size * 10}px)`;
    }
  } else if (fieldId === 'syllabicDivision') {
    removeSyllabicDivision();
    handleSyllabicDivision(newKey);
  } else if (fieldId === 'cursorIcon') {
    if (newKey !== 'default') {
      createCustomCursor(newKey);
    } else {
      removeCustomCursor();
    }
  } else if (fieldId === 'keyboardShortcut') {
    isKeyboardShortcutsOn = false;
    document.removeEventListener('keydown', handleShortcutsKeyDown);
    removeKeyboardShortCutsInfoDiv();
    if (newKey !== 'default') {
      getGuidyShortcuts();
      document.addEventListener('keydown', handleShortcutsKeyDown);
      isKeyboardShortcutsOn = true;
      if (!keyboardShortcut) {
        createKeyboardShortCutsInfoDiv(
          floatingButtonsChild['keyboardShortcut']?.classList.contains('active')
            ? true
            : false
        );
      }
    }
    handleFloatingButton('keyboardShortcut');
  } else if (fieldId === 'displayInText') {
    if (newKey !== 'default') {
      setMenuOptionToRefresh(true, fieldId, newKey);
      const allImages = document.querySelectorAll(
        'img:not(#woAcc-RootEle img):not([data--woAccessibility--img--to--text])'
      );
      for (let i = 0; i < allImages.length; i++) {
        const image = allImages.item(i);
        const textTobInserted = image?.alt || '';
        if (textTobInserted) {
          image.setAttribute(
            'data--woAccessibility--img--to--text',
            'guidy-attr'
          );
          const spanTag = document.createElement('span');
          spanTag.style.border = '1px solid';
          spanTag.style.borderRadius = '8px';
          spanTag.style.padding = '8px';
          spanTag.innerText = textTobInserted;
          image.parentNode.insertBefore(spanTag, image);
        }
      }
    } else {
      setMenuOptionToRefresh(false, fieldId);
      const allImages = document.querySelectorAll(
        'img[data--woAccessibility--img--to--text]'
      );
      for (let i = 0; i < allImages.length; i++) {
        const image = allImages.item(i);
        image.removeAttribute(
          'data--woAccessibility--img--to--text',
          'guidy-attr'
        );
        const previous = image?.previousSibling;
        if (previous) {
          image.parentNode.removeChild(previous);
        }
      }
    }
  } else if (fieldId === 'headGestures') {
    if (newKey === 'default') {
      if (!isHeadGestureInitialized) return;
      isHeadGestureInitialized = false;
      document.dispatchEvent(new CustomEvent('GuidyHeadGestureTerminate'));
      const elements = document.querySelectorAll('#guidy-headGesture-wrapper');
      elements.forEach(function (element) {
        element?.remove?.();
      });
      // window.location.reload();
    } else if (newKey === 'headGestures') {
      if (isHeadGestureInitialized) return;
      isHeadGestureInitialized = true;
      const { default: headGestureModule } = await import('./headGestures.js');

      // Create wrapper div to contain all head gesture elements
      const headGestureWrapper = document.createElement('div');
      headGestureWrapper.id = 'guidy-headGesture-wrapper';
      headGestureWrapper.classList.add('guidy-headGesture-wrapper');
      rootElement.appendChild(headGestureWrapper);

      // video element
      const webcam = document.createElement('video');
      webcam.id = 'guidy-webcam';
      webcam.classList.add('guidy-headGesture-video');
      webcam.autoplay = true;
      webcam.muted = true;
      headGestureWrapper.appendChild(webcam);

      //canvas element for video overlay
      const overlay = document.createElement('canvas');
      overlay.id = 'guidy-overlay';
      overlay.classList.add('guidy-headGesture-canvas');
      headGestureWrapper.appendChild(overlay);

      //element for gesture
      const gestureOutput = document.createElement('p');
      gestureOutput.id = 'guidy-gesture-output';
      gestureOutput.style.display = 'none';
      headGestureWrapper.appendChild(gestureOutput);

      // Error message element (hidden by default)
      const errorMessage = document.createElement('div');
      errorMessage.id = 'guidy-headGesture-error';
      errorMessage.classList.add('guidy-headGesture-error');
      errorMessage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Camera access denied or unavailable. Please allow camera permissions and try again.</span>
      `;
      errorMessage.style.display = 'none';
      headGestureWrapper.appendChild(errorMessage);

      //element to hide interface
      const hideInterface = document.createElement('button');
      hideInterface.id = 'guidy-hide-interface';
      hideInterface.classList.add('guidy-headGesture-hide');

      hideInterface.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrapper = document.getElementById('guidy-headGesture-wrapper');
        if (wrapper) wrapper.style.display = 'none';
      });
      hideInterface.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3.28 2.22a.75.75 0 1 0-1.06 1.06l1.915 1.916A3.25 3.25 0 0 0 2 8.25v9.5A3.25 3.25 0 0 0 5.25 21h13.5a3.2 3.2 0 0 0 1.024-.165l.945.945a.75.75 0 0 0 1.061-1.06zM18.44 19.5H5.25a1.75 1.75 0 0 1-1.75-1.75v-9.5c0-.966.784-1.75 1.75-1.75h.19l3.11 3.11a4.5 4.5 0 0 0 6.34 6.34zm-8.822-8.822l4.205 4.205a3 3 0 0 1-4.206-4.206m1.628-2.615l1.54 1.541a3 3 0 0 1 2.111 2.11l1.54 1.541a4.5 4.5 0 0 0-5.192-5.192m9.255.187v9.068l1.364 1.365q.135-.446.136-.933v-9.5A3.25 3.25 0 0 0 18.75 5h-2.07l-.815-1.387a2.25 2.25 0 0 0-1.94-1.11h-3.803a2.25 2.25 0 0 0-1.917 1.073l-.55.896l1.09 1.091l.738-1.202l.065-.09a.75.75 0 0 1 .574-.268h3.803a.75.75 0 0 1 .646.37l1.032 1.757a.75.75 0 0 0 .647.37h2.5c.966 0 1.75.784 1.75 1.75"/></svg>';
      headGestureWrapper.appendChild(hideInterface);

      const success = await headGestureModule.initialize(
        'guidy-webcam',
        'guidy-overlay',
        'guidy-gesture-output'
      );
      if (!success) {
        console.warn('Head gesture module initialization failed.');
        webcam.style.display = 'none';
        overlay.style.display = 'none';
        errorMessage.style.display = 'flex';
      }

      // Example of Listening to the custom event
      document.addEventListener('GuidyHeadGesture', (event) => {
        const gesture = event.detail.gesture;
        handleHeadGestures(gesture);
      });
    }
  } else if (fieldId === 'signLanguage') {
    if (newKey === 'default') {
      if (!isSignGestureInitialized) return;
      isSignGestureInitialized = false;
      document.dispatchEvent(new CustomEvent('GuidySignGestureTerminate'));

      const elements = document.querySelectorAll('#guidy-headGesture-wrapper');
      elements.forEach(function (element) {
        element?.remove?.();
      });
    } else if (newKey === 'signLanguage') {
      if (isSignGestureInitialized) return;
      isSignGestureInitialized = true;
      const { default: signGestureModule } = await import('./signLanguage.js');

      // Create wrapper div to contain all sign language elements
      const signWrapper = document.createElement('div');
      signWrapper.id = 'guidy-headGesture-wrapper';
      signWrapper.classList.add('guidy-headGesture-wrapper');
      rootElement.appendChild(signWrapper);

      // video element
      const webcam = document.createElement('video');
      webcam.id = 'guidy-webcam';
      webcam.classList.add('guidy-headGesture-video');
      webcam.autoplay = true;
      webcam.muted = true;
      signWrapper.appendChild(webcam);

      //canvas element for video overlay
      const overlay = document.createElement('canvas');
      overlay.id = 'guidy-overlay';
      overlay.classList.add('guidy-headGesture-canvas');
      signWrapper.appendChild(overlay);

      //element for gesture
      const gestureOutput = document.createElement('p');
      gestureOutput.id = 'guidy-gesture-output';
      gestureOutput.style.display = 'none';
      signWrapper.appendChild(gestureOutput);

      // Error message element (hidden by default)
      const errorMessage = document.createElement('div');
      errorMessage.id = 'guidy-headGesture-error';
      errorMessage.classList.add('guidy-headGesture-error');
      errorMessage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Camera access denied or unavailable. Please allow camera permissions and try again.</span>
      `;
      errorMessage.style.display = 'none';
      signWrapper.appendChild(errorMessage);

      //element to hide interface
      const hideInterface = document.createElement('button');
      hideInterface.id = 'guidy-hide-interface';
      hideInterface.classList.add('guidy-headGesture-hide');
      hideInterface.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrapper = document.getElementById('guidy-headGesture-wrapper');
        if (wrapper) wrapper.style.display = 'none';
      });
      hideInterface.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3.28 2.22a.75.75 0 1 0-1.06 1.06l1.915 1.916A3.25 3.25 0 0 0 2 8.25v9.5A3.25 3.25 0 0 0 5.25 21h13.5a3.2 3.2 0 0 0 1.024-.165l.945.945a.75.75 0 0 0 1.061-1.06zM18.44 19.5H5.25a1.75 1.75 0 0 1-1.75-1.75v-9.5c0-.966.784-1.75 1.75-1.75h.19l3.11 3.11a4.5 4.5 0 0 0 6.34 6.34zm-8.822-8.822l4.205 4.205a3 3 0 0 1-4.206-4.206m1.628-2.615l1.54 1.541a3 3 0 0 1 2.111 2.11l1.54 1.541a4.5 4.5 0 0 0-5.192-5.192m9.255.187v9.068l1.364 1.365q.135-.446.136-.933v-9.5A3.25 3.25 0 0 0 18.75 5h-2.07l-.815-1.387a2.25 2.25 0 0 0-1.94-1.11h-3.803a2.25 2.25 0 0 0-1.917 1.073l-.55.896l1.09 1.091l.738-1.202l.065-.09a.75.75 0 0 1 .574-.268h3.803a.75.75 0 0 1 .646.37l1.032 1.757a.75.75 0 0 0 .647.37h2.5c.966 0 1.75.784 1.75 1.75"/></svg>';
      signWrapper.appendChild(hideInterface);

      const success = await signGestureModule.initialize(
        'guidy-webcam',
        'guidy-overlay',
        'guidy-gesture-output'
      );
      if (!success) {
        console.warn('Sign gesture module initialization failed.');
        webcam.style.display = 'none';
        overlay.style.display = 'none';
        errorMessage.style.display = 'flex';
      }

      // Example of Listening to the custom event
      window.addEventListener('guidySignGestureDetected', (event) => {
        const gesture = event.detail.name;
        handleSignGestures(gesture);
      });
    }
  } else if (fieldId === 'summarizer') {
    if (newKey === 'default') {
      stopTextSummrizer();
    } else if (newKey === 'summarizer') {
      handleTextSummarizer();
    }
  }
  guidyFunctionsImplementerMapper[fieldId]?.(newKey, fieldId);
}

//#region Mouse Keys Implementation
/**
 *
 * @param {String} newKey new key for mouse keys
 * @param {String} fieldId field id for mouse keys
 */
function mouseKeysImplementer(newKey) {
  if (newKey === 'default') {
    stopMouseKeys();
  } else if (newKey === 'mouseKeys') {
    if (guidyCursor) return;
    startMouseKeys();
  }
}

function stopMouseKeys() {
  if (guidyCursor) guidyCursor.remove();
  guidyCursor = null;
  if (guidyCursorIndicator) guidyCursorIndicator.remove();
  guidyCursorIndicator = null;
  document.removeEventListener('keydown', handleMouseSimulation);
  handleFloatingButton('mouseKeys');
}

function startMouseKeys() {
  guidyCursor = createCursor();
  rootElement.appendChild(mouseKeyIndicator());
  handleFloatingButton('mouseKeys');
  document.addEventListener('keydown', handleMouseSimulation);
  hoverStyles = getAllHoverStyles();
}

/**
 * Maps the mouse keys to their corresponding actions
 */
const mouseSimulatorMapper = {
  /**
   * Simulates mouse move up
   * @param {KeyboardEvent} event
   */
  [cursorConfig.movements.up]: (event) => {
    if (!guidyCursor) return;
    event.preventDefault?.();
    const isCtrlPressed = event.ctrlKey;
    const cursorStyles = window.getComputedStyle(guidyCursor);
    const currentTopLocation = cursorStyles.top.slice(0, -2);
    const boundingRect = guidyCursor.getBoundingClientRect();
    let newLocation = Number(currentTopLocation) - (isCtrlPressed ? 20 : 5);
    if (newLocation < 0 || newLocation === 0) newLocation = 0;
    guidyCursor.style.top = `${newLocation}px`;
    guidyCursor.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'instant',
    });
    const elementsBelowCursor = getCurrentElementBelowCursor(
      boundingRect.x,
      boundingRect.y,
      true
    );
    for (const element of elementsBelowCursor) {
      const elementStyles = window.getComputedStyle(element);
      if (
        element.scrollHeight > element.offsetHeight &&
        ['scroll', 'auto'].includes(elementStyles.overflowY)
      ) {
        const elementBoundingRect = element.getBoundingClientRect();
        const relativePosition = getRelativeLocation(
          {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          },
          {
            width: elementBoundingRect.width,
            height: elementBoundingRect.height,
          },
          { x: elementBoundingRect.x, y: elementBoundingRect.y },
          { x: boundingRect.x, y: boundingRect.y }
        );
        if (!relativePosition) continue;
        if (relativePosition.y < 5 && element.scrollTop > 5) {
          element.scrollBy({ top: -24, behavior: 'instant' });

          guidyCursor.style.top = `${Number(newLocation) + 5}px`;
        }
        break;
      }
    }
  },
  /**
   * Simulates mouse move down
   * @param {KeyboardEvent} event
   */
  [cursorConfig.movements.down]: (event) => {
    if (!guidyCursor) return;
    event.preventDefault?.();
    const isCtrlPressed = event.ctrlKey;
    const cursorStyles = window.getComputedStyle(guidyCursor);
    const scrollHeight = document.body.scrollHeight;
    const boundingRect = guidyCursor.getBoundingClientRect();
    const currentTopLocation = cursorStyles.top.slice(0, -2);
    let newLocation = Number(currentTopLocation) + (isCtrlPressed ? 20 : 5);
    if (newLocation > scrollHeight) newLocation = scrollHeight;
    guidyCursor.style.top = `${newLocation}px`;
    guidyCursor.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'instant',
    });
    const elementsBelowCursor = getCurrentElementBelowCursor(
      boundingRect.x,
      boundingRect.y,
      true
    );
    for (const element of elementsBelowCursor) {
      const elementStyles = window.getComputedStyle(element);
      if (
        element.scrollHeight > element.offsetHeight &&
        ['scroll', 'auto'].includes(elementStyles.overflowY)
      ) {
        const elementBoundingRect = element.getBoundingClientRect();
        const relativePosition = getRelativeLocation(
          {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          },
          {
            width: elementBoundingRect.width,
            height: elementBoundingRect.height,
          },
          { x: elementBoundingRect.x, y: elementBoundingRect.y },
          { x: boundingRect.x, y: boundingRect.y }
        );
        if (!relativePosition) continue;

        if (relativePosition.y + 10 > elementBoundingRect.height) {
          element.scrollBy({ top: 100, behavior: 'instant' });
          if (
            !(
              element.scrollHeight - element.scrollTop - element.offsetHeight <
              5
            )
          ) {
            console.log({ element, relativePosition });
            guidyCursor.style.top = `${Number(newLocation) - 5}px`;
          }
        }
        break;
      } else if (element === document.body) {
        if (boundingRect.top > window.visualViewport.height - 10) {
          window.scrollBy({ top: 24, behavior: 'instant' });
        }
      }
    }
  },

  /**
   * Simulates mouse move left
   * @param {KeyboardEvent} event
   */
  [cursorConfig.movements.left]: (event) => {
    if (!guidyCursor) return;
    event.preventDefault?.();

    const isCtrlPressed = event.ctrlKey;
    const cursorStyles = window.getComputedStyle(guidyCursor);
    const currentLeftLocation = cursorStyles.left.slice(0, -2);
    let newLocation = Number(currentLeftLocation) - (isCtrlPressed ? 20 : 5);
    if (newLocation < 0 || newLocation === 0) newLocation = 0;
    guidyCursor.style.left = `${newLocation}px`;
    guidyCursor.scrollIntoView({
      inline: 'nearest',
      block: 'nearest',
      behavior: 'instant',
    });
    const boundingRect = guidyCursor.getBoundingClientRect();
    const elementsBelowCursor = getCurrentElementBelowCursor(
      boundingRect.x,
      boundingRect.y,
      true
    );
    for (const element of elementsBelowCursor) {
      const elementStyles = window.getComputedStyle(element);
      if (
        element.scrollWidth > element.offsetWidth &&
        ['scroll', 'auto'].includes(elementStyles.overflowX)
      ) {
        const elementBoundingRect = element.getBoundingClientRect();
        const relativePosition = getRelativeLocation(
          {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          },
          {
            width: elementBoundingRect.width,
            height: elementBoundingRect.height,
          },
          { x: elementBoundingRect.x, y: elementBoundingRect.y },
          { x: boundingRect.x, y: boundingRect.y }
        );
        if (!relativePosition) continue;
        if (relativePosition.x < 5 && element.scrollLeft > 5) {
          element.scrollBy({ left: -24, behavior: 'instant' });
          guidyCursor.style.left = `${Number(newLocation) + 5}px`;
        }
        break;
      }
    }
  },
  /**
   * Simulates mouse move right
   * @param {KeyboardEvent} event
   */
  [cursorConfig.movements.right]: (event) => {
    if (!guidyCursor) return;
    event.preventDefault?.();
    const isCtrlPressed = event.ctrlKey;
    const cursorStyles = window.getComputedStyle(guidyCursor);
    const currentLeftLocation = cursorStyles.left.slice(0, -2);
    const scrollWidth = document.body.scrollWidth;
    const boundingRect = guidyCursor.getBoundingClientRect();
    let newLocation = Number(currentLeftLocation) + (isCtrlPressed ? 20 : 5);
    if (newLocation > scrollWidth) newLocation = scrollWidth;
    guidyCursor.style.left = `${newLocation}px`;
    guidyCursor.scrollIntoView({
      inline: 'nearest',
      block: 'nearest',
      behavior: 'instant',
    });
    const elementsBelowCursor = getCurrentElementBelowCursor(
      boundingRect.x,
      boundingRect.y,
      true
    );
    for (const element of elementsBelowCursor) {
      const elementStyles = window.getComputedStyle(element);
      if (
        element.scrollWidth > element.offsetWidth &&
        ['scroll', 'auto'].includes(elementStyles.overflowX)
      ) {
        const elementBoundingRect = element.getBoundingClientRect();
        const relativePosition = getRelativeLocation(
          {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          },
          {
            width: elementBoundingRect.width,
            height: elementBoundingRect.height,
          },
          { x: elementBoundingRect.x, y: elementBoundingRect.y },
          { x: boundingRect.x, y: boundingRect.y }
        );
        if (!relativePosition) continue;
        if (relativePosition.x + 10 > elementBoundingRect.width) {
          element.scrollBy({ left: 24, behavior: 'instant' });
          if (
            !(
              element.scrollWidth - element.scrollLeft - element.offsetWidth <
              5
            )
          ) {
            guidyCursor.style.left = `${Number(newLocation) - 5}px`;
          }
        }
        break;
      }
    }
  },
  /**
   * Simulates mouse click
   * @param {KeyboardEvent} event
   */
  [cursorConfig.actions.click]: (event) => {
    if (!guidyCursor) return;
    event.preventDefault?.();
    const boundingRect = guidyCursor.getBoundingClientRect();
    const currentHoveredElement = getCurrentElementBelowCursor(
      boundingRect.x,
      boundingRect.y
    );
    if (currentHoveredElement) {
      if (currentHoveredElement === iframe) {
        const cursorPositionRelativeToIframe = getRelativeLocation(
          {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          },
          { width: iframe.offsetWidth, height: iframe.offsetHeight },
          { x: iframe.offsetLeft, y: iframe.offsetTop },
          { x: boundingRect.x, y: boundingRect.y }
        );
        sendPostMessage('guidy-cursor-event', {
          type: 'click',
          ...cursorPositionRelativeToIframe,
        });
      } else {
        if (['TEXTAREA', 'INPUT'].includes(currentHoveredElement.tagName)) {
          currentHoveredElement.focus();
        }
        const eventTypes = ['mouseover', 'mousedown', 'mouseup', 'click'];
        eventTypes.forEach((type) => {
          const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: boundingRect.x,
            clientY: boundingRect.y,
            button: 0,
          });
          currentHoveredElement.dispatchEvent(event);
        });
      }
    }
  },
  /**
   * Simulates mouse right click
   * @param {KeyboardEvent} event
   */
  [cursorConfig.actions.rightClick]: (event) => {
    if (!guidyCursor) return;
    event.preventDefault?.();
    const boundingRect = guidyCursor.getBoundingClientRect();
    const currentHoveredElement = getCurrentElementBelowCursor(
      boundingRect.x,
      boundingRect.y
    );
    if (currentHoveredElement) {
      if (currentHoveredElement === iframe) {
        const cursorPositionRelativeToIframe = getRelativeLocation(
          {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          },
          { width: iframe.offsetWidth, height: iframe.offsetHeight },
          { x: iframe.offsetLeft, y: iframe.offsetTop },
          { x: boundingRect.x, y: boundingRect.y }
        );
        sendPostMessage('guidy-cursor-event', {
          type: 'rightClick',
          ...cursorPositionRelativeToIframe,
        });
      } else {
        const eventTypes = ['mouseover', 'mousedown', 'mouseup', 'contextmenu'];

        eventTypes.forEach((type) => {
          const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: boundingRect.x,
            clientY: boundingRect.y,
            button: 2,
          });
          currentHoveredElement.dispatchEvent(event);
        });
      }
    }
  },
  /**
   * Simulates mouse double click
   * @param {KeyboardEvent} event
   */
  [cursorConfig.actions.dblClick]: (event) => {
    if (!guidyCursor) return;
    event.preventDefault?.();
    const boundingRect = guidyCursor.getBoundingClientRect();
    const currentHoveredElement = getCurrentElementBelowCursor(
      boundingRect.x,
      boundingRect.y
    );
    if (currentHoveredElement) {
      if (currentHoveredElement === iframe) {
        const cursorPositionRelativeToIframe = getRelativeLocation(
          {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          },
          { width: iframe.offsetWidth, height: iframe.offsetHeight },
          { x: iframe.offsetLeft, y: iframe.offsetTop },
          { x: boundingRect.x, y: boundingRect.y }
        );
        sendPostMessage('guidy-cursor-event', {
          type: 'dblClick',
          ...cursorPositionRelativeToIframe,
        });
      } else {
        const eventTypes = ['mouseover', 'mousedown', 'mouseup', 'dblclick'];

        eventTypes.forEach((type) => {
          const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: boundingRect.x,
            clientY: boundingRect.y,
            button: 0,
          });
          currentHoveredElement.dispatchEvent(event);
        });
      }
    }
  },
};

/**
 * Get point position relative to iframe
 *
 * @param {Object} screen1Size - { width, height } of window
 * @param {Object} screen2Size - { width, height } of iframe
 * @param {Object} screen2Offset - { x, y } offset of iframe inside window
 * @param {Object} pointInScreen1 - { x, y } coordinates of point in window
 *
 * @returns {Object|null} - Relative position { x, y } in iframe or null if outside
 */
function getRelativeLocation(
  screen1Size,
  screen2Size,
  screen2Offset,
  pointInScreen1
) {
  const relativeX = pointInScreen1.x - screen2Offset.x;
  const relativeY = pointInScreen1.y - screen2Offset.y;
  const isInside =
    relativeX >= 0 &&
    relativeX <= screen2Size.width &&
    relativeY >= 0 &&
    relativeY <= screen2Size.height;

  if (!isInside) return null;

  return { x: relativeX, y: relativeY };
}

/**
 * Gets the element below the cursor
 * @param {Number} x X coordinates of cursor
 * @param {Number} y Y coordinates of cursor
 * @param {Boolean} propogate Whether to propogate the event to the element below the cursor
 * @returns {HTMLElement | HTMLElement[]} The element below the cursor
 */
function getCurrentElementBelowCursor(x, y, propogate = false) {
  const elementsUnderCursor = document.elementsFromPoint(x, y);

  return propogate
    ? elementsUnderCursor.slice(elementsUnderCursor.indexOf(guidyCursor) + 1)
    : (elementsUnderCursor[elementsUnderCursor.indexOf(guidyCursor) + 1] ??
        document.body);
}

/**
 * Handles the mouse simulation on keypress
 * @param {KeyboardEvent} event
 */
function handleMouseSimulation(event) {
  const keyCode = event.code;
  mouseSimulatorMapper[keyCode]?.(event);
}

/**
 * Creates a custom cursor element and appends it to the document body
 * @returns returns the cursor element
 */
function createCursor() {
  const cursor = document.createElement('div');
  cursor.id = 'guidy-custom-cursor';
  cursor.ariaHidden = true;
  cursor.classList.add('guidy-custom-cursor-wrapper');
  positionObserver(cursor);
  cursor.addEventListener('positionchange', handleCursorPositonChange);
  const cursorIcon = document.createElement('div');
  cursorIcon.classList.add('guidy-custom-cursor-icon');
  cursorIcon.innerHTML = customCursorIcons.default;
  cursor.guidyCursorIcon = 'default';
  cursor.appendChild(cursorIcon);
  document.body.appendChild(cursor);
  return cursor;
}

/**
 * Handles the position change of custom cursor
 * @param {CustomEvent} event
 */
function handleCursorPositonChange(event) {
  const cursor = event.target;
  const boundingRect = cursor.getBoundingClientRect();
  const elementBelowCursor = getCurrentElementBelowCursor(
    boundingRect.x,
    boundingRect.y
  );
  const mouseEventOptions = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: boundingRect.x,
    clientY: boundingRect.y,
  };
  const mouseMoveEvent = new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: boundingRect.x,
    clientY: boundingRect.y,
    button: 0,
    buttons: 0,
    x: boundingRect.x,
    y: boundingRect.y,
    target: elementBelowCursor,
    relatedTarget: null,
    srcElement: elementBelowCursor,
  });
  elementBelowCursor.dispatchEvent(mouseMoveEvent);
  if (elementBelowCursor !== guidyCurrentCursorFocusedElement) {
    if (guidyCurrentCursorFocusedElement) {
      guidyCurrentCursorFocusedElement.dispatchEvent(
        new MouseEvent('mouseout', mouseEventOptions)
      );
      guidyCurrentCursorFocusedElement.dispatchEvent(
        new MouseEvent('mouseleave', mouseEventOptions)
      );
      guidyCurrentCursorFocusedElement = null;
    }
    if (elementBelowCursor === iframe) {
      const cursorPositionRelativeToIframe = getRelativeLocation(
        {
          width: window.visualViewport.width,
          height: window.visualViewport.height,
        },
        { width: iframe.offsetWidth, height: iframe.offsetHeight },
        { x: iframe.offsetLeft, y: iframe.offsetTop },
        { x: boundingRect.x, y: boundingRect.y }
      );
      const direction =
        event.detail.prop === 'top'
          ? Math.sign(
              Number(event.detail.oldValue.slice(0, -2)) -
                Number(event.detail.newValue.slice(0, -2))
            ) === 1
            ? 'up'
            : 'down'
          : '';

      sendPostMessage('guidy-cursor-event', {
        type: 'mousemove',
        direction,
        ...cursorPositionRelativeToIframe,
      });
    } else {
      elementBelowCursor.dispatchEvent(
        new MouseEvent('mouseover', mouseEventOptions)
      );
      elementBelowCursor.dispatchEvent(
        new MouseEvent('mouseenter', mouseEventOptions)
      );
      const elementStyles = window.getComputedStyle(elementBelowCursor);
      changeCursorIcon(elementStyles.cursor);
      guidyCurrentCursorFocusedElement = elementBelowCursor;
      simulateHoverStylesAtPoint(
        getCurrentElementBelowCursor(boundingRect.x, boundingRect.y, true)
      );
    }
  }
}

/**
 * Changes the cursor icon
 * @param {String} icon Icon string from mapper
 */
function changeCursorIcon(icon) {
  if (!guidyCursor) return;
  const cursorIcon = guidyCursor.querySelector('.guidy-custom-cursor-icon');
  cursorIcon.innerHTML = customCursorIcons[icon] ?? customCursorIcons.default;
  guidyCursor.guidyCursorIcon = customCursorIcons[icon] ? icon : 'default';
}

/**
 * Simulates hover styles at a point
 * @param {HTMLElement[]} hoveredElements The elements below the cursor
 */
function simulateHoverStylesAtPoint(hoveredElements) {
  //cleanup css
  const cleanupElements = previousHoveredElements.filter(
    (element) => !hoveredElements.includes(element)
  );
  cleanupElements.forEach((element) => {
    if (element?.guidyOldStylesForCursor?.length) {
      element.guidyOldStylesForCursor.forEach(({ styles, targets }) => {
        targets.forEach((target) => {
          for (const [prop] of Object.entries(styles)) {
            target.style.removeProperty(prop);
          }
        });
      });
    }
    delete element.guidyOldStylesForCursor;
  });

  previousHoveredElements = hoveredElements;
  hoveredElements.forEach((element) => {
    const elementStyles = getHoverSelectorsForElement(element, hoverStyles);
    element.guidyOldStylesForCursor = elementStyles;
    elementStyles.forEach(({ styles, targets }) => {
      targets.forEach((target) => {
        for (const [prop, value] of Object.entries(styles)) {
          target.style.setProperty(prop, value);
        }
      });
    });
  });
}

/**
 * Patches the style of an element to watch for changes in position
 * @param {HTMLElement} el The element to patch
 */
function positionObserver(el) {
  const originalStyle = el.style;

  const proxy = new Proxy(originalStyle, {
    set(target, prop, value) {
      if (prop === 'top' || prop === 'left') {
        const prev = target[prop];
        if (prev !== value) {
          const event = new CustomEvent('positionchange', {
            detail: { prop, oldValue: prev, newValue: value },
          });
          el.dispatchEvent(event);
        }
      }
      target[prop] = value;
      return true;
    },
  });

  Object.defineProperty(el, 'style', {
    get: () => proxy,
    configurable: true,
  });
}
/**
 * Gets all hover styles from the document
 * @returns {Array} Array of hover styles
 */
function getAllHoverStyles() {
  const hoverStyles = [];

  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules || sheet.rules;
    } catch {
      continue; // skip CORS stylesheets
    }

    if (!rules) continue;

    for (const rule of rules) {
      if (rule.selectorText?.includes(':hover')) {
        hoverStyles.push(parseHoverRule(rule));
      }

      // nested media query rules
      if (rule.cssRules) {
        for (const nestedRule of rule.cssRules) {
          if (nestedRule.selectorText?.includes(':hover')) {
            hoverStyles.push(parseHoverRule(nestedRule));
          }
        }
      }
    }
  }

  return hoverStyles;
}

/**
 * Parses a CSS rule into a style object
 * @param {CSSRule} rule The CSS rule to parse
 * @returns {Object} The parsed style object
 */
function parseHoverRule(rule) {
  const styleObj = {};
  const cssText = rule.style.cssText;

  cssText.split(';').forEach((decl) => {
    const [prop, value] = decl.split(':').map((s) => s?.trim());
    if (prop && value) styleObj[prop] = value;
  });

  return {
    selector: rule.selectorText,
    styles: styleObj,
  };
}

/**
 * Gets all hover selectors for an element
 * @param {HTMLElement} element The element to get hover selectors for
 * @param {Array} hoverStyles The hover styles to search through
 * @returns {Array} Array of hover selectors
 */
function getHoverSelectorsForElement(element, hoverStyles) {
  const results = [];

  hoverStyles.forEach(({ selector, styles }) => {
    const selectorList = selector.split(',').map((sel) => sel.trim());

    selectorList.forEach((sel) => {
      // Match patterns like ".content:hover .overlay"
      const hoverMatch = sel.match(/(.+?:hover)(.*)/);
      if (!hoverMatch) return;
      const [_, hoverPart, targetPart] = hoverMatch;
      const hoverSelector = hoverPart.trim();
      const targetSelector = targetPart.trim();

      // Create a working selector without :hover to match elements
      const hoverTriggerSelector = hoverSelector.replace(/:hover/g, '').trim();

      if (element.matches(hoverTriggerSelector)) {
        let targetElements = [];

        try {
          // If targetSelector exists, query within the trigger element
          if (targetSelector) {
            targetElements = Array.from(
              element.querySelectorAll(targetSelector)
            );
          } else {
            // Otherwise, the hover target is the trigger itself
            targetElements = [element];
          }

          if (targetElements.length > 0) {
            results.push({
              selector: sel,
              styles,
              targets: targetElements,
            });
          }
        } catch (err) {
          console.log(err.message);
          // ignore invalid selectors
        }
      }
    });
  });

  return results;
}

const cursorGuideMap = [
  { key: '8', value: 'Up' },
  { key: '2', value: 'Down' },
  { key: '4', value: 'Left' },
  { key: '6', value: 'Right' },
  { key: '5', value: 'Left Click' },
  { key: '/', value: 'Right Click' },
  { key: '+', value: 'Double Click' },
  { key: 'Shift', value: 'Hold shift for fast movement' },
];
function mouseKeyIndicator() {
  guidyCursorIndicator = document.createElement('div');
  const cursorIndicatorChild = document.createElement('div');
  cursorIndicatorChild.classList.add('woAcc-shortCutsDivWrapper-child');
  guidyCursorIndicator.appendChild(cursorIndicatorChild);
  guidyCursorIndicator.classList.add(shortCutDivId);

  const header = document.createElement('div');
  header.classList.add('woAcc-shortCutsDiv-header');
  const heading = document.createElement('div');
  header.appendChild(heading);
  header.style.paddingBottom = '5px';
  heading.setAttribute('data-translate', 'Mouse Control Guide');
  heading.innerText = getTranslations('Mouse Control Guide');
  const closeButton = document.createElement('div');
  closeButton.innerHTML = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.4375 4.06865C11.3797 4.01071 11.311 3.96474 11.2354 3.93338C11.1598 3.90201 11.0787 3.88587 10.9969 3.88587C10.915 3.88587 10.834 3.90201 10.7584 3.93338C10.6828 3.96474 10.6141 4.01071 10.5563 4.06865L7.50002 7.11865L4.44377 4.0624C4.3859 4.00453 4.31721 3.95863 4.24161 3.92732C4.166 3.896 4.08497 3.87988 4.00314 3.87988C3.92131 3.87988 3.84028 3.896 3.76468 3.92732C3.68908 3.95863 3.62038 4.00453 3.56252 4.0624C3.50465 4.12026 3.45875 4.18895 3.42744 4.26456C3.39612 4.34016 3.38 4.42119 3.38 4.50302C3.38 4.58485 3.39612 4.66588 3.42744 4.74149C3.45875 4.81709 3.50465 4.88578 3.56252 4.94365L6.61877 7.9999L3.56252 11.0561C3.50465 11.114 3.45875 11.1827 3.42744 11.2583C3.39612 11.3339 3.38 11.4149 3.38 11.4968C3.38 11.5786 3.39612 11.6596 3.42744 11.7352C3.45875 11.8108 3.50465 11.8795 3.56252 11.9374C3.62038 11.9953 3.68908 12.0412 3.76468 12.0725C3.84028 12.1038 3.92131 12.1199 4.00314 12.1199C4.08497 12.1199 4.166 12.1038 4.24161 12.0725C4.31721 12.0412 4.3859 11.9953 4.44377 11.9374L7.50002 8.88114L10.5563 11.9374C10.6141 11.9953 10.6828 12.0412 10.7584 12.0725C10.834 12.1038 10.9151 12.1199 10.9969 12.1199C11.0787 12.1199 11.1598 12.1038 11.2354 12.0725C11.311 12.0412 11.3797 11.9953 11.4375 11.9374C11.4954 11.8795 11.5413 11.8108 11.5726 11.7352C11.6039 11.6596 11.62 11.5786 11.62 11.4968C11.62 11.4149 11.6039 11.3339 11.5726 11.2583C11.5413 11.1827 11.4954 11.114 11.4375 11.0561L8.38127 7.9999L11.4375 4.94365C11.675 4.70615 11.675 4.30615 11.4375 4.06865Z" fill="white"/>
</svg>`;
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    const infoDiv = getElementReference('guidyCursorIndicator');
    if (infoDiv) {
      floatingButtonsChild['mouseKeys']?.innerHTML
        ? (floatingButtonsChild['mouseKeys'].innerHTML =
            floatingButtonsData['mouseKeys']?.icon)
        : null;
      floatingButtonsChild['mouseKeys']?.classList.remove('active');
      infoDiv.style.display = 'none';
    }
  };
  header.appendChild(closeButton);
  cursorIndicatorChild.appendChild(header);

  cursorGuideMap.map(({ key, value }) => {
    console.log(key, value);
    const shortCutDiv = document.createElement('div');
    shortCutDiv.classList.add('woAcc-shortCutsDiv');
    // if (shortcut === shortCuts[shortcut]) {
    //   shortCutDiv.innerHTML += `<h4>${shortcut}</h4>`;
    // } else {
    shortCutDiv.innerHTML += `<div class="woAcc-shortcutKey">${key}</div><div class="woAcc-shortcutDesc" data-translate="${value}">${getTranslations(value)}</div>`;
    // }
    cursorIndicatorChild.appendChild(shortCutDiv);
  });
  return guidyCursorIndicator;
}
//#endregion

//#region Filter Keys Implementation

/**
 * Handles the filter keys implementation
 * @param {String} newKey The new key to implement
 * @param {String} fieldId field id for mouse keys
 * @returns {void}
 */
function filterKeysImplementer(newKey) {
  if (newKey === 'default') {
    stopFilterKeys();
  } else if (
    ['filterKeysSlow', 'filterKeysMid', 'filterKeysFast'].includes(newKey)
  ) {
    if (newKey === 'filterKeysSlow') {
      FilterKeyThreshold = 1000;
    } else if (newKey === 'filterKeysMid') {
      FilterKeyThreshold = 500;
    } else {
      FilterKeyThreshold = 300;
    }
    startFilterKeys();
  }
}
/**
 * Stops the filter keys
 */
function stopFilterKeys() {
  document.removeEventListener('keydown', filterKeysHandler);
}

/**
 * Starts the filter keys
 */
function startFilterKeys() {
  document.addEventListener('keydown', filterKeysHandler);
}

/**
 * Handles the filter keys handler
 * @param {Event} event The event object
 */
function filterKeysHandler(event) {
  if (!isKeyReadyToAccept) {
    event.preventDefault();
    return;
  }
  if (!['Shift', 'Control', 'Meta', 'Alt'].includes(event.key)) startCooldown();
}

/**
 * Starts the cooldown
 * @summary Used requestAnimationFrame for faster performance
 */
const startCooldown = () => {
  isKeyReadyToAccept = false;
  let startTime = null;

  const tick = (timestamp) => {
    if (startTime === null) startTime = timestamp;
    if (timestamp - startTime >= FilterKeyThreshold) {
      isKeyReadyToAccept = true;
    } else {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};
//#endregion

//#region Toggle Keys Implementation

/**
 * Handles the toggle keys implementation
 * @param {String} newKey The new key to implement
 * @param {String} fieldId field id for mouse keys
 * @returns {void}
 */
function toggleKeysImplementer(newKey) {
  if (newKey === 'default') {
    stopToggleKeys();
  } else if (newKey === 'toggleKeys') {
    startToggleKeys();
  }
}

/**
 * Stops the toggle keys
 */
function stopToggleKeys() {
  if (toggleAudio) {
    document.removeEventListener('keydown', toggleKeysHandler);
    removeToggleAudio();
  }
}

/**
 * Starts the toggle keys
 */
function startToggleKeys() {
  if (!toggleAudio) {
    toggleAudio = initializeToggleSound();
    document.addEventListener('keydown', toggleKeysHandler);
  }
}

/**
 * Handles the toggle keys handler
 * @param {Event} event The event object
 */
function toggleKeysHandler(event) {
  if (['CapsLock', 'NumLock', 'ScrollLock', 'Clear'].includes(event.key)) {
    playToggleAudio();
  }
}

/**
 * Initializes the toggle sound
 * @returns {HTMLAudioElement} The audio element
 */
function initializeToggleSound() {
  const audioElement = new Audio(`${staticPath}audio/keyclick.mp3`);
  return audioElement;
}

/**
 * Plays the toggle audio
 */
function playToggleAudio() {
  if (toggleAudio) {
    toggleAudio.currentTime = 0;
    toggleAudio.play();
  }
}

/**
 * Removes the toggle audio
 */
function removeToggleAudio() {
  if (toggleAudio) {
    toggleAudio.remove();
    toggleAudio = null;
  }
}

//#endregion

//#region Text Simplifier Implementation
/**
 * Calls dashboard for simplification and shows tooltip
 */
function summarizeText() {
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    summarizationTooltip.style.left = `${rect.left + window.scrollX}px`;
    summarizationTooltip.style.top = `${rect.bottom + window.scrollY}px`;
    summarizationTooltip.style.display = 'block';
    summarizationTooltip.textContent = `${getTranslations('Loading')}...`;
    callGuidyDashboard({
      path: 'summarize',
      body: { text: selectedText },
    }).then((summary) => {
      if (!(summary instanceof Error)) {
        if (summary.trim() === 'Text not found') {
          summarizationTooltip.textContent = selectedText;
        } else {
          summarizationTooltip.textContent = summary;
        }
      }
    });
  }
}

/**
 * Handles the text summarizer
 * @returns {void}
 */
function handleTextSummarizer() {
  if (summarizationEventBucket.length) return;
  document.body.addEventListener('mouseup', summarizeText);
  summarizationEventBucket.push({
    event: 'mouseup',
    handler: summarizeText,
    target: document.body,
  });
  addSummarizationTooltip();
  document.addEventListener('mousedown', removeSummarizationTooltip);
}

/**
 * Adds the summarization tooltip to rootElement
 * @returns {void}
 */
function addSummarizationTooltip() {
  summarizationTooltip = document.createElement('div');
  summarizationTooltip.classList.add('guidy-summary-tooltip');
  summarizationTooltip.id = 'guidy-summary-tooltip';
  document.body.appendChild(summarizationTooltip);
}

/**
 * Removes the summarization tooltip
 * @returns {void}
 */
function removeSummarizationTooltip() {
  if (summarizationTooltip) {
    summarizationTooltip.style.display = 'none';
    summarizationTooltip.textContent = '';
  }
}

/**
 * Terminates the text summarization
 * @returns {void}
 */
function stopTextSummrizer() {
  summarizationEventBucket.forEach(({ event, handler, target }) => {
    target.removeEventListener(event, handler);
  });
  document.removeEventListener('mousedown', removeSummarizationTooltip);
  summarizationTooltip?.remove?.();
  summarizationTooltip = null;
}
/**
 * Focus the next focusable element
 * @returns {void}
 */
function focusNextElement() {
  const focusableElements = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
  ];
  document
    .querySelector('.guidy-focused')
    ?.classList?.remove?.('guidy-focused');
  const allElements = Array.from(
    document.querySelectorAll(focusableElements.join(','))
  ).filter(
    (el) => !el.disabled && el.offsetParent !== null && el.tabIndex != -1
  ); // Filter visible and enabled elements

  const currentIndex = allElements.indexOf(document.activeElement);
  const nextIndex = (currentIndex + 1) % allElements.length;
  const element = allElements[nextIndex];
  element.classList.add('guidy-focused');
  element.focus({ focusVisible: true });
  if (localConfig?.partialReader && localConfig?.partialReader !== 'default')
    handlePartialScreenReaderClick({ target: element });
}

//#endregion

/**
 * Focus the previous focusable element
 * @returns {void}
 */
function focusPreviousElement() {
  const focusableElements = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
  ];
  document
    .querySelector('.guidy-focused')
    ?.classList?.remove?.('guidy-focused');
  const allElements = Array.from(
    document.querySelectorAll(focusableElements.join(','))
  ).filter(
    (el) => !el.disabled && el.offsetParent !== null && el.tabIndex != -1
  ); // Filter visible and enabled elements

  const currentIndex = allElements.indexOf(document.activeElement);
  const previousIndex =
    (currentIndex - 1 + allElements.length) % allElements.length;

  const element = allElements[previousIndex];
  element.classList.add('guidy-focused');
  element.focus({ focusVisible: true });
  if (localConfig?.partialReader && localConfig?.partialReader !== 'default')
    handlePartialScreenReaderClick({ target: element });
}

/**
 *
 * Focus the first visible focusable element
 */
function focusFirstVisibleElement() {
  const focusableSelectors = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
  ];

  // Remove previous focus
  document.querySelector('.guidy-focused')?.classList?.remove('guidy-focused');

  const allElements = Array.from(
    document.querySelectorAll(focusableSelectors.join(','))
  ).filter(
    (el) =>
      !el.disabled &&
      el.offsetParent !== null &&
      !el.classList.contains('woAcc-modal') &&
      (window.scrollY > 0 ? !el.closest('nav') : true) &&
      el.tabIndex != -1
  );

  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  const firstVisibleElement = allElements.find((el) => {
    const rect = el.getBoundingClientRect();
    console.log(rect);
    const fullyVisible =
      Math.floor(rect.top) >= 20 &&
      Math.floor(rect.left) >= 0 &&
      Math.ceil(rect.bottom) <= viewportHeight &&
      Math.ceil(rect.right) <= viewportWidth;

    return fullyVisible;
  });

  if (firstVisibleElement) {
    firstVisibleElement.classList.add('guidy-focused');
    firstVisibleElement.focus({ focusVisible: true });
    if (localConfig?.partialReader && localConfig?.partialReader !== 'default')
      handlePartialScreenReaderClick({ target: firstVisibleElement });
  }
}

function handleHeadGestures(gesture) {
  switch (gesture) {
    case 'Left':
      focusPreviousElement();
      // window.scrollBy({ top: 0, left: -100, behavior: 'smooth' });
      break;
    case 'Right':
      focusNextElement();
      // window.scrollBy({ top: 0, left: 100, behavior: 'smooth' });
      break;
    case 'Up':
      window.scrollBy({ top: -800, left: 0, behavior: 'smooth' });
      setTimeout(() => {
        focusFirstVisibleElement();
      }, 600);
      break;
    case 'Down':
      window.scrollBy({ top: 800, left: 0, behavior: 'smooth' });
      setTimeout(() => {
        focusFirstVisibleElement();
      }, 600);
      break;
    case 'Blink':
      document.activeElement?.click?.();
      break;
    default:
      console.log('Head gesture not handled:', gesture);
  }
}
function handleSignGestures(gesture) {
  switch (gesture) {
    case 'index_left':
      focusPreviousElement();
      // window.scrollBy({ top: 0, left: -100, behavior: 'smooth' });
      break;
    case 'index_right':
      focusNextElement();
      // window.scrollBy({ top: 0, left: 100, behavior: 'smooth' });
      break;
    case 'index_up':
      window.scrollBy({ top: -800, left: 0, behavior: 'smooth' });
      setTimeout(() => {
        focusFirstVisibleElement();
      }, 600);
      break;
    case 'index_down':
      window.scrollBy({ top: 800, left: 0, behavior: 'smooth' });
      setTimeout(() => {
        focusFirstVisibleElement();
      }, 600);
      break;
    case 'closed_hand':
      console.log('catcehed');
      document.activeElement?.click?.();
      break;
    default:
      console.log('Head gesture not handled:', gesture);
  }
}
function removeKeyboardShortCutsInfoDiv() {
  if (keyboardShortcut && keyboardShortcut.closest('#woAcc-RootEle')) {
    rootElement.removeChild(keyboardShortcut);
    keyboardShortcut = undefined;
  }
}

function getCursorSVG(key) {
  const cursorSVGs = {
    hand: `<svg xmlns="http://www.w3.org/2000/svg" width="${visuals.cursorIcon.cursorSize}" height="${visuals.cursorIcon.cursorSize}" viewBox="0 0 36 36" fill="${visuals.cursorIcon.cursorColor}">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M9.76234 24.8482C9.26116 24.2147 8.65234 22.9194 7.56881 21.347C6.95469 20.4576 5.43175 18.7829 4.97822 17.9323C4.58469 17.1806 4.62704 16.8435 4.72057 16.2206C4.88646 15.1123 6.02293 14.2494 7.23528 14.3659C8.15116 14.4523 8.92763 15.0576 9.62646 15.6294C10.0482 15.9735 10.567 16.6423 10.8794 17.02C11.167 17.3659 11.2376 17.5088 11.5447 17.9182C11.9506 18.46 12.0776 18.7282 11.9223 18.1317C11.797 17.2565 11.5923 15.7617 11.2959 14.44C11.07 13.4376 11.0153 13.2806 10.8 12.5112C10.5723 11.6923 10.4559 11.1188 10.2423 10.2506C10.0941 9.63645 9.82763 8.38175 9.75528 7.67586C9.65469 6.71057 9.60175 5.13645 10.2212 4.41292C10.7065 3.84645 11.82 3.67528 12.51 4.02469C13.4135 4.48175 13.927 5.79469 14.1618 6.31881C14.5835 7.26116 14.8447 8.34998 15.0723 9.77939C15.3617 11.5988 15.8947 14.1241 15.9123 14.6553C15.9547 14.0041 15.7923 12.6329 15.9053 12.0082C16.0076 11.4417 16.4841 10.7835 17.0806 10.6053C17.5853 10.4553 18.1765 10.4006 18.697 10.5082C19.2494 10.6212 19.8317 11.0165 20.0488 11.3888C20.6876 12.49 20.7 14.74 20.7265 14.62C20.8782 13.9565 20.8517 12.4512 21.2276 11.8247C21.4747 11.4117 22.1047 11.0394 22.44 10.9794C22.9588 10.8876 23.5959 10.8594 24.1412 10.9653C24.5806 11.0517 25.1753 11.5741 25.3359 11.8247C25.7206 12.4317 25.9394 14.1488 26.0047 14.7506C26.0312 14.9994 26.1353 14.0588 26.5217 13.4517C27.2382 12.3241 29.7741 12.1053 29.8712 14.5794C29.9153 15.7335 29.9065 15.6806 29.9065 16.457C29.9065 17.3694 29.8853 17.9182 29.8359 18.5782C29.7812 19.2841 29.6294 20.8794 29.4088 21.6523C29.257 22.1835 28.7541 23.3782 28.2582 24.0947C28.2582 24.0947 26.3629 26.3006 26.1565 27.2941C25.9482 28.2859 26.017 28.2929 25.9765 28.997C25.9359 29.6994 26.19 30.6241 26.19 30.6241C26.19 30.6241 24.7747 30.8076 24.0123 30.6859C23.3223 30.5747 22.4682 29.2017 22.2476 28.7817C21.9441 28.2029 21.2965 28.3141 21.0441 28.7412C20.647 29.417 19.7929 30.6294 19.1894 30.7053C18.0106 30.8535 15.5647 30.76 13.65 30.7406C13.65 30.7406 13.9765 28.9565 13.2494 28.3441C12.7112 27.887 11.7847 26.9606 11.2306 26.4735L9.76234 24.8482Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M9.76234 24.8482C9.26116 24.2147 8.65234 22.9194 7.56881 21.347C6.95469 20.4576 5.43175 18.7829 4.97822 17.9323C4.58469 17.1806 4.62704 16.8435 4.72057 16.2206C4.88646 15.1123 6.02293 14.2494 7.23528 14.3659C8.15116 14.4523 8.92763 15.0576 9.62646 15.6294C10.0482 15.9735 10.567 16.6423 10.8794 17.02C11.167 17.3659 11.2376 17.5088 11.5447 17.9182C11.9506 18.46 12.0776 18.7282 11.9223 18.1317C11.797 17.2565 11.5923 15.7617 11.2959 14.44C11.07 13.4376 11.0153 13.2806 10.8 12.5112C10.5723 11.6923 10.4559 11.1188 10.2423 10.2506C10.0941 9.63645 9.82763 8.38175 9.75528 7.67586C9.65469 6.71057 9.60175 5.13645 10.2212 4.41292C10.7065 3.84645 11.82 3.67528 12.51 4.02469C13.4135 4.48175 13.927 5.79469 14.1618 6.31881C14.5835 7.26116 14.8447 8.34998 15.0723 9.77939C15.3617 11.5988 15.8947 14.1241 15.9123 14.6553C15.9547 14.0041 15.7923 12.6329 15.9053 12.0082C16.0076 11.4417 16.4841 10.7835 17.0806 10.6053C17.5853 10.4553 18.1765 10.4006 18.697 10.5082C19.2494 10.6212 19.8317 11.0165 20.0488 11.3888C20.6876 12.49 20.7 14.74 20.7265 14.62C20.8782 13.9565 20.8517 12.4512 21.2276 11.8247C21.4747 11.4117 22.1047 11.0394 22.44 10.9794C22.9588 10.8876 23.5959 10.8594 24.1412 10.9653C24.5806 11.0517 25.1753 11.5741 25.3359 11.8247C25.7206 12.4317 25.9394 14.1488 26.0047 14.7506C26.0312 14.9994 26.1353 14.0588 26.5217 13.4517C27.2382 12.3241 29.7741 12.1053 29.8712 14.5794C29.9153 15.7335 29.9065 15.6806 29.9065 16.457C29.9065 17.3694 29.8853 17.9182 29.8359 18.5782C29.7812 19.2841 29.6294 20.8794 29.4088 21.6523C29.257 22.1835 28.7541 23.3782 28.2582 24.0947C28.2582 24.0947 26.3629 26.3006 26.1565 27.2941C25.9482 28.2859 26.017 28.2929 25.9765 28.997C25.9359 29.6994 26.19 30.6241 26.19 30.6241C26.19 30.6241 24.7747 30.8076 24.0123 30.6859C23.3223 30.5747 22.4682 29.2017 22.2476 28.7817C21.9441 28.2029 21.2965 28.3141 21.0441 28.7412C20.647 29.417 19.7929 30.6294 19.1894 30.7053C18.0106 30.8535 15.5647 30.76 13.65 30.7406C13.65 30.7406 13.9765 28.9565 13.2494 28.3441C12.7112 27.887 11.7847 26.9606 11.2306 26.4735L9.76234 24.8482Z" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24.2949 25.4752V19.3711" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>
  <path d="M20.7372 25.496L20.709 19.3672" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>
  <path d="M17.2148 19.4219L17.2519 25.4678" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>
  </svg>`,
    italic: `<svg xmlns="http://www.w3.org/2000/svg" width="${visuals.cursorIcon.cursorSize}" height="${visuals.cursorIcon.cursorSize}" viewBox="0 0 36 36" fill="${visuals.cursorIcon.cursorColor}">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M17.3604 6V29.986H19.3324V6H17.3604Z" fill="#currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M15.333 18V19.968H21.333V18H15.333Z" fill="#currentColor"/>
  <path d="M19.333 7C19.7181 6.08419 21.0326 4.67384 21.8859 4.20677C22.6931 3.76169 23.5233 3.38254 24.3166 3.1829C25.2875 2.93563 27.333 3.01072 27.333 3.01072" stroke="#currentColor"/>
  <path d="M17.333 7C16.9758 6.03928 15.5028 4.56617 14.8469 4.16541C14.0625 3.68962 13.1918 3.38219 12.3887 3.18273C11.4036 2.93569 9.33301 3.01071 9.33301 3.01071" stroke="#currentColor"/>
  <path d="M19.333 29C19.7181 29.9158 21.0326 31.3262 21.8859 31.7932C22.6931 32.2383 23.5233 32.6175 24.3166 32.8171C25.2875 33.0644 27.333 32.9893 27.333 32.9893" stroke="#currentColor"/>
  <path d="M17.333 29C16.9758 29.9607 15.5028 31.4338 14.8469 31.8346C14.0625 32.3104 13.1918 32.6178 12.3887 32.8173C11.4036 33.0643 9.33301 32.9893 9.33301 32.9893" stroke="#currentColor"/>
  </svg>`,
    bigCursor: `<svg xmlns="http://www.w3.org/2000/svg" width="${visuals.cursorIcon.cursorSize}" height="${visuals.cursorIcon.cursorSize}" viewBox="0 0 36 36" fill="${visuals.cursorIcon.cursorColor}">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.12598 29.3632V3L27.2065 22.1267H16.044L15.3674 22.3308L8.12598 29.3632Z" fill="#currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M23.0811 30.4713L17.1467 32.9982L9.43945 14.744L15.5072 12.1875L23.0811 30.4713Z" fill="#currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M20.8847 29.3513L17.8492 30.6254L12.7461 18.4867L15.7767 17.2109L20.8847 29.3513Z" fill="#currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M9.77246 6.96094V25.3781L14.6599 20.6602L15.3644 20.4314H23.2133L9.77246 6.96094Z" fill="#currentColor"/>
  </svg>`,
  };

  return cursorSVGs[key];
}

const CUSTOM_CURSOR_CLASS = 'woAcc-FCURSOR-custom';

function removeCustomCursor() {
  document.body.classList.remove(CUSTOM_CURSOR_CLASS);
  document.body.style.removeProperty('--woAcc-custom-cursor-url');
  lastCursorKey = 'default';
}

function createCustomCursor(newKey) {
  if (newKey && newKey !== 'default') {
    const svg = getCursorSVG(newKey);
    const encodedSvg = encodeURIComponent(svg);
    const cursorUrl = `data:image/svg+xml,${encodedSvg}`;
    const halfSize = Math.floor(visuals.cursorIcon.cursorSize / 2);

    document.body.style.setProperty(
      '--woAcc-custom-cursor-url',
      `url(${cursorUrl}) ${halfSize} ${halfSize}, auto`
    );
    document.body.classList.add(CUSTOM_CURSOR_CLASS);
    lastCursorKey = newKey;
  }
}

function removeAllReadingGuides() {
  mouseMoveListeners.forEach((listener) => {
    document.body.removeEventListener('mousemove', listener);
  });

  mouseMoveListeners.length = 0;
  readingGuide?.remove?.();
  readingGuide = null;

  readingMask?.remove?.();
  readingMask?.remove?.();
  readingMask = null;

  if (simpleRuler && simpleRuler.closest('.woAcc-RootEle')) {
    rootElement.removeChild(simpleRuler);
    simpleRuler = undefined;
  }
}

function handleReadingGuide(newKey) {
  removeAllReadingGuides();
  switch (newKey) {
    case 'readingGuide':
      createReadingGuide();
      break;
    case 'readingMask':
      handleReadingMask();
      break;
    case 'simpleRuler':
      handleSimpleRuler();
      break;
    case 'rulerWithHighlighter':
      handleSimpleRuler();
      handleSimpleRulerWithHighlighter();
      break;
    default:
      break;
  }
}

function hasDirectTextNode(element) {
  for (let node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
      return true;
    }
  }
  return false;
}

let isLoading = false;

const hyphanateText = (e) => {
  const element = e.target;
  if (e.target.nodeName.toLowerCase() !== 'syllabic' && !isLoading) {
    element.classList.remove('woAcc-syllabic-hover');
    let oldHTML = element.innerHTML;
    oldHTML = oldHTML.replace(/<\/?syllabic[^>]*>/g, '');
    if (oldHTML.includes('<syllabic>')) {
      document.body.click();
    }
    if (!element.oldGuidyHtml) {
      element.oldGuidyHtml = oldHTML;
    }
    let language = getDataById('woAccessibilityLang');
    language = language === 'en' ? 'en-gb' : language;
    let separator;
    switch (syllabicDivision) {
      case 'separatorDash':
      case 'separatorColor':
      case 'separatorHighlight':
      case 'separatorUnderline':
        separator = '-';
        break;
      case 'separatorDot':
        separator = '.';
        break;
    }
    isLoading = true;
    // getSyllables({ text: oldHTML, separator, language })
    callGuidyDashboard({
      path: 'hyphenate',
      body: { text: oldHTML, separator, language },
    })
      .then((text) => {
        if (!(text instanceof Error)) {
          if (
            (syllabicDivision === 'separatorDash' ||
              syllabicDivision === 'separatorDot') &&
            oldHTML !== text
          ) {
            element.innerHTML = text;
          } else if (
            syllabicDivision === 'separatorColor' ||
            syllabicDivision === 'separatorHighlight' ||
            syllabicDivision === 'separatorUnderline'
          ) {
            const transformedText = colorSyllables(text);
            element.innerHTML = transformedText;
          }
          document.body.addEventListener(
            'click',
            () => (element.innerHTML = element.oldGuidyHtml),
            { once: true }
          );
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        isLoading = false;
      });
  }
};
function colorSyllables(text) {
  function applyColorToText(text) {
    const colors = ['color1', 'color2'];
    const background = ['bg1', 'bg2'];
    const segments = text.split(/(\s+)/);
    let html = '';
    let colorIndex = 0;

    segments.forEach((segment) => {
      if (segment === ' ') {
        html += segment;
      } else {
        const syllables = segment
          .trim()
          .split('-')
          .filter((syllable) => syllable !== '');
        html += '<Syllabic>';
        syllables.forEach((syllable) => {
          if (syllabicDivision == 'separatorColor') {
            html += `<Syllabic class="syllable ${colors[colorIndex]}">${syllable}</Syllabic>`;
          } else if (syllabicDivision == 'separatorHighlight') {
            html += `<Syllabic class="syllable ${background[colorIndex]}">${syllable}</Syllabic>`;
          } else {
            html += `<Syllabic class="syllable syllabicUnderline">${syllable}</Syllabic>`;
          }
          colorIndex = (colorIndex + 1) % colors.length;
        });
        html += '</Syllabic>';
      }
    });

    return html;
  }

  const tempDiv = document.createElement('syllabic');
  tempDiv.innerHTML = text;

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return applyColorToText(node.textContent);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const attributes = Array.from(node.attributes)
        .map((attr) => ` ${attr.name}="${attr.value}"`)
        .join('');

      const selfClosingTags = ['br', 'img', 'hr', 'input', 'meta', 'link'];

      if (selfClosingTags.includes(tagName)) {
        return `<${tagName}${attributes} />`;
      } else {
        const childrenHtml = Array.from(node.childNodes)
          .map((child) => processNode(child))
          .join('');

        return `<${tagName}${attributes}>${childrenHtml}</${tagName}>`;
      }
    }
    return '';
  }

  return processNode(tempDiv);
}

const handleSyllabicDivisionHover = (e) => {
  const element = e.target;
  if (hasDirectTextNode(element)) {
    element.classList.add('woAcc-syllabic-hover');
    element.addEventListener('click', hyphanateText, { once: true });
    element.onmouseleave = () => {
      element.removeEventListener('click', hyphanateText);
      element.classList.remove('woAcc-syllabic-hover');
    };
  }
};

function removeSyllabicDivision() {
  document.removeEventListener('mouseover', handleSyllabicDivisionHover);
  syllabicDivision = undefined;
}

function handleSyllabicDivision(newKey) {
  if (newKey !== 'default') {
    removeSyllabicDivision();
    syllabicDivision = newKey;
    document.addEventListener('mouseover', handleSyllabicDivisionHover);
  }
}

function handleSimpleRuler() {
  simpleRuler = document.createElement('div');
  simpleRuler.classList.add('woAcc-ruler');
  rootElement.appendChild(simpleRuler);
  const mouseMoveEvent = handleCursorMove;
  document.body.addEventListener('mousemove', mouseMoveEvent);
  mouseMoveListeners.push(mouseMoveEvent);
}

function handleSimpleRulerWithHighlighter() {
  simpleRuler?.classList.remove('woAcc-rulerHighlighter');
  simpleRuler.classList.add('woAcc-rulerHighlighter');
}

function handleVisuals(key, fieldId, newKey) {
  visuals[key][fieldId] = newKey;
  setInitialStyles();
  styleElement.innerHTML = initialCSStyles;
}

function handleRemoveShadows(newKey) {
  toggleBodyClass('woAcc-no-shadows', newKey);
}

function handleRemoveItalics(newKey) {
  toggleBodyClass('woAcc-no-italic', newKey);
}

function handleRemoveUnderlines(newKey) {
  toggleBodyClass('woAcc-no-underline', newKey);
}

function toggleBodyClass(className, newKey) {
  document.body.classList.remove(className);
  if (newKey !== 'default') {
    document.body.classList.add(className);
  }
}

function getElementReference(key) {
  switch (key) {
    case 'voiceNavigation':
      return voiceNavigation;
    case 'virtualKeyboard':
      return virtualKeyboard;
    case 'keyboardShortcut':
      return keyboardShortcut;
    case 'keyboardNavigation':
      return keyboardNavigation;
    case 'guidyCursorIndicator':
    case 'mouseKeys':
      return guidyCursorIndicator;
  }
}

const handleFloatingButtonChildClick = (event, keyInput) => {
  event?.stopPropagation();
  let isActive = false;
  const elementKey = event?.currentTarget.getAttribute('guidy-key') || keyInput;
  Object.keys(floatingButtonsChild).map((key) => {
    if (key === elementKey) {
      if (floatingButtonsChild[key]?.classList.contains('active')) {
        floatingButtonsChild[key]?.innerHTML
          ? (floatingButtonsChild[key].innerHTML =
              floatingButtonsData[key]?.icon)
          : null;
        floatingButtonsChild[key].classList.remove('active');
        getElementReference(key).style.display = 'none';
      } else {
        floatingButtonsChild[key]?.classList.add('active');
        floatingButtonsChild[key]?.innerHTML
          ? (floatingButtonsChild[key].innerHTML =
              floatingButtonsData[key]?.activeIcon)
          : null;
        if (getElementReference(key)) {
          getElementReference(key).style.display = 'block';
          isActive = true;
          translateContent();
        }
      }
    } else {
      floatingButtonsChild[key]?.classList.remove('active');
      floatingButtonsChild[key]?.innerHTML
        ? (floatingButtonsChild[key].innerHTML = floatingButtonsData[key]?.icon)
        : null;
      if (getElementReference(key)) {
        getElementReference(key).style.display = 'none';
      }
    }
  });
  if (elementKey === 'virtualKeyboard') {
    if (isActive) {
      alwaysOnGuidyBoard = true;
      return;
    }
    alwaysOnGuidyBoard = false;
  }
};

const floatingButtonsChild = {};

const floatingButtonsData = {
  voiceNavigation: {
    icon: `<svg width="45" height="46" viewBox="0 0 45 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="0.5" width="45" height="45" rx="22.5" fill="white"/>
<g clip-path="url(#clip0_2725_222)">
<path d="M22.5 14C22.7449 14 22.9813 14.09 23.1644 14.2527C23.3474 14.4155 23.4643 14.6397 23.493 14.883L23.5 15V31C23.4997 31.2549 23.4021 31.5 23.2272 31.6854C23.0522 31.8707 22.813 31.9822 22.5586 31.9972C22.3042 32.0121 22.0536 31.9293 21.8582 31.7657C21.6627 31.6021 21.5371 31.3701 21.507 31.117L21.5 31V15C21.5 14.7348 21.6054 14.4804 21.7929 14.2929C21.9804 14.1054 22.2348 14 22.5 14ZM18.5 17C18.7652 17 19.0196 17.1054 19.2071 17.2929C19.3946 17.4804 19.5 17.7348 19.5 18V28C19.5 28.2652 19.3946 28.5196 19.2071 28.7071C19.0196 28.8946 18.7652 29 18.5 29C18.2348 29 17.9804 28.8946 17.7929 28.7071C17.6054 28.5196 17.5 28.2652 17.5 28V18C17.5 17.7348 17.6054 17.4804 17.7929 17.2929C17.9804 17.1054 18.2348 17 18.5 17ZM26.5 17C26.7652 17 27.0196 17.1054 27.2071 17.2929C27.3946 17.4804 27.5 17.7348 27.5 18V28C27.5 28.2652 27.3946 28.5196 27.2071 28.7071C27.0196 28.8946 26.7652 29 26.5 29C26.2348 29 25.9804 28.8946 25.7929 28.7071C25.6054 28.5196 25.5 28.2652 25.5 28V18C25.5 17.7348 25.6054 17.4804 25.7929 17.2929C25.9804 17.1054 26.2348 17 26.5 17ZM14.5 20C14.7652 20 15.0196 20.1054 15.2071 20.2929C15.3946 20.4804 15.5 20.7348 15.5 21V25C15.5 25.2652 15.3946 25.5196 15.2071 25.7071C15.0196 25.8946 14.7652 26 14.5 26C14.2348 26 13.9804 25.8946 13.7929 25.7071C13.6054 25.5196 13.5 25.2652 13.5 25V21C13.5 20.7348 13.6054 20.4804 13.7929 20.2929C13.9804 20.1054 14.2348 20 14.5 20ZM30.5 20C30.7449 20 30.9813 20.09 31.1644 20.2527C31.3474 20.4155 31.4643 20.6397 31.493 20.883L31.5 21V25C31.4997 25.2549 31.4021 25.5 31.2272 25.6854C31.0522 25.8707 30.813 25.9822 30.5586 25.9972C30.3042 26.0121 30.0536 25.9293 29.8582 25.7657C29.6627 25.6021 29.5371 25.3701 29.507 25.117L29.5 25V21C29.5 20.7348 29.6054 20.4804 29.7929 20.2929C29.9804 20.1054 30.2348 20 30.5 20Z" fill="#00499E"/>
</g>
<defs>
<clipPath id="clip0_2725_222">
<rect width="24" height="24" fill="white" transform="translate(10.5 11)"/>
</clipPath>
</defs>
</svg>`,
    activeIcon: `<svg width="45" height="46" viewBox="0 0 45 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="0.5" width="45" height="45" rx="22.5" fill="white"/>
<rect y="0.5" width="45" height="45" rx="22.5" fill="url(#paint0_linear_2725_308)"/>
<g clip-path="url(#clip0_2725_308)">
<path d="M22.5 14C22.7449 14 22.9813 14.09 23.1644 14.2527C23.3474 14.4155 23.4643 14.6397 23.493 14.883L23.5 15V31C23.4997 31.2549 23.4021 31.5 23.2272 31.6854C23.0522 31.8707 22.813 31.9822 22.5586 31.9972C22.3042 32.0121 22.0536 31.9293 21.8582 31.7657C21.6627 31.6021 21.5371 31.3701 21.507 31.117L21.5 31V15C21.5 14.7348 21.6054 14.4804 21.7929 14.2929C21.9804 14.1054 22.2348 14 22.5 14ZM18.5 17C18.7652 17 19.0196 17.1054 19.2071 17.2929C19.3946 17.4804 19.5 17.7348 19.5 18V28C19.5 28.2652 19.3946 28.5196 19.2071 28.7071C19.0196 28.8946 18.7652 29 18.5 29C18.2348 29 17.9804 28.8946 17.7929 28.7071C17.6054 28.5196 17.5 28.2652 17.5 28V18C17.5 17.7348 17.6054 17.4804 17.7929 17.2929C17.9804 17.1054 18.2348 17 18.5 17ZM26.5 17C26.7652 17 27.0196 17.1054 27.2071 17.2929C27.3946 17.4804 27.5 17.7348 27.5 18V28C27.5 28.2652 27.3946 28.5196 27.2071 28.7071C27.0196 28.8946 26.7652 29 26.5 29C26.2348 29 25.9804 28.8946 25.7929 28.7071C25.6054 28.5196 25.5 28.2652 25.5 28V18C25.5 17.7348 25.6054 17.4804 25.7929 17.2929C25.9804 17.1054 26.2348 17 26.5 17ZM14.5 20C14.7652 20 15.0196 20.1054 15.2071 20.2929C15.3946 20.4804 15.5 20.7348 15.5 21V25C15.5 25.2652 15.3946 25.5196 15.2071 25.7071C15.0196 25.8946 14.7652 26 14.5 26C14.2348 26 13.9804 25.8946 13.7929 25.7071C13.6054 25.5196 13.5 25.2652 13.5 25V21C13.5 20.7348 13.6054 20.4804 13.7929 20.2929C13.9804 20.1054 14.2348 20 14.5 20ZM30.5 20C30.7449 20 30.9813 20.09 31.1644 20.2527C31.3474 20.4155 31.4643 20.6397 31.493 20.883L31.5 21V25C31.4997 25.2549 31.4021 25.5 31.2272 25.6854C31.0522 25.8707 30.813 25.9822 30.5586 25.9972C30.3042 26.0121 30.0536 25.9293 29.8582 25.7657C29.6627 25.6021 29.5371 25.3701 29.507 25.117L29.5 25V21C29.5 20.7348 29.6054 20.4804 29.7929 20.2929C29.9804 20.1054 30.2348 20 30.5 20Z" fill="white"/>
</g>
<defs>
<linearGradient id="paint0_linear_2725_308" x1="0" y1="23" x2="45" y2="23" gradientUnits="userSpaceOnUse">
<stop stop-color="#00499E"/>
<stop offset="1" stop-color="#1593EF"/>
</linearGradient>
<clipPath id="clip0_2725_308">
<rect width="24" height="24" fill="white" transform="translate(10.5 11)"/>
</clipPath>
</defs>
</svg>`,
  },

  keyboardShortcut: {
    icon: `<svg width="45" height="46" viewBox="0 0 45 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="0.5" width="45" height="45" rx="22.5" fill="white"/>
<path d="M17.25 18.5L20.25 20.75L17.25 23M21.75 23H24.75M15.75 31.25H29.25C29.8467 31.25 30.419 31.0129 30.841 30.591C31.2629 30.169 31.5 29.5967 31.5 29V17C31.5 16.4033 31.2629 15.831 30.841 15.409C30.419 14.9871 29.8467 14.75 29.25 14.75H15.75C15.1533 14.75 14.581 14.9871 14.159 15.409C13.7371 15.831 13.5 16.4033 13.5 17V29C13.5 29.5967 13.7371 30.169 14.159 30.591C14.581 31.0129 15.1533 31.25 15.75 31.25Z" stroke="#00499E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
    activeIcon: `<svg width="45" height="46" viewBox="0 0 45 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="0.5" width="45" height="45" rx="22.5" fill="white"/>
<rect y="0.5" width="45" height="45" rx="22.5" fill="url(#paint0_linear_2725_649)"/>
<path d="M17.25 18.5L20.25 20.75L17.25 23M21.75 23H24.75M15.75 31.25H29.25C29.8467 31.25 30.419 31.0129 30.841 30.591C31.2629 30.169 31.5 29.5967 31.5 29V17C31.5 16.4033 31.2629 15.831 30.841 15.409C30.419 14.9871 29.8467 14.75 29.25 14.75H15.75C15.1533 14.75 14.581 14.9871 14.159 15.409C13.7371 15.831 13.5 16.4033 13.5 17V29C13.5 29.5967 13.7371 30.169 14.159 30.591C14.581 31.0129 15.1533 31.25 15.75 31.25Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<defs>
<linearGradient id="paint0_linear_2725_649" x1="0" y1="23" x2="45" y2="23" gradientUnits="userSpaceOnUse">
<stop stop-color="#00499E"/>
<stop offset="1" stop-color="#1593EF"/>
</linearGradient>
</defs>
</svg>`,
  },

  virtualKeyboard: {
    icon: `<svg width="45" height="46" viewBox="0 0 45 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="0.5" width="45" height="45" rx="22.5" fill="white"/>
<g clip-path="url(#clip0_2725_223)">
<path d="M19.9286 20.8569H25.0715M14.7857 20.8569H16.5M28.5 20.8569H30.2143M14.7857 16.5712H16.5M19.3577 16.5712H21.072M23.928 16.5712H25.6423M28.5 16.5712H30.2143M19.0715 30.7141L22.5 34.1426L25.9286 30.7141M31.9286 11.8569H13.0715C12.6168 11.8569 12.1808 12.0375 11.8593 12.359C11.5378 12.6805 11.3572 13.1166 11.3572 13.5712V23.8569C11.3572 24.3116 11.5378 24.7476 11.8593 25.0691C12.1808 25.3906 12.6168 25.5712 13.0715 25.5712H31.9286C32.3833 25.5712 32.8193 25.3906 33.1408 25.0691C33.4623 24.7476 33.6429 24.3116 33.6429 23.8569V13.5712C33.6429 13.1166 33.4623 12.6805 33.1408 12.359C32.8193 12.0375 32.3833 11.8569 31.9286 11.8569Z" stroke="#00499E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_2725_223">
<rect width="24" height="24" fill="white" transform="translate(10.5 11)"/>
</clipPath>
</defs>
</svg>`,
    activeIcon: `<svg width="45" height="46" viewBox="0 0 45 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="0.5" width="45" height="45" rx="22.5" fill="white"/>
<rect y="0.5" width="45" height="45" rx="22.5" fill="url(#paint0_linear_2725_264)"/>
<g clip-path="url(#clip0_2725_264)">
<path d="M19.9285 20.8569H25.0714M14.7857 20.8569H16.5M28.5 20.8569H30.2143M14.7857 16.5712H16.5M19.3577 16.5712H21.072M23.928 16.5712H25.6423M28.5 16.5712H30.2143M19.0714 30.7141L22.5 34.1426L25.9285 30.7141M31.9285 11.8569H13.0714C12.6167 11.8569 12.1807 12.0375 11.8592 12.359C11.5377 12.6805 11.3571 13.1166 11.3571 13.5712V23.8569C11.3571 24.3116 11.5377 24.7476 11.8592 25.0691C12.1807 25.3906 12.6167 25.5712 13.0714 25.5712H31.9285C32.3832 25.5712 32.8192 25.3906 33.1407 25.0691C33.4622 24.7476 33.6428 24.3116 33.6428 23.8569V13.5712C33.6428 13.1166 33.4622 12.6805 33.1407 12.359C32.8192 12.0375 32.3832 11.8569 31.9285 11.8569Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<linearGradient id="paint0_linear_2725_264" x1="0" y1="23" x2="45" y2="23" gradientUnits="userSpaceOnUse">
<stop stop-color="#00499E"/>
<stop offset="1" stop-color="#1593EF"/>
</linearGradient>
<clipPath id="clip0_2725_264">
<rect width="24" height="24" fill="white" transform="translate(10.5 11)"/>
</clipPath>
</defs>
</svg>`,
  },

  keyboardNavigation: {
    icon: `<svg width="45" height="46" viewBox="0 0 45 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="0.5" width="45" height="45" rx="22.5" fill="white"/>
<g clip-path="url(#clip0_2725_224)">
<path d="M26.1 22.6H18.9C17.9 22.6 17 21.8 17 20.7V13.4C17 12.4 17.8 11.5 18.9 11.5H26.2C27.2 11.5 28.1 12.3 28.1 13.4V20.7C28 21.7 27.2 22.6 26.1 22.6ZM18.9 12.6C18.4 12.6 18 13 18 13.5V20.8C18 21.3 18.4 21.7 18.9 21.7H26.2C26.7 21.7 27.1 21.3 27.1 20.8V13.4C27.1 12.9 26.7 12.5 26.2 12.5H18.9V12.6Z" fill="#00499E"/>
<path d="M22.5 19.1999C22.2 19.1999 22 18.9999 22 18.6999V15.3999C22 15.0999 22.2 14.8999 22.5 14.8999C22.8 14.8999 23 15.0999 23 15.3999V18.6999C23 18.9999 22.8 19.1999 22.5 19.1999Z" fill="#00499E"/>
<path d="M20.8 17.6001C20.7 17.6001 20.5 17.6001 20.4 17.5001C20.2 17.3001 20.2 17.0001 20.4 16.8001L22.1 15.0001C22.3 14.8001 22.6 14.8001 22.8 15.0001L24.5 16.7001C24.7 16.9001 24.7 17.2001 24.5 17.4001C24.3 17.6001 24 17.6001 23.8 17.4001L22.5 16.1001L21.1 17.5001C21 17.6001 20.9 17.6001 20.8 17.6001ZM20.1 34.4001H12.8C11.8 34.4001 10.9 33.6001 10.9 32.5001V25.3001C10.9 24.3001 11.7 23.4001 12.8 23.4001H20C21 23.4001 21.9 24.2001 21.9 25.3001V32.5001C22 33.6001 21.1 34.4001 20.1 34.4001ZM12.8 24.5001C12.3 24.5001 11.9 24.9001 11.9 25.4001V32.6001C11.9 33.1001 12.3 33.5001 12.8 33.5001H20C20.5 33.5001 20.9 33.1001 20.9 32.6001V25.4001C20.9 24.9001 20.5 24.5001 20 24.5001H12.8Z" fill="#00499E"/>
<path d="M18.1 29.3999H14.8C14.5 29.3999 14.3 29.1999 14.3 28.8999C14.3 28.5999 14.5 28.3999 14.8 28.3999H18.1C18.4 28.3999 18.6 28.5999 18.6 28.8999C18.6 29.1999 18.4 29.3999 18.1 29.3999Z" fill="#00499E"/>
<path d="M16.5 31.1999C16.4 31.1999 16.2 31.1999 16.1 31.0999L14.4 29.3999C14.3 29.2999 14.3 29.1999 14.3 28.9999C14.3 28.7999 14.4 28.6999 14.4 28.5999L16.1 26.8999C16.3 26.6999 16.6 26.6999 16.8 26.8999C17 27.0999 17 27.3999 16.8 27.5999L15.5 28.8999L16.9 30.2999C17.1 30.4999 17.1 30.7999 16.9 30.9999C16.8 31.0999 16.6 31.1999 16.5 31.1999ZM32.2001 34.3999H25C24 34.3999 23.1 33.5999 23.1 32.4999V25.2999C23.1 24.2999 23.9 23.3999 25 23.3999H32.2001C33.2001 23.3999 34.1 24.1999 34.1 25.2999V32.4999C34 33.5999 33.2001 34.3999 32.2001 34.3999ZM24.9 24.4999C24.4 24.4999 24 24.8999 24 25.3999V32.5999C24 33.0999 24.4 33.4999 24.9 33.4999H32.1C32.6 33.4999 33 33.0999 33 32.5999V25.3999C33 24.8999 32.6 24.4999 32.1 24.4999H24.9Z" fill="#00499E"/>
<path d="M30.2 29.3999H26.9C26.6 29.3999 26.4 29.1999 26.4 28.8999C26.4 28.5999 26.6 28.3999 26.9 28.3999H30.2C30.5 28.3999 30.7 28.5999 30.7 28.8999C30.7 29.1999 30.5 29.3999 30.2 29.3999Z" fill="#00499E"/>
<path d="M28.5 31.2C28.4 31.2 28.2 31.2 28.1 31.1C27.9 30.9 27.9 30.6 28.1 30.4L29.5 29L28.1 27.6C27.9 27.4 27.9 27.1 28.1 26.9C28.3 26.7 28.6 26.7 28.8 26.9L30.5 28.6C30.6 28.7 30.6 28.8 30.6 29C30.6 29.2 30.5 29.3 30.5 29.4L28.8 31C28.6999 31.1 28.6 31.2 28.5 31.2Z" fill="#00499E"/>
</g>
<defs>
<clipPath id="clip0_2725_224">
<rect width="24" height="24" fill="white" transform="translate(10.5 11)"/>
</clipPath>
</defs>
</svg>`,
    activeIcon: `<svg width="45" height="46" viewBox="0 0 45 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="0.5" width="45" height="45" rx="22.5" fill="white"/>
<rect y="0.5" width="45" height="45" rx="22.5" fill="url(#paint0_linear_2725_593)"/>
<g clip-path="url(#clip0_2725_593)">
<path d="M26.1 22.6H18.9C17.9 22.6 17 21.8 17 20.7V13.4C17 12.4 17.8 11.5 18.9 11.5H26.2C27.2 11.5 28.1 12.3 28.1 13.4V20.7C28 21.7 27.2 22.6 26.1 22.6ZM18.9 12.6C18.4 12.6 18 13 18 13.5V20.8C18 21.3 18.4 21.7 18.9 21.7H26.2C26.7 21.7 27.1 21.3 27.1 20.8V13.4C27.1 12.9 26.7 12.5 26.2 12.5H18.9V12.6Z" fill="white"/>
<path d="M22.5 19.1999C22.2 19.1999 22 18.9999 22 18.6999V15.3999C22 15.0999 22.2 14.8999 22.5 14.8999C22.8 14.8999 23 15.0999 23 15.3999V18.6999C23 18.9999 22.8 19.1999 22.5 19.1999Z" fill="white"/>
<path d="M20.8 17.6001C20.7 17.6001 20.5 17.6001 20.4 17.5001C20.2 17.3001 20.2 17.0001 20.4 16.8001L22.1 15.0001C22.3 14.8001 22.6 14.8001 22.8 15.0001L24.5 16.7001C24.7 16.9001 24.7 17.2001 24.5 17.4001C24.3 17.6001 24 17.6001 23.8 17.4001L22.5 16.1001L21.1 17.5001C21 17.6001 20.9 17.6001 20.8 17.6001ZM20.1 34.4001H12.8C11.8 34.4001 10.9 33.6001 10.9 32.5001V25.3001C10.9 24.3001 11.7 23.4001 12.8 23.4001H20C21 23.4001 21.9 24.2001 21.9 25.3001V32.5001C22 33.6001 21.1 34.4001 20.1 34.4001ZM12.8 24.5001C12.3 24.5001 11.9 24.9001 11.9 25.4001V32.6001C11.9 33.1001 12.3 33.5001 12.8 33.5001H20C20.5 33.5001 20.9 33.1001 20.9 32.6001V25.4001C20.9 24.9001 20.5 24.5001 20 24.5001H12.8Z" fill="white"/>
<path d="M18.1 29.3999H14.8C14.5 29.3999 14.3 29.1999 14.3 28.8999C14.3 28.5999 14.5 28.3999 14.8 28.3999H18.1C18.4 28.3999 18.6 28.5999 18.6 28.8999C18.6 29.1999 18.4 29.3999 18.1 29.3999Z" fill="white"/>
<path d="M16.5 31.1999C16.4 31.1999 16.2 31.1999 16.1 31.0999L14.4 29.3999C14.3 29.2999 14.3 29.1999 14.3 28.9999C14.3 28.7999 14.4 28.6999 14.4 28.5999L16.1 26.8999C16.3 26.6999 16.6 26.6999 16.8 26.8999C17 27.0999 17 27.3999 16.8 27.5999L15.5 28.8999L16.9 30.2999C17.1 30.4999 17.1 30.7999 16.9 30.9999C16.8 31.0999 16.6 31.1999 16.5 31.1999ZM32.2 34.3999H25C24 34.3999 23.1 33.5999 23.1 32.4999V25.2999C23.1 24.2999 23.9 23.3999 25 23.3999H32.2C33.2 23.3999 34.1 24.1999 34.1 25.2999V32.4999C34 33.5999 33.2 34.3999 32.2 34.3999ZM24.9 24.4999C24.4 24.4999 24 24.8999 24 25.3999V32.5999C24 33.0999 24.4 33.4999 24.9 33.4999H32.1C32.6 33.4999 33 33.0999 33 32.5999V25.3999C33 24.8999 32.6 24.4999 32.1 24.4999H24.9Z" fill="white"/>
<path d="M30.2 29.3999H26.9C26.6 29.3999 26.4 29.1999 26.4 28.8999C26.4 28.5999 26.6 28.3999 26.9 28.3999H30.2C30.5 28.3999 30.7 28.5999 30.7 28.8999C30.7 29.1999 30.5 29.3999 30.2 29.3999Z" fill="white"/>
<path d="M28.5 31.2C28.4 31.2 28.2 31.2 28.1 31.1C27.9 30.9 27.9 30.6 28.1 30.4L29.5 29L28.1 27.6C27.9 27.4 27.9 27.1 28.1 26.9C28.3 26.7 28.6 26.7 28.8 26.9L30.5 28.6C30.6 28.7 30.6 28.8 30.6 29C30.6 29.2 30.5 29.3 30.5 29.4L28.8 31C28.7 31.1 28.6 31.2 28.5 31.2Z" fill="white"/>
</g>
<defs>
<linearGradient id="paint0_linear_2725_593" x1="0" y1="23" x2="45" y2="23" gradientUnits="userSpaceOnUse">
<stop stop-color="#00499E"/>
<stop offset="1" stop-color="#1593EF"/>
</linearGradient>
<clipPath id="clip0_2725_593">
<rect width="24" height="24" fill="white" transform="translate(10.5 11)"/>
</clipPath>
</defs>
</svg>`,
  },

  mouseKeys: {
    activeIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="46" fill="none"><rect width="45" height="46" fill="url(#a)" rx="22.5"/><path fill="#fff" d="M23.3 32c0-.6-.5-1-1.1-1-.6 0-1.1.4-1.1 1s.5 1.1 1 1.1c.7 0 1.2-.5 1.2-1Zm-1.1-7.4a3.3 3.3 0 0 1-3.4-3.3v-6.6a3.3 3.3 0 0 1 3.4-3.3 3.3 3.3 0 0 1 3.3 3.3v6.6a3.3 3.3 0 0 1-3.3 3.3Zm0-11a1.1 1.1 0 0 0-1.1 1v6.7a1.1 1.1 0 0 0 1 1 1.1 1.1 0 0 0 1.2-1v-6.6a1.1 1.1 0 0 0-1.1-1.1Z"/><path fill="#fff" d="M23.4 40H21a11 11 0 0 1-11-10.8V17.8A10.8 10.8 0 0 1 20.9 7h2.5a11 11 0 0 1 11 10.8v11.4a10.8 10.8 0 0 1-11 10.8ZM21 9.2a8.7 8.7 0 0 0-8.7 8.6v11.4a8.6 8.6 0 0 0 8.7 8.6h2.5a8.7 8.7 0 0 0 8.7-8.6V17.8a8.6 8.6 0 0 0-8.7-8.6H21Z"/><defs><linearGradient id="a" x1="0" x2="45" y1="23" y2="23" gradientUnits="userSpaceOnUse"><stop stop-color="#00499E"/><stop offset="1" stop-color="#1593EF"/></linearGradient></defs></svg>`,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="46" fill="none"><rect width="45" height="46" fill="#fff" rx="22.5"/><path fill="#00499E" d="M23.3 32c0-.6-.5-1-1.1-1-.6 0-1.1.4-1.1 1s.5 1.1 1 1.1c.7 0 1.2-.5 1.2-1Zm-1.1-7.4a3.3 3.3 0 0 1-3.4-3.3v-6.6a3.3 3.3 0 0 1 3.4-3.3 3.3 3.3 0 0 1 3.3 3.3v6.6a3.3 3.3 0 0 1-3.3 3.3Zm0-11a1.1 1.1 0 0 0-1.1 1v6.7a1.1 1.1 0 0 0 1 1 1.1 1.1 0 0 0 1.2-1v-6.6a1.1 1.1 0 0 0-1.1-1.1Z"/><path fill="#00499E" d="M23.4 40H21a11 11 0 0 1-11-10.8V17.8A10.8 10.8 0 0 1 20.9 7h2.5a11 11 0 0 1 11 10.8v11.4a10.8 10.8 0 0 1-11 10.8ZM21 9.2a8.7 8.7 0 0 0-8.7 8.6v11.4a8.6 8.6 0 0 0 8.7 8.6h2.5a8.7 8.7 0 0 0 8.7-8.6V17.8a8.6 8.6 0 0 0-8.7-8.6H21Z"/></svg>`,
  },
};

function createFloatingButtonChild(key) {
  const button = document.createElement('button');
  button.classList.add('woAcc-menuButton');
  button.innerHTML += floatingButtonsData[key]?.icon;
  button.setAttribute('guidy-key', key);
  button.addEventListener('click', handleFloatingButtonChildClick);
  floatingButtonsChild[key] = button;
  return button;
}

function toggleFloatingButtonChild(isFeatureOn, feature) {
  if (isFeatureOn) {
    if (!floatingButtonsChild[feature]) {
      createFloatingButtonChild(feature);
    }
    floatingButton.appendChild(floatingButtonsChild[feature]);
  } else {
    if (
      floatingButtonsChild[feature] &&
      floatingButtonsChild[feature].closest('.woAcc-floatingButton')
    ) {
      floatingButton.removeChild(floatingButtonsChild[feature]);
      floatingButtonsChild[feature] = undefined;
    }
  }
}

function handleFloatingButton(key) {
  if (!floatingButton) {
    floatingButton = document.createElement('div');
    floatingButton.classList.add('woAcc-floatingButton');
  }

  toggleFloatingButtonChild(isVirtualKeyboardOn, 'virtualKeyboard');
  toggleFloatingButtonChild(isVoiceNavigationOn, 'voiceNavigation');
  toggleFloatingButtonChild(isKeyboardShortcutsOn, 'keyboardShortcut');
  toggleFloatingButtonChild(isKeyboardNavigationOn, 'keyboardNavigation');
  toggleFloatingButtonChild(!!guidyCursor, 'mouseKeys');

  if (floatingButton && floatingButton.childNodes.length === 0) {
    if (floatingButton.closest('#woAcc-RootEle')) {
      rootElement.removeChild(floatingButton);
    }
  } else {
    rootElement.appendChild(floatingButton);
    handleFloatingButtonChildClick(undefined, key);
  }
}

function handleShortcutsKeyDown(e) {
  if (!isEditing) {
    let keys = [];
    if (e.ctrlKey || e.metaKey) {
      keys.push('CTRL');
    }
    if (e.altKey) {
      keys.push('ALT');
    }
    if (e.shiftKey) {
      keys.push('SHIFT');
    }

    keys.push(CODE_TO_KEY?.[e.code]?.toUpperCase?.());
    const keyString = keys.join(' + ');
    const shortCut = shortcuts.find((s) => s.shortcut === keyString);
    if (shortCut) {
      const option = shortCut.key;
      const current = getDataById(option);
      const options = Object.keys(constants[option] || {});
      if (option && options.length) {
        if (
          option === 'pageStructure' &&
          currentOpenModal === 'pageStructure'
        ) {
          sendPostMessage('optionUpdate', {
            option,
            value: 'default',
          });
        } else {
          const activeIndex = options.findIndex((opt) => opt === current);
          let nextIndex = (activeIndex + 1) % options.length;
          sendPostMessage('optionUpdate', {
            option,
            value: options[nextIndex],
          });
        }
        e.stopPropagation();
      }
    }
  }
}

function getGuidyShortcuts() {
  shortcuts = getLocalStorageData('guidyShortcuts');
  if (!shortcuts) {
    shortcuts = defaultKeyboardShortcuts;
  }
  return shortcuts;
}

const shortCutsHeading = 'Guidy Options Keyboard Shortcuts';

function createShortCutDiv(parent) {
  shortcuts.map((shortcut) => {
    // Wrapper
    const div = document.createElement('div');
    div.classList.add('woAcc-shortCutsInfo-shortcut');

    // Option
    const option = document.createElement('h5');
    option.setAttribute('data-translate', shortcut.label);
    option.innerText = getTranslations(shortcut.label);
    div.appendChild(option);

    // Shortcut
    const wrapper = document.createElement('div');
    wrapper.classList.add('woAcc-shortCutsInfo-shortcut-wrapper');
    const command = document.createElement('h5');
    command.setAttribute('data-translate', shortcut.shortcut);
    command.innerText = getTranslations(shortcut.shortcut);
    wrapper.append(command);
    const button = document.createElement('button');
    button.classList.add('woAcc-button');
    button.innerHTML = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 2.375H3.125C2.79348 2.375 2.47554 2.5067 2.24112 2.74112C2.0067 2.97554 1.875 3.29348 1.875 3.625V12.375C1.875 12.7065 2.0067 13.0245 2.24112 13.2589C2.47554 13.4933 2.79348 13.625 3.125 13.625H11.875C12.2065 13.625 12.5245 13.4933 12.7589 13.2589C12.9933 13.0245 13.125 12.7065 13.125 12.375V8" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.4844 2.14077C11.7331 1.89213 12.0703 1.75244 12.4219 1.75244C12.7736 1.75244 13.1108 1.89213 13.3594 2.14077C13.6081 2.38941 13.7478 2.72664 13.7478 3.07827C13.7478 3.4299 13.6081 3.76713 13.3594 4.01577L7.72631 9.64952C7.5779 9.7978 7.39456 9.90634 7.19318 9.96514L5.39756 10.4901C5.34378 10.5058 5.28677 10.5068 5.2325 10.4929C5.17823 10.479 5.1287 10.4507 5.08909 10.4111C5.04947 10.3715 5.02124 10.322 5.00734 10.2677C4.99343 10.2134 4.99437 10.1564 5.01006 10.1026L5.53506 8.30702C5.59414 8.1058 5.70289 7.92268 5.85131 7.77452L11.4844 2.14077Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    button.onclick = (e) => handleEditEvent(e, wrapper, shortcut);
    wrapper.append(button);
    div.appendChild(wrapper);

    parent.appendChild(div);
  });
}

let isEditing = false;
let activeEdit = undefined;
let oldText = undefined;
const eventListeners = [];

function handleKeydown(e, wrapper, shortcut) {
  e.preventDefault();
  e.stopPropagation();
  if (
    e.key.length === 1 &&
    /[a-zA-Z0-9]/.test(e.key) &&
    // If the key is in the specified array, special keys (Ctrl, Alt, Meta, Shift) must be pressed
    ((['h', 'm', 'g', 'b', 'f'].includes(e.key.toLowerCase()) &&
      (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)) ||
      // If the key is not in the array, special keys are not required
      !['h', 'm', 'g', 'b', 'f'].includes(e.key.toLowerCase()))
  ) {
    let keys = [];

    // Check for modifier keys
    if (e.ctrlKey || e.metaKey) keys.push('CTRL');
    if (e.altKey) keys.push('ALT');
    if (e.shiftKey) keys.push('SHIFT');
    keys.push(e.key.toUpperCase());
    const keyString = keys.join(' + ');
    const shortCut = shortcuts.find((s) => s.shortcut === keyString);
    const h5 = wrapper.firstChild;
    if (!shortCut) {
      const secondChild = h5.nextSibling;
      h5.innerText = keyString;
      shortcut.shortcut = keyString;
      setLocalStorageData('guidyShortcuts', shortcuts);
      sendPostMessage('keyboardShortcut', {
        shortcuts: shortcuts,
      });
      eventListeners.forEach((listener) => {
        document.removeEventListener('keydown', listener);
      });
      eventListeners.length = 0;
      isEditing = false;
      secondChild.innerHTML = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 2.375H3.125C2.79348 2.375 2.47554 2.5067 2.24112 2.74112C2.0067 2.97554 1.875 3.29348 1.875 3.625V12.375C1.875 12.7065 2.0067 13.0245 2.24112 13.2589C2.47554 13.4933 2.79348 13.625 3.125 13.625H11.875C12.2065 13.625 12.5245 13.4933 12.7589 13.2589C12.9933 13.0245 13.125 12.7065 13.125 12.375V8" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.4844 2.14077C11.7331 1.89213 12.0703 1.75244 12.4219 1.75244C12.7736 1.75244 13.1108 1.89213 13.3594 2.14077C13.6081 2.38941 13.7478 2.72664 13.7478 3.07827C13.7478 3.4299 13.6081 3.76713 13.3594 4.01577L7.72631 9.64952C7.5779 9.7978 7.39456 9.90634 7.19318 9.96514L5.39756 10.4901C5.34378 10.5058 5.28677 10.5068 5.2325 10.4929C5.17823 10.479 5.1287 10.4507 5.08909 10.4111C5.04947 10.3715 5.02124 10.322 5.00734 10.2677C4.99343 10.2134 4.99437 10.1564 5.01006 10.1026L5.53506 8.30702C5.59414 8.1058 5.70289 7.92268 5.85131 7.77452L11.4844 2.14077Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
      secondChild.onclick = (e) => handleEditEvent(e, wrapper, shortcut);
      activeEdit = undefined;
    } else {
      h5.innerText = getTranslations('Already exists, try new...');
    }
  }
}

function cancelPreviousEdit(wrapper, shortcut) {
  const previousButton = wrapper.querySelector('button');
  const previousH5 = wrapper.querySelector('h5');
  previousH5.innerHTML = oldText;
  previousButton.innerHTML = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 2.375H3.125C2.79348 2.375 2.47554 2.5067 2.24112 2.74112C2.0067 2.97554 1.875 3.29348 1.875 3.625V12.375C1.875 12.7065 2.0067 13.0245 2.24112 13.2589C2.47554 13.4933 2.79348 13.625 3.125 13.625H11.875C12.2065 13.625 12.5245 13.4933 12.7589 13.2589C12.9933 13.0245 13.125 12.7065 13.125 12.375V8" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.4844 2.14077C11.7331 1.89213 12.0703 1.75244 12.4219 1.75244C12.7736 1.75244 13.1108 1.89213 13.3594 2.14077C13.6081 2.38941 13.7478 2.72664 13.7478 3.07827C13.7478 3.4299 13.6081 3.76713 13.3594 4.01577L7.72631 9.64952C7.5779 9.7978 7.39456 9.90634 7.19318 9.96514L5.39756 10.4901C5.34378 10.5058 5.28677 10.5068 5.2325 10.4929C5.17823 10.479 5.1287 10.4507 5.08909 10.4111C5.04947 10.3715 5.02124 10.322 5.00734 10.2677C4.99343 10.2134 4.99437 10.1564 5.01006 10.1026L5.53506 8.30702C5.59414 8.1058 5.70289 7.92268 5.85131 7.77452L11.4844 2.14077Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  previousButton.onclick = (e) => handleEditEvent(e, wrapper, shortcut);
  activeEdit = undefined;
  oldText = undefined;
  eventListeners.forEach((listener) => {
    document.removeEventListener('keydown', listener);
  });
  eventListeners.length = 0;
  isEditing = false;
}

function handleEditEvent(e, wrapper, shortcut) {
  if (activeEdit && activeEdit !== wrapper) {
    cancelPreviousEdit(activeEdit, shortcut);
  }
  isEditing = true;
  activeEdit = wrapper;
  const h5 = wrapper.firstChild;
  oldText = h5.innerHTML;
  e.target.innerHTML = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.4374 4.06865C11.3796 4.01071 11.3109 3.96474 11.2353 3.93338C11.1597 3.90201 11.0786 3.88587 10.9968 3.88587C10.9149 3.88587 10.8339 3.90201 10.7583 3.93338C10.6826 3.96474 10.614 4.01071 10.5561 4.06865L7.4999 7.11865L4.44365 4.0624C4.38578 4.00453 4.31709 3.95863 4.24149 3.92732C4.16588 3.896 4.08485 3.87988 4.00302 3.87988C3.92119 3.87988 3.84016 3.896 3.76456 3.92732C3.68895 3.95863 3.62026 4.00453 3.5624 4.0624C3.50453 4.12026 3.45863 4.18895 3.42732 4.26456C3.396 4.34016 3.37988 4.42119 3.37988 4.50302C3.37988 4.58485 3.396 4.66588 3.42732 4.74149C3.45863 4.81709 3.50453 4.88578 3.5624 4.94365L6.61865 7.9999L3.5624 11.0561C3.50453 11.114 3.45863 11.1827 3.42732 11.2583C3.396 11.3339 3.37988 11.4149 3.37988 11.4968C3.37988 11.5786 3.396 11.6596 3.42732 11.7352C3.45863 11.8108 3.50453 11.8795 3.5624 11.9374C3.62026 11.9953 3.68895 12.0412 3.76456 12.0725C3.84016 12.1038 3.92119 12.1199 4.00302 12.1199C4.08485 12.1199 4.16588 12.1038 4.24149 12.0725C4.31709 12.0412 4.38578 11.9953 4.44365 11.9374L7.4999 8.88114L10.5561 11.9374C10.614 11.9953 10.6827 12.0412 10.7583 12.0725C10.8339 12.1038 10.9149 12.1199 10.9968 12.1199C11.0786 12.1199 11.1596 12.1038 11.2352 12.0725C11.3108 12.0412 11.3795 11.9953 11.4374 11.9374C11.4953 11.8795 11.5412 11.8108 11.5725 11.7352C11.6038 11.6596 11.6199 11.5786 11.6199 11.4968C11.6199 11.4149 11.6038 11.3339 11.5725 11.2583C11.5412 11.1827 11.4953 11.114 11.4374 11.0561L8.38114 7.9999L11.4374 4.94365C11.6749 4.70615 11.6749 4.30615 11.4374 4.06865Z" fill="white"/>
</svg>`;
  e.target.onclick = () => cancelPreviousEdit(wrapper, shortcut);
  h5.innerText = `${getTranslations('Press new keys')}...`;
  const handleEvent = (e) => handleKeydown(e, wrapper, shortcut);
  eventListeners.push(handleEvent);
  document.addEventListener('keydown', handleEvent);
}

function createKeyboardShortCutsInfoDiv(displayFlag) {
  keyboardShortcut = document.createElement('div');
  keyboardShortcut.classList.add('woAcc-shortCutsInfo');

  // Header
  const header = document.createElement('div');
  header.classList.add('woAcc-shortCutsInfo-header');
  const heading = document.createElement('h4');
  heading.setAttribute('data-translate', shortCutsHeading);
  heading.innerText = getTranslations(shortCutsHeading);
  const closeButton = document.createElement('div');
  closeButton.innerHTML = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.4374 4.06865C11.3796 4.01071 11.3109 3.96474 11.2353 3.93338C11.1597 3.90201 11.0786 3.88587 10.9968 3.88587C10.9149 3.88587 10.8339 3.90201 10.7583 3.93338C10.6826 3.96474 10.614 4.01071 10.5561 4.06865L7.4999 7.11865L4.44365 4.0624C4.38578 4.00453 4.31709 3.95863 4.24149 3.92732C4.16588 3.896 4.08485 3.87988 4.00302 3.87988C3.92119 3.87988 3.84016 3.896 3.76456 3.92732C3.68895 3.95863 3.62026 4.00453 3.5624 4.0624C3.50453 4.12026 3.45863 4.18895 3.42732 4.26456C3.396 4.34016 3.37988 4.42119 3.37988 4.50302C3.37988 4.58485 3.396 4.66588 3.42732 4.74149C3.45863 4.81709 3.50453 4.88578 3.5624 4.94365L6.61865 7.9999L3.5624 11.0561C3.50453 11.114 3.45863 11.1827 3.42732 11.2583C3.396 11.3339 3.37988 11.4149 3.37988 11.4968C3.37988 11.5786 3.396 11.6596 3.42732 11.7352C3.45863 11.8108 3.50453 11.8795 3.5624 11.9374C3.62026 11.9953 3.68895 12.0412 3.76456 12.0725C3.84016 12.1038 3.92119 12.1199 4.00302 12.1199C4.08485 12.1199 4.16588 12.1038 4.24149 12.0725C4.31709 12.0412 4.38578 11.9953 4.44365 11.9374L7.4999 8.88114L10.5561 11.9374C10.614 11.9953 10.6827 12.0412 10.7583 12.0725C10.8339 12.1038 10.9149 12.1199 10.9968 12.1199C11.0786 12.1199 11.1596 12.1038 11.2352 12.0725C11.3108 12.0412 11.3795 11.9953 11.4374 11.9374C11.4953 11.8795 11.5412 11.8108 11.5725 11.7352C11.6038 11.6596 11.6199 11.5786 11.6199 11.4968C11.6199 11.4149 11.6038 11.3339 11.5725 11.2583C11.5412 11.1827 11.4953 11.114 11.4374 11.0561L8.38114 7.9999L11.4374 4.94365C11.6749 4.70615 11.6749 4.30615 11.4374 4.06865Z" fill="white"/>
</svg>`;
  closeButton.style.cursor = 'pointer';
  closeButton.addEventListener('click', () => {
    const infoDiv = getElementReference('keyboardShortcut');
    if (infoDiv) {
      floatingButtonsChild['keyboardShortcut']?.innerHTML
        ? (floatingButtonsChild['keyboardShortcut'].innerHTML =
            floatingButtonsData['keyboardShortcut']?.icon)
        : null;
      floatingButtonsChild['keyboardShortcut']?.classList.remove('active');
      infoDiv.style.display = 'none';
    }
  });
  header.appendChild(heading);
  header.appendChild(closeButton);
  keyboardShortcut.appendChild(header);

  // Shortcuts
  const wrapper = document.createElement('div');
  wrapper.classList.add('woAcc-shortCutsInfo-content');
  createShortCutDiv(wrapper);
  keyboardShortcut.appendChild(wrapper);

  if (displayFlag) {
    keyboardShortcut.style.display = 'block';
  }
  rootElement.appendChild(keyboardShortcut);
  translateContent();
}

let recognizerRunning = false;

function createRecognizer() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  let SpeechGrammarList = null;

  if (!isSafari) {
    SpeechGrammarList =
      window.SpeechGrammarList || window.webkitSpeechGrammarList;
  }
  recognizer = new SpeechRecognition();
  recognizer.continuous = true;
  recognizer.interimResults = false;

  const keywords = commandsData.reduce(
    (prev, current) => [...prev, ...current.commands.flat()],
    []
  );
  recognizer.lang =
    `${getDataById('woAccessibilityLang')}` ||
    document.querySelector('html').getAttribute('lang') ||
    navigator.language;
  recognizer.maxAlternatives = 1;

  const grammars = `#JSGF V1.0; grammar keywords; public <keyword> = ${keywords
    .join(' | ')
    .toLowerCase()};`;
  let speechRecognitionList = null;
  if (!isSafari) {
    speechRecognitionList = new SpeechGrammarList();
  }
  try {
    if (!isSafari) {
      speechRecognitionList.addFromString(grammars, 1);
      recognizer.grammars = speechRecognitionList;
    }
  } catch (err) {
    console.error('Error adding grammar:', err);
  }

  recognizer.onresult = (e) => {
    let transcript = e.results[e.resultIndex][0].transcript.trim();
    if (voiceNavigationText) voiceNavigationText.innerText = transcript;

    if (isRecognizing) {
      clearTimeout(timer);

      timer = setTimeout(() => {
        setVoiceNavigationText(listening);
      }, 1 * 1000);
      startRecognizer();
      handleRecognizedText(transcript);
    }
  };

  recognizer.onspeechend = () => {
    recognizerRunning = false;
    startRecognizer();
  };

  // let isStarted = false;
  // recognizer.onstart = () => {
  //   if (!isStarted) {
  //     isStarted = true
  //     say(getTranslations(listening));
  //   }
  // };

  recognizer.onnomatch = () => {
    recognizerRunning = false;
    startRecognizer();
  };

  recognizer.onerror = (e) => {
    recognizerRunning = false;
    if (e.error === 'no-speech' || event.error === 'aborted') {
      startRecognizer();
    } else {
      isRecognizing = false;
      console.error('Recognizer stopped due to error:', e.error);
    }
  };
}

const startListening = 'Click on the button to start listening';
const listening = 'Listening';
const stopListening = 'Voice navigation stopped';

function createButtonAndTextWrapper(parent) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('woAcc-voice-navigation-button-wrapper');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.borderRadius = '20px';

  voiceNavigationButton = document.createElement('button');
  voiceNavigationButton.classList.add('woAcc-voice-navigation-btn');
  const svg = document.createElement('img');
  svg.src = `${staticPath}images/microphone.svg`;
  svg.style.height = '24px';
  svg.style.maxWidth = 'none';
  voiceNavigationButton.appendChild(svg);
  if (!recognizer) {
    createRecognizer();
  }
  voiceNavigationButton.onclick = () => {
    handleVoiceNavigationButtonClick();
  };
  parent.appendChild(voiceNavigationButton);
  voiceNavigationText = document.createElement('div');
  voiceNavigationText.classList.add('woAcc-voice-navigation-text');
  voiceNavigationText.style.color = '#fff';
  voiceNavigationText.style.fontWeight = '600';
  voiceNavigationText.style.fontFamily = 'Inter';
  voiceNavigationText.style.flex = '1';
  voiceNavigationText.style.minWidth = '0px';

  setVoiceNavigationText(startListening);
  wrapper.appendChild(voiceNavigationButton);
  wrapper.appendChild(voiceNavigationText);
  parent.appendChild(wrapper);
}

function handleQuitCommand() {
  isVoiceNavigationOn = false;
  handleFloatingButton('voiceNavigation');
  if (isIframeLoaded) {
    sendPostMessage('closeVoiceNavigation', {});
  }
  if (isRecognizing) {
    stopVoiceNavigation();
  }
  setDataById('voiceNavigation', 'default');
  removeVoiceNavigation();
}

function createActiosDivWrapper(parent) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('woAcc-voice-navigation-actions-wrapper');
  const btns = [
    {
      type: 'info',
      icon: `${staticPath}images/info.svg`,
      handler: () => {
        const infoBtn = document.querySelector(
          '.woAcc-voice-navigation-info-btn'
        );
        if (commandsSection.classList.contains('woAcc-expanded')) {
          commandsSection.classList.remove('woAcc-expanded');
          infoBtn.classList.remove('active');
        } else {
          commandsSection.classList.add('woAcc-expanded');
          infoBtn.classList.add('active');
        }
      },
    },
    {
      type: 'close',
      icon: `${staticPath}images/close.svg`,
      handler: () => {
        handleQuitCommand();
      },
    },
  ];
  btns.map((btn) => {
    const button = document.createElement('button');
    button.classList.add('woAcc-voice-navigation-btn');
    if (btn.type === 'info') {
      button.classList.add(...['woAcc-voice-navigation-info-btn', 'active']);
    }
    const svg = document.createElement('img');
    svg.src = btn.icon;
    svg.style.height = '24px';
    svg.style.maxWidth = 'none';
    button.appendChild(svg);
    button.onclick = () => btn.handler();
    wrapper.appendChild(button);
  });
  parent.appendChild(wrapper);
}

function createVoiceNavigationHeader() {
  const textWrapper = document.createElement('div');
  textWrapper.classList.add('woAcc-voice-navigation-header');
  createButtonAndTextWrapper(textWrapper);
  createActiosDivWrapper(textWrapper);
  voiceNavigation.appendChild(textWrapper);
}

function removeVoiceNavigation() {
  commandsSection?.classList.remove('woAcc-expanded');
  voiceNavigationButton?.classList.remove('active');
  if (voiceNavigationText) {
    setVoiceNavigationText(startListening);
  }
  if (voiceNavigation && rootElement.contains(voiceNavigation)) {
    rootElement.removeChild(voiceNavigation);
  }
  voiceNavigation = undefined;
  recognizer = undefined;
  voiceNavigationButton = undefined;
  voiceNavigationText = undefined;
  isRecognizing = false;
}

const commandsData = [
  {
    title: 'Skip to Content command and aliases',
    commands: [
      'Skip to content',
      'Navigate to content',
      'Go to content',
      'Main content',
      'skipToContent',
    ],
    handler: () => {
      const element = document.querySelector('main, [role="main"], h1');
      if (element instanceof HTMLElement) {
        element.scrollIntoView({
          behavior: 'smooth',
        });
        element.focus();
      }
    },
  },
  {
    title: 'Skip to Navigation command and aliases',
    commands: [
      'Skip to navigation',
      'Go to navigation',
      'Main navigation',
      'skipToNavigation',
    ],
    handler: () => focusOnLandmark('nav'),
  },
  {
    title: 'Skip to Footer command and aliases',
    commands: [
      'Skip to footer',
      'Footer',
      'Go to footer',
      'Navigate to footer',
      'skipToFooter',
    ],
    handler: () => focusOnLandmark('footer'),
  },
  {
    title: 'Show Widget command and aliases',
    commands: [
      'Show widget',
      'Open widget',
      'Show all in one accessibility widget',
      'Open all in one accessibility widget',
      'showWidget',
    ],
    handler: () => {
      if (!isIframeLoaded) {
        loadWidget();
      } else {
        sendPostMessage('toggleModal', {
          isOpen: true,
        });
        if (moveWidgetDiv) {
          moveWidgetDiv.style.display = 'block';
        }
      }
    },
  },
  // {
  //   title: "List Headings command and aliases",
  //   commands: ["List heading", "Show heading"],
  //   handler: () => {},
  // },
  // {
  //   title: "List Landmark command and aliases",
  //   commands: ["List landmark", "Show landmark"],
  //   handler: () => {},
  // },
  // {
  //   title: "List Links command and aliases",
  //   commands: ["List links", "Show links"],
  //   handler: () => {},
  // },
  {
    title: 'Enter command and aliases',
    commands: ['Click', 'Enter', 'enter'],
    handler: () => {
      preventWidgetClose = true;
      const focusedElement = document.activeElement;
      if (focusedElement) {
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: mouseX,
          clientY: mouseY,
        });
        focusedElement.dispatchEvent(event);
      }
    },
  },
  {
    title: 'Scroll down command and aliases',
    commands: [
      'Down',
      'Scroll down',
      'Move downwards',
      'Go down',
      'Page down',
      'scrollDown',
    ],
    handler: () => window.scrollBy({ top: 500, left: 0, behavior: 'smooth' }),
  },
  {
    title: 'Scroll up command and aliases',
    commands: ['Scroll up', 'Go up', 'Page up', 'scrollUp'],
    handler: () => window.scrollBy({ top: -500, left: 0, behavior: 'smooth' }),
  },
  {
    title: 'Go to top command and aliases',
    commands: ['Go top', 'Scroll top', 'goToTop'],
    handler: () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }),
  },
  {
    title: 'Go to bottom command and aliases',
    commands: ['Go to bottom', 'Scroll to bottom', 'goToBottom'],
    handler: () =>
      window.scrollTo({
        top: document.body.scrollHeight,
        left: 0,
        behavior: 'smooth',
      }),
  },
  {
    title: 'Tab command and aliases',
    commands: ['Tab', 'Next', 'tab'],
    handler: () => focusOnElement('focusableElements'),
  },
  {
    title: 'Tab Back command and aliases',
    commands: ['Tab back', 'Previous', 'Back', 'tabBack'],
    handler: () => focusOnElement('focusableElements', true),
  },
  {
    title: 'Move Left command and aliases',
    commands: ['Move left', 'Left', 'Move cursor left', 'moveLeft'],
    handler: () => window.scrollBy({ top: 0, left: 250, behavior: 'smooth' }),
  },
  {
    title: 'Move Right command and aliases',
    commands: ['Move right', 'Right', 'Move cursor right', 'moveRight'],
    handler: () => window.scrollBy({ top: 0, left: -250, behavior: 'smooth' }),
  },
  {
    title: 'Move Up command and aliases',
    commands: ['Move up', 'Go Upwards', 'Move cursor up', 'moveUp'],
    handler: () => window.scrollBy({ top: 500, left: 0, behavior: 'smooth' }),
  },
  {
    title: 'Move Down command and aliases',
    commands: ['Move down', 'Move cursor down', 'moveDown'],
    handler: () => window.scrollBy({ top: -500, left: 0, behavior: 'smooth' }),
  },
  {
    title: 'Clear Input command and aliases',
    commands: ['Clear input', 'Erase', 'Remove', 'Delete', 'clearInput'],
    handler: () => {
      const focusedElement = document.activeElement;
      if (
        focusedElement &&
        (focusedElement.tagName === 'INPUT' ||
          focusedElement.tagName === 'TEXTAREA')
      ) {
        focusedElement.value = '';
      }
    },
  },
  {
    title: 'Stop Voice Assistance command and aliases',
    commands: [
      'Exit',
      'Quit',
      'Stop voice assistance',
      'Stop',
      'stopVoiceAssistance',
    ],
    handler: () => handleQuitCommand(),
  },
  {
    title: 'Reload the page command and aliases',
    commands: ['Reload page', 'Refresh page', 'reloadPage'],
    handler: () => window.location.reload(),
  },
  {
    title: 'Close Widget command and aliases',
    commands: ['Close widget', 'Hide widget', 'closeWidget'],
    handler: () => {
      if (isIframeLoaded) {
        sendPostMessage('toggleModal', {
          isOpen: false,
          site: window.location.href,
        });
        if (moveWidgetDiv) {
          moveWidgetDiv.style.display = 'none';
        }
      }
    },
  },
  {
    title: 'Help (Show available commands) command and aliases',
    commands: [
      'Help',
      'Help me',
      'Please help',
      'Show commands',
      'Available commands',
      'Show available commands',
      'List commands',
      'showHelp',
    ],
    handler: () => {
      document
        .querySelector('.woAcc-voice-navigation-info-btn')
        .classList.add('active');
      commandsSection.classList.add('woAcc-expanded');
    },
  },
  {
    title: 'Hide help command and aliases',
    commands: ['Hide help', 'Hide command', 'hideHelp'],
    handler: () => {
      document
        .querySelector('.woAcc-voice-navigation-info-btn')
        .classList.remove('active');
      commandsSection.classList.remove('woAcc-expanded');
    },
  },
];

/**
 * Handles recognized text and triggers the corresponding command
 * @param {string} content
 */
function handleRecognizedText(content) {
  commandsData.map((commandGroup) => {
    const command = commandGroup.commands.find((command) => {
      return content.toLowerCase() === getTranslations(command).toLowerCase();
    });
    if (command) {
      commandGroup.handler();
      return;
    }
  });
}

let isRecognizing = false;

function handleVoiceNavigationButtonClick() {
  if (isRecognizing) {
    stopVoiceNavigation();
  } else {
    startVoiceNavigation();
  }
}

function setVoiceNavigationText(text) {
  voiceNavigationText.setAttribute('data-translate', text);
  voiceNavigationText.innerText = getTranslations(text);
}

function triggerStart() {
  try {
    recognizer.start();
  } catch (e) {
    console.log(e);
  }
}

function startRecognizer() {
  try {
    if (!recognizerRunning) {
      recognizer.stop();
      recognizerRunning = true;
      setTimeout(() => {
        triggerStart();
      }, 600);
    }
  } catch (e) {
    console.log(e);
  }
}

function startVoiceNavigation() {
  isRecognizing = true;
  startRecognizer();
  say(getTranslations(listening));
  voiceNavigationButton?.classList.add('active');
  setVoiceNavigationText(listening);
}

function stopVoiceNavigation() {
  recognizer?.stop();
  recognizerRunning = false;
  if (isRecognizing) {
    say(getTranslations(stopListening));
  }
  isRecognizing = false;
  voiceNavigationButton?.classList.remove('active');
  if (voiceNavigationText) {
    setVoiceNavigationText(startListening);
  }
  clearTimeout(timer);
}

function createcommandsInformation() {
  commandsSection = document.createElement('div');
  commandsSection.classList.add(...['woAcc-commands', 'woAcc-expanded']);
  const commandsWrapper = document.createElement('div');
  commandsWrapper.classList.add('woAcc-commands-wrapper');
  commandsData.map((data) => {
    const wrapper = document.createElement('div');
    const title = document.createElement('div');
    title.innerHTML = `<h6 data-translate="${data.title}">${getTranslations(
      data.title
    )}</h6>`;
    wrapper.appendChild(title);

    const commandGroup = document.createElement('div');
    commandGroup.classList.add('woAcc-commands-group');
    data.commands.map((command, index) => {
      if (index === data.commands.length - 1) {
        return;
      }
      const div = document.createElement('div');
      div.classList.add('woAcc-command');
      div.setAttribute('data-translate', command);
      div.innerText = getTranslations(command);
      commandGroup.appendChild(div);
    });
    wrapper.appendChild(commandGroup);
    commandsWrapper.appendChild(wrapper);
  });
  commandsSection.appendChild(commandsWrapper);
  voiceNavigation.appendChild(commandsSection);
}

function addVoiceNavigation() {
  if (!voiceNavigation) {
    const style = document.createElement('style');
    style.innerHTML += voiceNavigationStyles;
    rootElement.appendChild(style);
    voiceNavigation = document.createElement('div');
    voiceNavigation.classList.add('woAcc-voice-navigation');
    createcommandsInformation();
    createVoiceNavigationHeader();
    if (
      floatingButtonsChild['voiceNavigation']?.classList?.contains('active')
    ) {
      voiceNavigation.style.display = 'block';
    }
  }
  rootElement.appendChild(voiceNavigation);
  startVoiceNavigation();
}

function handleVoiceNavigation(newKey) {
  if (isRecognizing) {
    stopVoiceNavigation();
  }
  isVoiceNavigationOn = false;
  removeVoiceNavigation();
  if (newKey !== 'default') {
    isVoiceNavigationOn = true;
    addVoiceNavigation();
  }
  handleFloatingButton('voiceNavigation');
}

const keyBoardRows = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '-', '^', '¥', 'Backspace'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '@', '['],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ':', ']', 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '\\', 'Shift'],
  ['あいう', '🦄', 'Spacebar'],
];

const shiftkeyBoardRows = [
  [
    '!',
    '"',
    '#',
    '$',
    '%',
    '&',
    "'",
    '(',
    ')',
    '〜',
    '=',
    '~',
    '|',
    'Backspace',
  ],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '`', '{'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '+', '*', '}', 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', '_', 'Shift'],
  ['あいう', '🦄', 'Spacebar'],
];

const japanesKeyboardRows = [
  [
    'ぬ',
    'ふ',
    'あ',
    'う',
    'え',
    'お',
    'や',
    'ゆ',
    'よ',
    'わ',
    'ほ',
    'へ',
    'ー',
    'Backspace',
  ],
  ['た', 'て', 'い', 'す', 'か', 'ん', 'な', 'に', 'ら', 'せ', '゛', '゜'],
  [
    'ち',
    'と',
    'し',
    'は',
    'き',
    'く',
    'ま',
    'の',
    'り',
    'れ',
    'け',
    'む',
    'Enter',
  ],
  [
    'Shift',
    'つ',
    'さ',
    'そ',
    'ひ',
    'こ',
    'み',
    'も',
    'ね',
    'る',
    'め',
    'ろ',
    'Shift',
  ],
  ['ABC', '1/2', 'Spacebar'],
];

const shiftedJapanesKeyboardRows = [
  [
    'ヌ',
    'フ',
    'ア',
    'ウ',
    'エ',
    'オ',
    'ヤ',
    'ユ',
    'ヨ',
    'ワ',
    'ホ',
    'ヘ',
    'ー',
    'Backspace',
  ],
  ['タ', 'テ', 'イ', 'ス', 'カ', 'ン', 'ナ', 'ニ', 'ラ', 'セ', '゛', '゜'],
  [
    'チ',
    'ト',
    'シ',
    'ハ',
    'キ',
    'ク',
    'マ',
    'ノ',
    'リ',
    'レ',
    'ケ',
    'ム',
    'Enter',
  ],
  [
    'Shift',
    'ツ',
    'サ',
    'ソ',
    'ヒ',
    'コ',
    'ミ',
    'モ',
    'ネ',
    'ル',
    'メ',
    'ロ',
    'Shift',
  ],
  ['ABC', '1/2', 'Spacebar'],
];

const commonJapaneseKeyboardRows = [
  [
    'ぁ',
    'ぃ',
    'ぅ',
    'ぇ',
    'ぉ',
    'ゃ',
    'ゅ',
    'ょ',
    'を',
    'っ',
    'ん',
    'ゔ',
    'Backspace',
  ],
  ['ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ャ', 'ュ', 'ョ', 'ヲ', 'ッ', 'ン', 'ヴ'],
  ['', '', '', '', '', '', '', '', '', '', '', '', 'Enter'],
  ['Shift', '', '', '', '', '', '', '', '', '', '', '', 'Shift'],
  ['ABC', '2/2', 'Spacebar'],
];

function triggerEvents(key) {
  const payload = {
    bubbles: true,
    cancelable: true,
    key: key,
    code: `Key${key?.toUpperCase?.()}`,
    charCode: key?.charCodeAt?.(0),
    keyCode: key?.charCodeAt?.(0),
  };

  const event = new KeyboardEvent('keydown', payload);
  const keyUp = new KeyboardEvent('keyup', payload);

  focusedInput.dispatchEvent(event);
  focusedInput.dispatchEvent(keyUp);
}

function handleVirtualKeyboardButtonClick(key) {
  switch (key) {
    case 'Backspace':
      if (focusedInput) {
        focusedInput.value = focusedInput.value.substring(
          0,
          focusedInput.value.length - 1
        );
        triggerEvents();
      }
      break;

    case 'Spacebar':
      if (focusedInput) {
        focusedInput.value += ' ';
        triggerEvents();
      }
      break;

    case 'Enter':
      focusedInput?.blur();
      if (!alwaysOnGuidyBoard) {
        virtualKeyboard.style.display = 'none';
      }
      break;

    case 'Shift':
      isShifted = !isShifted;
      createBoard();
      break;

    case 'あいう':
      isJapanese = true;
      createBoard();
      break;

    case 'ABC':
      isJapanese = false;
      createBoard();
      break;

    case '1/2':
      createBoard(commonJapaneseKeyboardRows);
      break;

    case '2/2':
      createBoard();
      break;

    default:
      if (
        focusedInput &&
        ((focusedInput?.getAttribute('type') === 'number' &&
          typeof key === 'number') ||
          !(focusedInput?.getAttribute('type') === 'number'))
      ) {
        focusedInput.value += key;
        const onChange = new Event('input', {
          bubbles: true,
          cancelable: true,
        });
        focusedInput.dispatchEvent(onChange);
        triggerEvents(key);
      }
  }
}

let longClickInterval = undefined;
let longClickTimeout = undefined;

const excludedLongPressKeys = ['Shift', 'あいう', '1/2', '2/2', 'ABC'];

function createKeyWithHandler(parent, key) {
  const button = document.createElement('button');
  button.classList.add(...['guidy-button', 'guidy-standardBtn']);
  button.textContent = key;
  button.onmousedown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleVirtualKeyboardButtonClick(key);
    if (!excludedLongPressKeys.includes(key)) {
      longClickTimeout = setTimeout(() => {
        longClickInterval = setInterval(() => {
          handleVirtualKeyboardButtonClick(key);
        }, 100);
      }, 500);
    }
  };
  window.onmouseup = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(longClickTimeout);
    clearInterval(longClickInterval);
  };
  parent.appendChild(button);
}

const guidyKeyboardKey = 'woAcc-guidykeyboard';

const inputSelector =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]), textarea';
const textFieldSelector = `${inputSelector}, [contenteditable=""], [contenteditable="true"], [role="textbox"]`;

function getTextFieldElement(target) {
  if (!target?.closest) {
    return null;
  }
  return target.closest(textFieldSelector);
}

function handleDomFocusIn(e) {
  const textField = getTextFieldElement(e.target);
  if (textField && virtualKeyboard) {
    focusedInput = textField;
    virtualKeyboard.style.display = 'block';

    if (
      floatingButtonsChild['virtualKeyboard'] &&
      !floatingButtonsChild['virtualKeyboard'].classList.contains('active')
    ) {
      floatingButtonsChild['virtualKeyboard'].classList.add('active');
      floatingButtonsChild['virtualKeyboard'].innerHTML =
        floatingButtonsData['virtualKeyboard']?.activeIcon;
    }

    textField.onblur = (e) => {
      if (e.relatedTarget?.closest(guidyKeyboardKey)) {
        focusedInput.focus();
      }
    };
  } else if (!e.target.closest(guidyKeyboardKey) && !alwaysOnGuidyBoard) {
    virtualKeyboard.style.display = 'none';

    if (
      floatingButtonsChild['virtualKeyboard'] &&
      floatingButtonsChild['virtualKeyboard'].classList.contains('active')
    ) {
      floatingButtonsChild['virtualKeyboard'].classList.remove('active');
      floatingButtonsChild['virtualKeyboard'].innerHTML =
        floatingButtonsData['virtualKeyboard']?.icon;
    }
  }
}

function clickHandler(e) {
  if (e.target.nodeName.toLowerCase() !== 'body') {
    const textField = getTextFieldElement(e.target);
    const focusedElement = document.activeElement;
    if (textField && virtualKeyboard) {
      focusedInput = textField;
      textField.focus();
      virtualKeyboard.style.display = 'block';
      return;
    }
    if (focusedElement && getTextFieldElement(focusedElement)) {
      return;
    }
    if (!alwaysOnGuidyBoard) {
      virtualKeyboard.style.display = 'none';
    }
  }
}

function handleVirtualKeyboardDOMEvents(add) {
  document.removeEventListener('focusin', handleDomFocusIn);
  document.removeEventListener('click', clickHandler);
  if (add) {
    document.addEventListener('focusin', handleDomFocusIn);
    document.addEventListener('click', clickHandler);
  }
}

function createBoard(initialRows) {
  let rows = getKeyBoardRows();
  if (initialRows) {
    rows = initialRows;
  }
  createVirtualKeyboardRows(rows);
}

function getKeyBoardRows() {
  if (isJapanese) {
    if (isShifted) {
      return shiftedJapanesKeyboardRows;
    } else {
      return japanesKeyboardRows;
    }
  }
  if (isShifted) {
    return shiftkeyBoardRows;
  }
  return keyBoardRows;
}

function createVirtualKeyboardRows(rows) {
  virtualKeyboard.innerHTML = '';
  const rowsWrapper = document.createElement('div');
  rowsWrapper.classList.add('hg-rows');
  rowsWrapper.onmousedown = (e) => {
    e.preventDefault();
    focusedInput?.focus();
  };
  rowsWrapper.onclick = (e) => {
    e.stopPropagation();
  };
  virtualKeyboard.appendChild(rowsWrapper);
  rows.map((rowWithButtons) => {
    const innerRow = document.createElement('div');
    innerRow.classList.add('guidy-row');
    rowWithButtons.map((key) => createKeyWithHandler(innerRow, key));
    rowsWrapper.appendChild(innerRow);
  });
}

function handleVirtualKeyboard(newKey) {
  handleVirtualKeyboardDOMEvents();
  if (virtualKeyboard && virtualKeyboard.closest('html')) {
    virtualKeyboard.style.display = 'none';
    alwaysOnGuidyBoard = false;
    document.documentElement.removeChild(virtualKeyboard);
  }
  isVirtualKeyboardOn = false;
  if (newKey !== 'default') {
    isVirtualKeyboardOn = true;
    handleVirtualKeyboardDOMEvents(true);
    if (!virtualKeyboard) {
      const style = document.createElement('style');
      style.innerHTML = virtualKeyboardStyles;
      document.head.appendChild(style);
      virtualKeyboard = document.createElement('div');
      virtualKeyboard.setAttribute('id', guidyKeyboardKey);
      virtualKeyboard.classList.add(
        ...['guidy-theme-default', 'hg-layout-default']
      );
      createVirtualKeyboardRows(keyBoardRows);
    }
    document.documentElement.appendChild(virtualKeyboard);
  }
  handleFloatingButton('virtualKeyboard');
}

function handleKeyDownSoundPlay(e) {
  if (e.type === 'click') {
    if (e.target.nodeName.toLowerCase() === 'section') {
      const element = e.target;
      say(
        `${
          element['aria-label'] ||
          element.role ||
          element.id ||
          element.className ||
          'section'
        }`
      );
    } else {
      return playSound();
    }
  }
  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'Tab':
      playSound();
      break;
  }
}

function playSound() {
  if (audioElement) {
    audioElement.play();
  }
}

let oldSelectedText = '';
let selectedText = '';

function handleSpeakSelection() {
  const selection = window.getSelection();

  if (selection.rangeCount > 0) {
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      selectedText += range.cloneContents().textContent;
    }
  } else if (
    document.activeElement &&
    document.activeElement.tagName === 'TEXTAREA'
  ) {
    const textarea = document.activeElement;
    selectedText = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    );
  }
  if (selectedText.length && selectedText !== oldSelectedText) {
    oldSelectedText = selectedText;
    say(selectedText);
    selectedText = '';
  }
  selectedText = '';
}

function addSoundElement() {
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.src = `${staticPath}audio/keyclick.mp3`;
    audioElement.autoplay = false;
    audioElement.pause();
    rootElement.appendChild(audioElement);
    document.addEventListener('keydown', handleKeyDownSoundPlay);
    document.addEventListener('click', handleKeyDownSoundPlay);
    document.addEventListener('mouseup', handleSpeakSelection);
  }
}

function removeSoundElement() {
  if (audioElement && !Object.values(isActive).includes(true)) {
    rootElement.removeChild(audioElement);
    audioElement = undefined;
    document.removeEventListener('keydown', handleKeyDownSoundPlay);
    document.removeEventListener('click', handleKeyDownSoundPlay);
    document.removeEventListener('mouseup', handleSpeakSelection);
  }
}

let originalStyles = {};

function generateUniqueKey() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000);
  const uniqueKey = timestamp.toString(36) + randomNum.toString(36);

  return uniqueKey;
}

// Function to apply styles
function applyStyles(keyProperty, newKey) {
  const allElements = document.querySelectorAll('*');
  for (const element of allElements) {
    if (!hasParentWithId(element, 'woAcc-RootEle')) {
      const computedStyle = window.getComputedStyle(element);
      if (keyProperty === 'textAlignment') {
        const existingDisplay = computedStyle.display;
        if (existingDisplay === 'flex') {
          // Store original justify-content
          if (!element.hasAttribute('guidyAcc-originalStyles')) {
            const uniqueKey = generateUniqueKey();
            originalStyles[uniqueKey] = {
              justifyContent: element.style.justifyContent,
              textAlign: element.style.textAlign,
            };
            element.setAttribute('guidyAcc-originalStyles', uniqueKey);
          }
          element.style.setProperty(
            'justify-content',
            textAlignment[newKey].div,
            'important'
          );
        }
      }
      if (textAlignment[newKey]?.text) {
        if (!element.hasAttribute('guidyAcc-originalStyles')) {
          const uniqueKey = generateUniqueKey();
          originalStyles[uniqueKey] = {
            justifyContent: element.style.justifyContent,
            textAlign: element.style.textAlign,
          };
          element.setAttribute('guidyAcc-originalStyles', uniqueKey);
        }
        element.style.setProperty(
          'text-align',
          textAlignment[newKey].text,
          'important'
        );
      }
    }
  }
}

// Function to revert styles
function revertStyles() {
  Object.keys(originalStyles).forEach((key) => {
    const styles = originalStyles[key];
    const element = document.querySelector(
      `[guidyAcc-originalStyles="${key}"]`
    );
    if (element) {
      if (styles.justifyContent) {
        element.style.setProperty(
          'justify-content',
          styles.justifyContent,
          'important'
        );
      } else {
        element.style.removeProperty('justify-content');
      }
      if (styles.textAlign) {
        element.style.setProperty('text-align', styles.textAlign, 'important');
      } else {
        element.style.removeProperty('text-align');
      }
      element.removeAttribute('guidyAcc-originalStyles');
    }
  });

  originalStyles = {};
}

function manageStyleApply(keyProperty, newKey, fieldId) {
  revertStyles(keyProperty);
  setMenuOptionToRefresh(false, fieldId);
  if (newKey !== 'default') {
    setMenuOptionToRefresh(true, fieldId, newKey);
    applyStyles(keyProperty, newKey);
  }
}

const originalVolumes = new Map();

// Function to mute all sounds
function muteSounds() {
  const audioElements = document.querySelectorAll('audio, video');
  audioElements.forEach((element) => {
    // Store the original volume
    originalVolumes.set(element, element.volume);
    // Mute the element
    element.volume = 0;
  });
}

// Function to unmute all sounds
function unmuteSounds() {
  const audioElements = document.querySelectorAll('audio, video');
  audioElements.forEach((element) => {
    // Restore the original volume
    if (originalVolumes.has(element)) {
      element.volume = originalVolumes.get(element);
      originalVolumes.delete(element);
    }
  });
}

function manageSoundMute(newKey, fieldId) {
  unmuteSounds();
  setMenuOptionToRefresh(false, fieldId);
  if (newKey === 'muteSounds') {
    setMenuOptionToRefresh(true, fieldId, newKey);
    muteSounds();
  }
}

function hasParentWithId(element, parentId) {
  let currentParent = element.parentElement;
  while (currentParent && currentParent !== document.body) {
    if (currentParent.id === parentId) {
      return true;
    }
    currentParent = currentParent.parentElement;
  }
  return false;
}

// Function to recursively find all text nodes
function getTextNodes(node) {
  let textNodes = [];
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
    textNodes.push(node);
  } else {
    for (let child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim() !== '') {
        textNodes.push(child);
      }
    }
  }
  return textNodes;
}

function getAllTextNodeParents() {
  let parentElements = new Set();
  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue.trim() !== '') {
        const parentElement = node.parentElement;
        if (parentElement && !parentElements.has(parentElement)) {
          parentElements.add(parentElement);
          saveInitialStyles(parentElement);
        }
      }
    } else {
      node.childNodes.forEach((child) => traverse(child));
    }
  }
  traverse(document.body);
  return Array.from(parentElements);
}

const handleHoverTooltip = (event) => {
  if (event) {
    let elementTarget = event.currentTarget;
    const tooltipText = elementTarget.href || elementTarget.alt || 'alt';
    if (tooltipText) {
      const tooltip = document.createElement('div');

      tooltip.textContent = tooltipText;
      addTooltipStyle(tooltip);
      const screenMidpoint = window.innerWidth / 2;

      if (event.clientX > screenMidpoint) {
        tooltip.style.top = event.pageY + 10 + 'px';
        tooltip.style.left = event.pageX - 250 + 'px';
      } else {
        tooltip.style.top = event.pageY + 10 + 'px';
        tooltip.style.left = event.pageX + 10 + 'px';
      }

      document.body.appendChild(tooltip);

      const removeTooltip = () => {
        tooltip.remove();
      };

      const mouseMoveEvent = removeTooltip;
      elementTarget.addEventListener('mouseout', mouseMoveEvent);
      tooltipMouseOverListener.push({
        eventName: 'mouseout',
        event: mouseMoveEvent,
        tag: elementTarget,
      });
    }
  }
};

function setLocalStorage(data) {
  window.localStorage.setItem(localStorageKey, JSON.stringify(data));
}

export function setDataById(id, updatedData) {
  localConfig[id] = updatedData;
  if (
    ![
      'pageStructure',
      'readingMode',
      'screenReader',
      'partialReader',
      'personalizeYourShortcut',
    ].includes(id)
  ) {
    const data = getLocalStorage();
    data[id] = updatedData;
    setLocalStorage(data);
    return data;
  }
}

function handleCursorMove(ev) {
  const size =
    visuals.guide.guideSize === 'default' ? 1 : visuals.guide.guideSize;
  if (readingMask) {
    const topPart = readingMask.children[0];
    const bottomPart = readingMask.children[1];
    topPart.style.height = `${ev.clientY - size * 10 - 40}px`;
    bottomPart.style.top = `${ev.clientY + size * 10 + 40}px`;
    bottomPart.style.height = `${window.innerHeight - ev.clientY + 40}px`;
    readingMask.style.opacity = 1;
  }
  if (readingGuide) {
    const cursor3part = readingGuide;
    cursor3part.style.top = `${ev.clientY}px`;
    cursor3part.style.left = `${ev.clientX}px`;
    cursor3part.style.opacity = 1;
  }
  if (simpleRuler) {
    if (simpleRuler.classList.contains('woAcc-rulerHighlighter')) {
      simpleRuler.style.top = `${
        ev.clientY + (window.visualViewport.height * 8) / 100
      }px`;
    } else {
      simpleRuler.style.top = `${
        ev.clientY + (window.visualViewport.height * 2.5) / 100
      }px`;
    }
    simpleRuler.style.opacity = 1;
  }
}

function handleReadingMask() {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0px';
  container.style.right = '0px';
  container.style.left = '0px';
  container.style.width = '100%';
  container.style['z-index'] = 2147483647;
  container.style.opacity = 0;

  const topPart = document.createElement('div');
  topPart.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  topPart.style.top = `0px`;
  topPart.style.right = '0px';
  topPart.style.left = '0px';
  topPart.style.pointerEvents = 'none';
  topPart.style.borderBottom = `10px solid ${hexToRgba(
    visuals.guide.guideColor,
    visuals.guide.guideOpacity
  )}`;
  topPart.style.position = 'fixed';

  const bottomPart = document.createElement('div');
  bottomPart.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  bottomPart.style.position = 'fixed';
  bottomPart.style.right = '0px';
  bottomPart.style.left = '0px';
  bottomPart.style.pointerEvents = 'none';
  bottomPart.style.borderTop = `10px solid ${hexToRgba(
    visuals.guide.guideColor,
    visuals.guide.guideOpacity
  )}`;
  container.appendChild(topPart);
  container.appendChild(bottomPart);
  rootElement.appendChild(container);
  const mouseMoveEvent = handleCursorMove;
  document.body.addEventListener('mousemove', mouseMoveEvent);
  mouseMoveListeners.push(mouseMoveEvent);
  readingMask = container;
}
function createReadingGuide() {
  const container = document.createElement('div');
  container.style.opacity = 0;
  container.classList.add('woAcc-cursor3Contain');
  const containerInner = document.createElement('div');
  containerInner.className = 'readingGuide';
  container.appendChild(containerInner);
  rootElement.appendChild(container);
  const mouseMoveEvent = handleCursorMove;
  document.body.addEventListener('mousemove', mouseMoveEvent);
  mouseMoveListeners.push(mouseMoveEvent);
  readingGuide = container;
}

export function handleContentStateChange(name, currentActive) {
  setDataById(name, currentActive);
  changeClassName(name, currentActive);
}

function handleIframeMessage(event) {
  switch (event.data.eventName) {
    case 'mousemove': {
      // Calculate the expression in JavaScript
      const rect = iframe.getBoundingClientRect();
      event.data.payload.clientX = rect.left + event.data.payload.clientX;
      handleCursorMove(event.data.payload);
      break;
    }
    case 'invalidKey': {
      hideLoaderOnButton();
      rootElement.style.display = 'none';
      break;
    }
    case 'iFrameLoaded': {
      isIframeLoaded = true;
      iframe.setAttribute('isIframeLoaded', true);
      sendPostMessage('config', {
        accountKey: window.woAccConfig.accountKey,
        settings: getLocalStorage(),
        widgetConfig: window.woAccConfig,
        site: window.location.href,
        keyboardShortcuts: getGuidyShortcuts(),
      });
      iframe.focus();
      // isWidgetOpen = true;
      // hideLoaderOnButton();
      break;
    }
    case 'modalStateChange': {
      if (event.data.payload.isOpen) {
        hideLoaderOnButton();
        isWidgetOpen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100vh';
        iframe.style.visibility = 'visible';
        iframe.style.opacity = '1';
        moveWidgetDiv.style.display = 'block';
      } else {
        isWidgetOpen = false;
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.visibility = 'hidden';
        iframe.style.opacity = '0';
        moveWidgetDiv.style.display = 'none';
      }
      break;
    }
    case 'setChangeContentState': {
      handleContentStateChange(
        event.data.payload.contentName,
        event.data.payload.currentActive
      );
      break;
    }
    case 'widgetPosition': {
      const { position } = event.data.payload;
      if (position === 'left') {
        iframe.style.left = '0px';
        moveWidgetDiv.style.left = '100px';
        iframe.style.right = 'auto';
        moveWidgetDiv.style.right = 'auto';
      } else {
        iframe.style.right = '0px';
        moveWidgetDiv.style.right = '100px';
        iframe.style.left = 'auto';
        moveWidgetDiv.style.left = 'auto';
      }
      break;
    }
    case 'keyboardShortcut': {
      const { shortcuts } = event.data.payload;
      setLocalStorageData('guidyShortcuts', shortcuts);
      if (isKeyboardShortcutsOn) {
        getGuidyShortcuts();
        rootElement.removeChild(keyboardShortcut);
        keyboardShortcut = undefined;
        createKeyboardShortCutsInfoDiv(
          floatingButtonsChild['keyboardShortcut'].classList.contains('active')
            ? true
            : false
        );
      }
      break;
    }
    case 'keyboardNavigation':
      handleKeyDownKeyboardNavigation(event.data.payload.event);
      break;
    case 'guidy-mouse-keypress': {
      if (!guidyCursor) return;
      handleMouseSimulation(event.data.payload.event);
      break;
    }
    case 'guidy-cursor-event': {
      if (!guidyCursor) return;
      const payload = event.data.payload;
      if (payload.type === 'cursorIconChange') {
        const icon = payload.icon;
        changeCursorIcon(icon);
      }
      if (payload.type === 'moveCursor') {
        const { direction, value } = payload;
        const cursorStyle = window.getComputedStyle(guidyCursor);
        guidyCursor.style[direction] =
          `${Number(cursorStyle[direction]?.slice(0, -2)) + value}px`;
      }
      break;
    }
    case 'furiganaReload': {
      window.location.reload();
      break;
    }
    case 'playToggleAudio': {
      if (toggleAudio) {
        toggleAudio.play();
      }
      break;
    }
    case 'localStorage': {
      const { key, value } = event.data.payload;
      setDataById(key, value);
      break;
    }
    case 'guidy-voice-navigation': {
      const { command } = event.data.payload;
      handleRecognizedText(command);
      break;
    }
    case 'url_redirect': {
      const { url } = event.data.payload;
      const link = newLinks.find((link) => link.url === url);
      if (link) {
        const linkElement = document.querySelector(
          `[guidy-data-navigation-id="${link.id}"]`
        );
        preventWidgetClose = true;
        if (linkElement) {
          linkElement.click();
        }
      } else {
        console.log('no link element found!');
        window.location.href = url;
      }
      break;
    }
    case 'form_input': {
      const { form_inputs } = event.data.payload;
      for (const form_input of form_inputs) {
        for (const key in formsMetaData) {
          if (Object.prototype.hasOwnProperty.call(formsMetaData, key)) {
            const form = document.querySelector(
              `[guidy-data-form-id="${key}"]`
            );
            if (form) {
              if (
                form_input?.action === 'select' ||
                form_input?.action === 'deselect'
              ) {
                const input =
                  form.querySelector(`[name="${form_input.name}"]`) ||
                  form.querySelector(`[guidy-name="${form_input.name}"]`);
                if (input.nodeName === 'SELECT') {
                  const option = form.querySelector(
                    `[value="${form_input.value}"]`
                  );
                  if (option) {
                    option.selected = form_input?.action === 'select';
                  }
                } else if (
                  input.nodeName === 'INPUT' &&
                  input.type === 'radio'
                ) {
                  const option = form.querySelector(
                    `[value="${form_input.value}"]`
                  );
                  if (option) {
                    option.checked = form_input?.action === 'select';
                  }
                } else if (
                  input.nodeName === 'INPUT' &&
                  input.type === 'checkbox'
                ) {
                  const option = form.querySelector(
                    `[value="${form_input.value}"]`
                  );
                  if (option) {
                    option.checked = form_input?.action === 'select';
                  }
                }
              }
              const input =
                form.querySelector(`[name="${form_input.name}"]`) ||
                form.querySelector(`[id="${form_input.name}"]`) ||
                form.querySelector(`[guidy-name="${form_input.name}"]`);

              if (input) {
                switch (form_input?.action) {
                  case 'set':
                    input.value = form_input.value;
                    break;
                  case 'clear':
                    input.value = '';
                    break;
                  case 'click':
                  case 'submit':
                    preventWidgetClose = true;
                    input.click();
                    break;
                  default:
                    break;
                }
              }
            }
          }
        }
      }

      break;
    }
    default: {
      console.info('unknown event', event);
    }
  }
}

const mouseMoveTextMagnifier = (event) => {
  const targetElement = event.target.closest('*');
  const textNodes = getTextNodes(targetElement);
  const text = textNodes
    .map((node) => node.nodeValue.trim())
    .join(' ')
    .trim();
  if (text) {
    textMagnifierTooltip.textContent = text;
    textMagnifierTooltip.style.display = 'block';

    let tooltipX = event.pageX + 10;
    let tooltipY = event.pageY + 10;

    const tooltipRect = textMagnifierTooltip.getBoundingClientRect();
    if (tooltipX + tooltipRect.width > window.innerWidth) {
      tooltipX = event.pageX - tooltipRect.width - 10;
    }
    textMagnifierTooltip.style.left = `${tooltipX}px`;
    textMagnifierTooltip.style.top = `${tooltipY}px`;

    const mouseLeave = () => {
      textMagnifierTooltip.style.display = 'none';
      tempListeners.forEach(({ tag, eventName, event }) => {
        tag.removeEventListener(eventName, event);
      });
      tempListeners.length = 0;
    };
    const params = {
      eventName: 'mouseleave',
      event: mouseLeave,
      tag: targetElement,
    };
    tempListeners.push(params);
    textMagnifierListener.push(params);
    targetElement.addEventListener('mouseleave', mouseLeave);
  }
};

const mouseMoveImageDescription = (event) => {
  const targetElement = event.target;
  if (targetElement.nodeName === 'IMG') {
    const text = targetElement.alt.trim();
    if (text) {
      imageDescriptionTooltip.style.left = `${event.pageX + 10}px`;
      imageDescriptionTooltip.style.top = `${event.pageY + 10}px`;
      imageDescriptionTooltip.style.display = 'block';
      imageDescriptionTooltip.textContent = text;
      const mouseLeave = () => {
        imageDescriptionTooltip.style.display = 'none';
        tempListeners.forEach(({ tag, eventName, event }) => {
          tag.removeEventListener(eventName, event);
        });
        tempListeners.length = 0;
      };
      const params = {
        eventName: 'mouseleave',
        event: mouseLeave,
        tag: targetElement,
      };
      tempListeners.push(params);
      imageDescriptionListener.push(params);
      targetElement.addEventListener('mouseleave', mouseLeave);
    }
  }
};
/**
 * content.js ==> React iframe
 *
 * send message to the child iframe i.e. Full widget on react
 * @param {String} eventName - name of the event to handle apply specific handlers
 * @param {Object} payload - payload data for handlers
 */
function sendPostMessage(eventName, payload) {
  iframe?.contentWindow?.postMessage(
    {
      eventName: eventName,
      payload,
      source: 'woAccParentToChild',
    },
    '*'
  );
}
export const loadWidget = async () => {
  if (!isIframeLoaded) {
    showLoaderOnButton();
    iframe.setAttribute(
      'src',
      `${iFrameCDN}/index.html?accountKey=${window.woAccConfig.accountKey}&isWOTesting=${isWoTestExists}&environment=${environment}&staticPath=${staticPath}&site=${window.location.href}`
    );
    Object.assign(iframe.style, {
      position: 'fixed',
      width: '100%',
      maxWidth: '601px',
      height: '100vh',
      top: 0,
      right: 0,
      border: 'none',
      visibility: 'hidden',
      userSelect: 'none',
    });

    injectMoveWidgetDiv();

    const position = getDataById('widgetPosition');
    if (position === 'left') {
      iframe.style.left = '0px';
      moveWidgetDiv.style.left = '100px';
      iframe.style.right = 'auto';
      moveWidgetDiv.style.right = 'auto';
    } else {
      iframe.style.right = '0px';
      moveWidgetDiv.style.right = '100px';
      iframe.style.left = 'auto';
      moveWidgetDiv.style.left = 'auto';
    }
    iframe.setAttribute('id', 'woAccIFrameMain');
    rootElement.appendChild(iframe);
  }

  const widgetIframe = await waitForSelector(
    '#woAccIFrameMain[isIframeLoaded="true"]',
    100000
  );

  if (widgetIframe) {
    preventWidgetClose = true;
    sendPostMessage('toggleModal', {
      isOpen: true,
    });
    setTimeout(() => {
      preventWidgetClose = false;
    }, 0);
  }

  if (moveWidgetDiv) {
    moveWidgetDiv.style.display = 'block';
  }
};

// iframe.addEventListener('load', () => {
//   setTimeout(() => {
//     hideLoaderOnButton();
//   }, 5000);
// });

iframe.addEventListener('error', () => {
  console.error('Failed to load iframe.');
});

let offsetX = 0;
let isDragging = false;
let rafId = null;
let pendingLeft = null;

function injectMoveWidgetDiv() {
  if (moveWidgetDiv) {
    moveWidgetDiv.remove();
  }

  moveWidgetDiv = document.createElement('div');
  moveWidgetDiv.id = 'guidy-moveWidgetDiv';
  moveWidgetDiv.className = 'guidy-moveWidgetDiv';
  rootElement.appendChild(moveWidgetDiv);

  moveWidgetDiv.addEventListener('pointerdown', (e) => {
    isDragging = true;
    offsetX = e.clientX - iframe.getBoundingClientRect().left;
    document.body.style.userSelect = 'none';
    iframe.style.pointerEvents = 'none';
    moveWidgetDiv.setPointerCapture(e.pointerId);
  });

  moveWidgetDiv.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    let left = e.clientX - offsetX;
    if (left <= 0) {
      left = 0;
    } else if (left + 615 >= window.innerWidth) {
      left = window.innerWidth - 615;
    }
    pendingLeft = left;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        iframe.style.left = `${pendingLeft}px`;
        moveWidgetDiv.style.left = `${pendingLeft + 100}px`;
        rafId = null;
      });
    }
  });

  const endDrag = (e) => {
    if (!isDragging) return;

    isDragging = false;
    preventWidgetClose = true;
    document.body.style.userSelect = '';
    iframe.style.pointerEvents = '';

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    try {
      moveWidgetDiv.releasePointerCapture(e.pointerId);
    } catch (err) {
      // capture may already be released — safe to ignore
    }

    setTimeout(() => {
      preventWidgetClose = false;
    }, 0);
  };

  moveWidgetDiv.addEventListener('pointerup', endDrag);
  moveWidgetDiv.addEventListener('pointercancel', endDrag);

  moveWidgetDiv.addEventListener('mouseleave', () => {
    if (!isDragging) {
      preventWidgetClose = false;
    }
  });
}

const getMenuOptionKey = (option) => {
  if (['darkContrast', 'lightContrast', 'highContrast'].includes(option)) {
    return 'contrast';
  } else if (
    ['highSaturation', 'monochrome', 'lowSaturation'].includes(option)
  ) {
    return 'saturationSettings';
  } else if (
    [
      'separatorDash',
      'separatorColor',
      'separatorHighlight',
      'separatorUnderline',
    ].includes(option)
  ) {
    return 'syllabicDivision';
  } else if (
    [
      'readingGuide',
      'readingMask',
      'simpleRuler',
      'rulerWithHighlighter',
    ].includes(option)
  ) {
    return 'readingGuide';
  } else {
    return 'colorAdjustments';
  }
};

const getActiveAndInactiveOptions = (options) => {
  const activeOptions = [];
  const inActiveOptions = [];
  options.map((option) => {
    if (option.value) {
      activeOptions.push(option);
    } else {
      inActiveOptions.push(option);
    }
  });
  return { activeOptions, inActiveOptions };
};

function prepareMenuOptions() {
  widgetConfig.mainMenuOptions.map((optionGroup) => {
    const groupKey = optionGroup.key;
    const { inActiveOptions } = getActiveAndInactiveOptions(
      optionGroup.options
    );
    inActiveOptions.map((option) => {
      let tempKey = groupKey;
      if (
        groupKey !== 'colorAdjustments' &&
        groupKey !== 'syllabicDivision' &&
        groupKey !== 'readingGuide'
      ) {
        delete constants[option.key];
      } else {
        tempKey = getMenuOptionKey(option.key);
        delete constants[tempKey][option.key];
      }
    });
  });
  const type = widgetConfig.widgetType;
  if (type === 'mini' || type === 'nano') {
    const array = type === 'mini' ? miniWidgetOptions : nanoWidgetOptions;
    const tempConstants = {};
    array.map((option) => {
      tempConstants[option] = constants[option];
    });
    constants = tempConstants;
  }
}

const setLocalStorageVisuals = () => {
  Object.entries(visuals).map(([key, value]) => {
    Object.keys(value).map((option) => {
      if (getDataById(option) !== 'default') {
        visuals[key][option] = getDataById(option);
      }
    });
  });
};

async function generateID(e) {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(e)
  );
  return Array.from(new Uint8Array(hash))
    .map((e) => e.toString(16))
    .join('')
    .slice(20);
}

async function translateWebsite(target, isMutations) {
  try {
    // if (
    //   document.guidyOriginalLanguage === getDataById('woAccessibilityLang') &&
    //   !isMutations
    // )
    //   return;
    if (
      document.guidyOriginalLanguage === getDataById('websiteLanguage') &&
      (document.guidyLastTranslateTo
        ? document.guidyLastTranslateTo === getDataById('websiteLanguage')
        : true)
    )
      return;

    let nodes = {};
    const payloadEntries = []; // ordered [nodeId, text], top-to-bottom, deduped
    const textNodes = elementsUnder(target);
    if (!textNodes.length) return;

    // Order nodes top-to-bottom (document order) so the page translates
    // progressively from the top down as each batch returns. elementsUnder
    // collects in reverse-DOM order, so we can't rely on its order here.
    textNodes.sort((a, b) => {
      if (a.node === b.node) return 0;
      const pos = a.node.compareDocumentPosition(b.node);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1; // a precedes b
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1; // a follows b
      return 0;
    });

    for (let { node: element, type } of textNodes) {
      let textContent = element.guidyOriginalText;
      if (textContent?.trim?.()) {
        let nodeId = await generateID(`${textContent + type}`);
        if (nodes[nodeId]) {
          nodes[nodeId].nodes.push(element);
          continue;
        }
        payloadEntries.push([nodeId, textContent]);
        nodes[nodeId] = {
          text: textContent,
          nodes: [element],
          type,
        };
      }
    }
    document.guidyLastTranslateTo = getDataById('websiteLanguage');

    const to = getDataById('websiteLanguage');
    const from = document.guidyOriginalLanguage ?? 'en';

    // Split into size-bounded batches (keeps each request under the backend
    // body limit that caused 413s), then send them sequentially in document
    // order and apply each batch the moment it returns — so the page fills in
    // top to bottom progressively, and one failed batch never blocks the rest.
    const batches = chunkPayloadBySize(payloadEntries, MAX_BATCH_BYTES);
    let langMarked = false;

    for (const batch of batches) {
      const translatedMap = await sendTranslationBatch(batch, to, from);
      if (!translatedMap || !Object.keys(translatedMap).length) continue;

      if (!langMarked) {
        langMarked = true;
        document.querySelector('html')?.setAttribute('lang', to);
        document.isTranslatedByGuidy = true;
      }

      applyTranslations(translatedMap, nodes);
    }
  } catch (error) {
    console.log(error);
  }
}

// ---------------------------------------------------------------------------
// Batched translation helpers
//
// Full-page translation used to send every text node in one request, which
// exceeds the node-api `express.json()` default 100KB body limit on large
// pages and returns 413. These helpers chunk the payload by serialized UTF-8
// size, then the caller sends the chunks sequentially in document order so the
// page translates top to bottom, applying each chunk's results independently.
// ---------------------------------------------------------------------------

const MAX_BATCH_BYTES = 50_000; // safely under the 100KB express.json default
const BATCH_MAX_RETRIES = 4; // retries per batch before it is skipped

const guidyTextEncoder =
  typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

/**
 * UTF-8 byte length of a string. Falls back to an encodeURIComponent estimate
 * if TextEncoder is unavailable. Bytes (not chars) matter: a non-ASCII source
 * language (e.g. Japanese ~3 bytes/char) would otherwise make a 50K-char batch
 * ~150KB and still 413.
 * @param {string} str
 * @returns {number}
 */
function guidyByteLength(str) {
  if (guidyTextEncoder) return guidyTextEncoder.encode(str).length;
  return unescape(encodeURIComponent(str)).length;
}

/**
 * Split ordered `[nodeId, text]` entries into batches whose serialized size
 * stays under `maxBytes`. Entries are consumed in the order given (document
 * order), so the resulting batches are top-to-bottom slices of the page. Takes
 * an array rather than an object so ordering can't be disturbed by V8
 * reordering integer-like keys. Guarantees at least one entry per batch, so a
 * single entry larger than the cap becomes its own (still far smaller than the
 * whole page).
 * @param {Array<[string,string]>} entries
 * @param {number} maxBytes
 * @returns {Array<Object<string,string>>}
 */
function chunkPayloadBySize(entries, maxBytes) {
  const batches = [];
  let current = {};
  let currentSize = 0;
  const ENTRY_OVERHEAD = 6; // "key":"value", quotes + colon + comma

  for (const [key, value] of entries) {
    const entrySize =
      guidyByteLength(key) + guidyByteLength(value) + ENTRY_OVERHEAD;

    // Flush the current batch before it would exceed the cap, but never flush
    // an empty batch (keeps >= 1 entry per batch even if it's oversized).
    if (currentSize > 0 && currentSize + entrySize > maxBytes) {
      batches.push(current);
      current = {};
      currentSize = 0;
    }

    current[key] = value;
    currentSize += entrySize;
  }

  if (currentSize > 0) batches.push(current);
  return batches;
}

/**
 * Send a single batch to the translation backend (same path as before, chosen
 * by isWoTestExists), retrying up to BATCH_MAX_RETRIES times. Returns the
 * batch's `{ nodeId: translation }` map, or `{}` if it fails permanently so the
 * caller skips it without affecting other batches.
 * @param {Object<string,string>} batch
 * @param {string} to
 * @param {string} from
 * @returns {Promise<Object<string,string>>}
 */
async function sendTranslationBatch(batch, to, from) {
  for (let attempt = 0; attempt <= BATCH_MAX_RETRIES; attempt++) {
    try {
      const result = isWoTestExists
        ? await translateText({ text: batch, to, from })
        : await callGuidyDashboard({
            path: 'translate',
            body: { text: batch, to, from },
          });

      if (result && !(result instanceof Error)) return result;
    } catch (error) {
      console.log('Translation batch attempt failed:', error);
    }

    // Small backoff before retrying (skip after the final attempt).
    if (attempt < BATCH_MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  console.warn('Translation batch failed after retries; skipping batch.');
  return {};
}

/**
 * Apply a batch's translations to the DOM. Only touches node ids present in
 * `translatedMap`, so it can run progressively per batch.
 * @param {Object<string,string>} translatedMap
 * @param {Object<string,{text:string,nodes:Node[],type:string}>} nodes
 */
function applyTranslations(translatedMap, nodes) {
  for (const nodeId in translatedMap) {
    const translation = translatedMap[nodeId];
    const currentNodes = nodes[nodeId];
    if (!translation || !currentNodes) continue;

    switch (currentNodes.type) {
      case 'text':
        currentNodes.nodes.forEach((n) => {
          n.textContent = translation;
        });
        break;
      case 'img':
        currentNodes.nodes.forEach((n) => {
          n.alt = translation;
        });
        break;
      case 'input':
        currentNodes.nodes.forEach((n) => {
          n.placeholder = translation;
        });
        break;
      default:
        break;
    }
  }
}

/**
 *
 * @param {NodeList} targets Nodelist / array of elements
 * @returns {TEXT_NODE[]} Array of objects containing text nodes
 */
function elementsUnder(targets, options = {}) {
  let elements = [];
  const { images = true, inputs = true, isRuby = false } = options;
  targets.forEach((target) => {
    if (target) {
      const collectElements = (node) => {
        for (let n = node.childNodes, i = n.length; i--; ) {
          let e = n[i];

          // Skip script and style elements and their child nodes
          // Also skip elements with guidy-ignore-translate attribute
          if (
            'SCRIPT' === e.parentNode.tagName ||
            'STYLE' === e.parentNode.tagName ||
            'SCRIPT' === e.tagName ||
            'STYLE' === e.tagName ||
            (isRuby && e.isFuriganaProcessed) ||
            (e.nodeType === 1 &&
              e.hasAttribute &&
              e.hasAttribute('guidy-ignore-translate'))
          )
            continue;

          let a = e.nodeType;

          // Collect text nodes (nodeType 3) with non-empty trimmed content
          if (3 === a && e.textContent.trim()) {
            elements.push({ type: 'text', node: e });

            // Collect images with alt attribute (nodeType 1)
          } else if (
            images &&
            1 === a &&
            e.tagName === 'IMG' &&
            e?.alt?.trim()
          ) {
            elements.push({ type: 'img', node: e });

            // Collect input fields with placeholder attribute (nodeType 1)
          } else if (
            inputs &&
            1 === a &&
            (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA') &&
            e?.placeholder?.trim()
          ) {
            elements.push({ type: 'input', node: e });
          }

          // Recurse into child nodes
          if (1 === a) {
            collectElements(e);
          }
        }
      };
      collectElements(target);
    }
  });

  return elements.filter((e, n) => elements.indexOf(e) >= n);
}

function saveTextNodeValues(e) {
  const textNodes = elementsUnder(e);

  textNodes.forEach((node) => {
    if (!node.node.guidyOriginalText) {
      switch (node.type) {
        case 'text':
          node.node.guidyOriginalText = node.node.textContent;
          break;
        case 'input':
          node.node.guidyOriginalText = node.node.placeholder;
          break;
        case 'img':
          node.node.guidyOriginalText = node.node.alt;
          break;
        default:
          break;
      }
    }
  });
}

function handleTranslationsBucket(node) {
  translationBucket.push(node);

  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }
  batchTimeout = setTimeout(() => {
    if (translationBucket.length > 0) {
      translateDOMContent(translationBucket, true);
      translationBucket = [];
    }
  }, 1000);
}

function observeLazyLoadedContent() {
  lazyLoadTranslationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            !(
              'SCRIPT' == node.parentNode?.tagName ||
              'STYLE' == node.parentNode?.tagName ||
              'SCRIPT' == node?.tagName ||
              'STYLE' == node?.tagName ||
              node.closest('#woAcc-RootEle')
            )
          ) {
            handleTranslationsBucket(node);
            if (
              node.tagName.toLowerCase() !== 'ruby' &&
              !node.guidyFurigana &&
              getDataById('furigana') === 'furiganaAdvance' &&
              !node.isFuriganaProcessed
            ) {
              handleAdvanceFuriganaBucket(node);
            }
          }
        });
      }
    });
  });
  lazyLoadTranslationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function translateDOMContent(target, isMutations = false) {
  if (!window.woAccConfig.isWebsiteLanguageEnabled) return;
  const targetLanguage = getDataById('websiteLanguage');
  if (targetLanguage === 'default') return;
  target?.length ? saveTextNodeValues(target) : (target = [document.body]);
  translateWebsite(target, isMutations);
  // const textNodes = createTextNodesObject(ignoreOldTranslations);
  // if (Object.keys(textNodes).length) {
  //   translateAndReplaceText(textNodes);
  // }
}

/**
 * Get link description
 * @param {HTMLElement} el
 * @returns {string} link description
 */
function getLinkDescription(el) {
  const byAriaLabel = el.getAttribute('aria-label');
  if (byAriaLabel) return byAriaLabel.trim();

  const byAriaLabelledBy = el.getAttribute('aria-labelledby');
  if (byAriaLabelledBy) {
    const labelEl = document.getElementById(byAriaLabelledBy);
    if (labelEl) return labelEl.textContent?.trim();
  }

  const byTitle = el.getAttribute('title');
  if (byTitle) return byTitle.trim();

  const imgAlt = el.querySelector('img')?.getAttribute('alt');
  if (imgAlt) return imgAlt.trim();

  const text = el.textContent;
  if (text) return text.trim();

  return '';
}

const linkSelector = [
  'a[href]',
  'area[href]',
  '[onclick]',
  '[role="link"]',
  '[data-href]',
].join(',');

const isJSRedirect = (val) => /location\s*(\.href)?\s*=/.test(val);

/**
 * Send website links for AI assistant to widget iframe on mutation
 */
function observeAndSendLinks() {
  let lastSentLinks = [];
  let debounceTimer = null;
  const DEBOUNCE_DELAY = 1000; // 🕐 give DOM 1s to settle before scanning

  const processLinks = async () => {
    const linkElements = document.querySelectorAll(linkSelector);
    const seen = new Set();
    newLinks = [];
    for (const element of linkElements) {
      const tag = element.tagName.toLowerCase();
      const href = element.getAttribute('href');
      const dataHref = element.getAttribute('data-href');
      const role = element.getAttribute('role');
      const onclick = element.getAttribute('onclick') || '';

      let url = null;

      if ((tag === 'a' || tag === 'area') && href) {
        url = href;
      } else if (isJSRedirect(onclick)) {
        url = onclick;
      } else if (dataHref || role === 'link') {
        url = dataHref || href || '';
      }

      if (url && !seen.has(element)) {
        seen.add(element);
        const description = getLinkDescription(element);
        const id = await generateID(`${url}-${description}`);
        element.setAttribute('guidy-data-navigation-id', id);
        newLinks.push({
          id,
          url,
          description,
        });
      }
    }

    // Compare with last sent to avoid sending unchanged data
    const isSame = arraysAreEqualById(newLinks, lastSentLinks);
    if (!isSame && newLinks.length) {
      lastSentLinks = newLinks;
      sendWebsiteStatePostMessage('WEBSITE_LINKS', newLinks);
    }
  };

  const scheduleProcessing = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processLinks, DEBOUNCE_DELAY);
  };

  const observer = new MutationObserver(scheduleProcessing);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'data-href', 'role', 'onclick'],
  });

  scheduleProcessing();
}

/**
 * Deep shallow-comparison utility (you can enhance it if needed)
 * @param {Array} a Array of objects with id, url, text properties
 * @param {Array} b Array of objects with id, url, text properties
 * @returns {boolean} True if arrays are equal, false otherwise
 */
function arraysAreEqualById(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x.id.localeCompare(y.id));
  const sortedB = [...b].sort((x, y) => x.id.localeCompare(y.id));
  return sortedA.every(
    (item, i) =>
      item.id === sortedB[i].id &&
      item.url === sortedB[i].url &&
      item.description === sortedB[i].description
  );
}

/**
 * Get a unique CSS selector for an element
 * @param {Element} element
 * @returns {string} Unique CSS selector
 */
function getUniqueSelector(element) {
  if (!(element instanceof Element)) return;

  const parts = [];

  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();

    if (element.id) {
      selector += `#${CSS.escape(element.id)}`;
      parts.unshift(selector);
      break; // ID is unique in DOM
    } else {
      // Add class names if any
      if (element.className && typeof element.className === 'string') {
        const classes = element.className
          .trim()
          .split(/\s+/)
          .map((cls) => `.${CSS.escape(cls)}`);
        selector += classes.join('');
      }

      // Use nth-child to ensure uniqueness
      const parent = element.parentNode;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }

      parts.unshift(selector);
      element = element.parentNode;
    }
  }

  return parts.join(' > ');
}
let guidyTempNameIncrementor = 0;
/**
 * Extract form metadata from a form element
 * @param {HTMLElement} formElement
 * @returns {Array} Array of objects with name, type, label, tag, required, options, multiple, id properties
 */
function extractFormMetadata(formElement) {
  const fields = [];

  const getLabelFor = (element) => {
    // 1. <label for="id">
    if (element.id) {
      const explicit = formElement.querySelector(`label[for="${element.id}"]`);
      if (explicit) return explicit.textContent.trim();
    }

    // 2. Wrapped <label><input>text</label>
    const wrapped = element.closest('label');
    if (wrapped) return wrapped.textContent.trim();

    // 3. aria-label
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label').trim();
    }

    // 4. aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const ref = formElement.querySelector(`#${labelledBy}`);
      if (ref) return ref.textContent.trim();
    }

    // 5. title as fallback
    if (element.title) return element.title.trim();

    // 6. placeholder as last resort
    if (element.placeholder) return element.placeholder.trim();

    return '';
  };

  const isCheckboxOrRadio = (el) =>
    el.type === 'checkbox' || el.type === 'radio';

  const inputs = formElement.querySelectorAll(
    'input, textarea, select, button'
  );

  const seenGroups = new Set();

  inputs.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const type = el.type || tag;
    const name =
      el.name ||
      el.id ||
      el.getAttribute('guidy-name') ||
      `guidyTempName${guidyTempNameIncrementor++}`;
    el.setAttribute('guidy-name', name);
    const id = el.id || null;
    const required = el.required || false;
    const placeholder = el.placeholder || '';
    const multiple = el.multiple || false;
    let options = [];
    let label = getLabelFor(el);

    // For radio and checkbox, group by name
    if (isCheckboxOrRadio(el)) {
      const groupKey = `${type}:${name}`;
      if (seenGroups.has(groupKey)) return;
      seenGroups.add(groupKey);

      let grouped = formElement.querySelectorAll(
        `input[type="${type}"][name="${name}"]`
      );
      if (!grouped.length) {
        grouped = formElement.querySelectorAll(
          `input[type="${type}"][guidy-name="${name}"]`
        );
      }

      options = Array.from(grouped).map((input) => ({
        value: input.value,
        label: getLabelFor(input),
        id: input.id || null,
      }));
      fields.push({
        name,
        type,
        label: label || name,
        tag,
        required,
        options,
        multiple: false,
        id,
      });
      return;
    }

    // Handle <select>
    if (tag === 'select') {
      options = Array.from(el.options).map((opt) => ({
        value: opt.value,
        label: opt.text.trim(),
      }));
    }

    // Handle <input list="">
    if (el.tagName === 'INPUT' && el.getAttribute('list')) {
      const listId = el.getAttribute('list');
      const dataList = formElement.querySelector(`datalist#${listId}`);
      if (dataList) {
        options = Array.from(dataList.options).map((opt) => ({
          value: opt.value,
          label: opt.label || opt.value,
        }));
      }
    }

    fields.push({
      name,
      type,
      label: label || name,
      placeholder,
      id,
      tag,
      required,
      options,
      multiple,
    });
  });

  return fields;
}

function observeAndSendFormMetaData() {
  let previouslySentForms = {};
  let debounceTimer = null;
  const DEBOUNCE_DELAY = 1000;

  const processForms = async () => {
    const formElements = document.querySelectorAll('form');
    formsMetaData = {};

    for (const form of formElements) {
      const fields = extractFormMetadata(form);
      const id = await generateID(getUniqueSelector(form));
      form.setAttribute('guidy-data-form-id', id);
      formsMetaData[id] = fields;
    }
    const isSame =
      JSON.stringify(formsMetaData) === JSON.stringify(previouslySentForms);
    if (!isSame) {
      previouslySentForms = formsMetaData;
      sendWebsiteStatePostMessage('WEBSITE_FORM_METADATA', formsMetaData);
    }
  };
  const scheduleProcessing = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processForms, DEBOUNCE_DELAY);
  };
  const observer = new MutationObserver(scheduleProcessing);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'id',
      'name',
      'placeholder',
      'required',
      'for',
      'aria-label',
      'title',
      'aria-labelledby',
      'type',
    ],
  });

  scheduleProcessing();
}

function sendWebsiteStatePostMessage(eventName, payload) {
  iframe?.contentWindow?.postMessage(
    {
      eventName,
      payload,
      source: 'guidyParentWebsiteStateSession',
    },
    '*'
  );
}

/**
 * Send website state/metadata to widget iframe
 */
function sendWebsiteState() {
  observeAndSendLinks();
  observeAndSendFormMetaData();
}

/**
 * Handle website state messages from widget iframe
 * @param {Event} event
 */
function handleWebsiteStateMessage(event) {
  const eventName = event.data.eventName;
  switch (eventName) {
    case 'WIDGET_LOADED':
      sendWebsiteState();
      break;
    default:
      console.warn(`Unhandled action type: ${eventName}`);
      break;
  }
}

/**
 * Ensures the focused element is visible within the viewport.
 * If not, scrolls it smoothly into view.
 *
 * Works for all focusable elements (inputs, buttons, links, custom focusable divs, etc.)
 */
function ensureFocusInView() {
  document.addEventListener(
    'focus',
    (event) => {
      const el = event.target;
      if (!(el instanceof HTMLElement)) return;

      // Check if the element is currently in the viewport
      const rect = el.getBoundingClientRect();
      const inViewport =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth);

      // Scroll smoothly if it's outside the viewport
      if (!inViewport) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // center the element vertically in the viewport
          inline: 'nearest', // adjust horizontally if needed
        });
      }
    },
    true
  ); // use capturing to catch all focus events
}

function setInitialThings() {
  setDataById('woAccessibilityLang', widgetConfig.language);
  setDataById('websiteLanguage', widgetConfig.websiteLanguage);
  prepareMenuOptions();
  setLocalStorageVisuals();
  styleElement = document.createElement('style');
  setInitialStyles();
  styleElement.innerHTML = initialCSStyles;
  document.head.appendChild(styleElement);
  Object.keys(constants).forEach((constantKey) => {
    const value = getDataById(constantKey) || 'default';
    if (value !== 'default') {
      // console.log('changeClassName', constantKey, value);
      changeClassName(constantKey, value, true);
    }
  });
  if (!isIframeLoaded) {
    iframe.setAttribute(
      'src',
      `${iFrameCDN}/index.html?accountKey=${window.woAccConfig.accountKey}&isWOTesting=${isWoTestExists}&site=${window.location.href}&environment=${environment}`
    );

    Object.assign(iframe.style, {
      position: 'fixed',
      width: '0px',
      maxWidth: '601px',
      height: '0px',
      top: 0,
      right: 0,
      border: 'none',
      visibility: 'hidden',
      userSelect: 'none',
      opacity: 0,
      borderRadius: '20px',
    });
    injectMoveWidgetDiv();

    const position = getDataById('widgetPosition');
    if (position === 'left') {
      iframe.style.left = '0px';
      moveWidgetDiv.style.left = '100px';
      iframe.style.right = 'auto';
      moveWidgetDiv.style.right = 'auto';
    } else {
      iframe.style.right = '0px';
      moveWidgetDiv.style.right = '100px';
      iframe.style.left = 'auto';
      moveWidgetDiv.style.left = 'auto';
    }

    iframe.setAttribute('id', 'woAccIFrameMain');
    iframe.allow = 'camera; microphone';
    rootElement.appendChild(iframe);
  }
  window.addEventListener('message', (event) => {
    if (event.data?.source === 'woAccChildToParent') {
      handleIframeMessage(event);
    }
    if (event.data?.source === 'guidyParentWebsiteStateSession') {
      handleWebsiteStateMessage(event);
    }
  });

  document.addEventListener('click', (e) => {
    const toggleBtn = document.getElementById('guidy-widget-btn');
    if (toggleBtn && (e.target === toggleBtn || toggleBtn.contains(e.target))) {
      return;
    }

    if (
      moveWidgetDiv &&
      (e.target === moveWidgetDiv || moveWidgetDiv.contains(e.target))
    ) {
      return;
    }

    if (!e.isTrusted) {
      return;
    }

    if (isIframeLoaded && isWidgetOpen && !preventWidgetClose) {
      sendPostMessage('toggleModal', {
        isOpen: false,
      });
    } else {
      preventWidgetClose = false;
    }
  });
  saveTextNodeValues([document.body]);
  document.guidyOriginalLanguage =
    document.querySelector('html').getAttribute('lang') ||
    navigator.languages.find((lang) => lang.length === 2) ||
    'en'; //storing default language of website

  setAiGeneratedImageAlt();
  ensureFocusInView();
  // TODO: handleVideoSubtitles();
  translateDOMContent();
  // if (getDataById('woAccessibilityLang') !== document.guidyOriginalLanguage)
  observeLazyLoadedContent();
  // loadWidget();
}

function getBackgroundColor(node) {
  let element = node;
  while (element) {
    const bgColor = window.getComputedStyle(element).backgroundColor;
    const rgba = bgColor.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/
    );

    if (rgba && parseFloat(rgba[4] || 1) > 0) {
      return bgColor;
    }

    element = element.parentElement;
  }
  return null;
}

setInitialThings();

async function setAiGeneratedImageAlt() {
  try {
    if (!imageAltData) {
      imageAltData = await getImageAlts();
    }
    if (imageAltData.length) {
      const allDOMImages = Array.from(
        document.querySelectorAll('img:not([guidy-replaced-alt])')
      );
      imageAltData.map((img) => {
        const images = allDOMImages.filter((i) => {
          return decodeURIComponent(i.src) === decodeURIComponent(img.imageURL);
        });
        if (images && images.length && img.aiGeneratedAlt?.length) {
          images.forEach((image) => {
            image.setAttribute('alt', img.aiGeneratedAlt);
            image.setAttribute('guidy-replaced-alt', true);
          });
        }
      });
    }
  } catch (e) {
    console.error('Fail to set ai generated image alt');
    console.log(e, '::::: e setAiGeneratedImageAlt');
  }
}

/**
 * Handle video subtitles
 */
async function handleVideoSubtitles() {
  const videos = Array.from(document.querySelectorAll('video'));
  // const videosURL = await Promise.all(
  //   Array.from(videos).reduce(async (acc, video) => {
  //     const guidyVideoId = await generateID(video.src);
  //     video.guidyVideoId = guidyVideoId;
  //     const videoURL = video.src;
  //     console.log({ videoURL });
  //     acc.push({ [guidyVideoId]: videoURL });
  //     return acc;
  //   }, [])
  // );
  const videosURL = {};
  const videoMap = new Map();
  // TODO: temp obj for development
  let i = 1;
  for (const video of videos) {
    const videoURL = video.src;
    console.log({ videoURL });
    // const guidyVideoId = await generateID(videoURL);
    const guidyVideoId = i++;
    video.guidyVideoId = guidyVideoId;
    videosURL[guidyVideoId] = videoURL;
    videoMap.set(`${guidyVideoId}`, video);
  }
  // TODO: Get tracks from dashboard |>
  // const trackFiles = await getTracksFromDashboard(videosURL);
  const trackFiles = {
    1: [
      {
        language: 'en',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkgwRgIhAL%2FmhDPtGoPeheRx02HKMRZwULC%2BrR9zhk6BW3KwwtzzAiEAu9Jqivdbze2USIJUeuqQjnfSh6iIPUG5Hsn2y8fArWcq3wMI6f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw1MzMyNjcwOTcxNDgiDNttPhVyww7VHdazSCqzA%2FvI%2FRUQ7PbNR3mYXxonpMq4A6eyXo3YPbdFh4MS%2FF49m6HnHpXn3TKR7T%2FkxwUjNVeiLWYjdm0HkVkjOuv0R7TgmnTUAjNzYjXpXc0uKw%2F8DJZsNWMYr%2BdX1MlDLG4CoqUD1gzjUyVUE3S9CkNDGM4xlOR7L9VEy8KnGvbx%2BqP8H4nR174xldI2eA%2BF%2B5HclH5kK3%2B0shTQ0flYhtfN5ufYBmZPz8zUvSAE81N90iiLvJwHE0krcBRw2AQunHLXjD%2F606Lwu5SHQRx6hz0%2FiNbfzumwmIEgB2b7dfqTgt1iK7gNBW3s1mpJpaRHl9I8D0JMkb5d3XqK%2FPT%2F1EyjYHtbeJGoQxuoQuENCywgSzxJFuySyRfiIK%2Bj5EAw%2Fi2E643eaHKL5BYPuLBEjPsaoVF0pg6nE1Ed9BhK5e9z%2BmjQC7PCYkXkyMnH4HqSJAsqgmbA%2BJ7FFusPYbdxlgTb2yiw%2F5K%2BXX1vYblPwrAfDgOcQljU6Px13uCzZmWqXt7%2B2NQLex6ei9Ac%2BgybkOKyLE5DCT8zcZ8la75MXbIQ7tijDbwWYkWOU4SSW9fh9iwgU%2Bd7%2BjD3kubEBjrdAhy82T%2BUbTo5WTnbkzFEvfWTMTprORDhLBJ4OqC0JJg14ikR7fzYWG1y8%2B%2FopzB%2Bfjb2izZI4rW2MSVDGBNE4%2FliZTdZA6DmUWYtNrgvHKUt9gieLSHCWTQoDRkldCkTXzJ8QQYmQbR2mZdpohcwF2LFfQMneRBXT8hlUCcGrSlA2XJ%2BHdI0y2nnT84d1vSrXsmUxuQatGns%2BZJjtX4w%2B1h5TCf%2BBBMe8A%2FnPtMEjpsEzG4Ctq2C1KNwao5DNG5lSerP%2BFK3L66Ku6p%2FOMSgwxD3gN2VEGWPcf7HME9qL3T61AOGCSDCYitMlGvS8Fb4FGhq8Kf%2FiRfnZwKcqdK2kJVZ7JP7%2B2YbUPrbCrPpwlMv6bgvJQHPSOg1LLnIRvKgZQZpAVtUv6UXNi7KKbiKOgzggeSb7suziOBwroRHakYWhvKll%2FlkBFwqFW15VWOPFiXAo01ATMeosyGlZU0%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6ITB4T6KC%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T074103Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=8f68f79d11f16a9ff93a5b5c31255464fce3931609c7816108ba8aeaa07752b0',
        // trackURL:
        //   'https://uniweb-company-origin.s3.ap-northeast-1.amazonaws.com/data/pFXBEdIb/next-js-portfolio-template-wo.vercel.app/video_caption/b9f9ac129e68e543b75c43e5943897a3f55d77b75173a500a212a2c51a57fb6b/video_track/owner/output4-ja.vtt',
        type: 'subtitles',
        label: 'English (US)',
      },
      {
        language: 'ja',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output-ja.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkgwRgIhAL%2FmhDPtGoPeheRx02HKMRZwULC%2BrR9zhk6BW3KwwtzzAiEAu9Jqivdbze2USIJUeuqQjnfSh6iIPUG5Hsn2y8fArWcq3wMI6f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw1MzMyNjcwOTcxNDgiDNttPhVyww7VHdazSCqzA%2FvI%2FRUQ7PbNR3mYXxonpMq4A6eyXo3YPbdFh4MS%2FF49m6HnHpXn3TKR7T%2FkxwUjNVeiLWYjdm0HkVkjOuv0R7TgmnTUAjNzYjXpXc0uKw%2F8DJZsNWMYr%2BdX1MlDLG4CoqUD1gzjUyVUE3S9CkNDGM4xlOR7L9VEy8KnGvbx%2BqP8H4nR174xldI2eA%2BF%2B5HclH5kK3%2B0shTQ0flYhtfN5ufYBmZPz8zUvSAE81N90iiLvJwHE0krcBRw2AQunHLXjD%2F606Lwu5SHQRx6hz0%2FiNbfzumwmIEgB2b7dfqTgt1iK7gNBW3s1mpJpaRHl9I8D0JMkb5d3XqK%2FPT%2F1EyjYHtbeJGoQxuoQuENCywgSzxJFuySyRfiIK%2Bj5EAw%2Fi2E643eaHKL5BYPuLBEjPsaoVF0pg6nE1Ed9BhK5e9z%2BmjQC7PCYkXkyMnH4HqSJAsqgmbA%2BJ7FFusPYbdxlgTb2yiw%2F5K%2BXX1vYblPwrAfDgOcQljU6Px13uCzZmWqXt7%2B2NQLex6ei9Ac%2BgybkOKyLE5DCT8zcZ8la75MXbIQ7tijDbwWYkWOU4SSW9fh9iwgU%2Bd7%2BjD3kubEBjrdAhy82T%2BUbTo5WTnbkzFEvfWTMTprORDhLBJ4OqC0JJg14ikR7fzYWG1y8%2B%2FopzB%2Bfjb2izZI4rW2MSVDGBNE4%2FliZTdZA6DmUWYtNrgvHKUt9gieLSHCWTQoDRkldCkTXzJ8QQYmQbR2mZdpohcwF2LFfQMneRBXT8hlUCcGrSlA2XJ%2BHdI0y2nnT84d1vSrXsmUxuQatGns%2BZJjtX4w%2B1h5TCf%2BBBMe8A%2FnPtMEjpsEzG4Ctq2C1KNwao5DNG5lSerP%2BFK3L66Ku6p%2FOMSgwxD3gN2VEGWPcf7HME9qL3T61AOGCSDCYitMlGvS8Fb4FGhq8Kf%2FiRfnZwKcqdK2kJVZ7JP7%2B2YbUPrbCrPpwlMv6bgvJQHPSOg1LLnIRvKgZQZpAVtUv6UXNi7KKbiKOgzggeSb7suziOBwroRHakYWhvKll%2FlkBFwqFW15VWOPFiXAo01ATMeosyGlZU0%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6ITB4T6KC%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T074011Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=cbc6b39a51f3b77b0cf09bc81378162f377e63cb8da45a5e028ca09bcf99c1b6',
        type: 'subtitles',
        label: 'Japanese (JP)',
      },
    ],
    2: [
      {
        language: 'en',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output1.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkcwRQIhAM2lSSqZsVx1v2ub2zb7DgzJWdsTXHxCsfuXV1qCsCJNAiAJeTu0mxVRV%2FBxMMvhfIwLxOgMEBf1MH%2B2u4WvAL%2FGXyrfAwjp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDUzMzI2NzA5NzE0OCIM5bw6kKzPFbUvpX4uKrMD6XzibR3uyk7oSj4pfhsobA2AME6pDbF4qKTyQjZmj1BD6HqOenLz%2BH2C%2BXJvv76QK6X41suEo4DrlBVn2qUf7mqRAjF%2B88rohjNagt%2BpSYxFvkB7DRHx%2FXaqyskJB67RhGx7Rs3983ohSccKAUlC0z6I4vkhlXgWaYYCXuLsHMzCpCdnKA%2BeUD3D7iIMMDRyY8abDbW0tUmQlF6vwN9Y7e89yB5kPoTKyt%2BcXsQIfmgTvlJ2GB9S%2BuWxE8DKXpAVYKhLwdqDhnDVeU%2BnGr25w8%2BVaLSeSEZPHCQ37lR0D76WeBMZHFhNi9QkMuMI%2FJhJyTcLbE%2Bvb0vT2X8%2Fa9V40BxYWwwUh6MubJAlLaiQjZk1oqOsFl%2B4woDPNu9T9m2EqLe9Nr%2FFymngoEPaKTa%2F1Dz1aQzUCrNrq%2Fp%2FjBtGeO3LU%2BPuAlh4sko8%2B4ahLo4n64%2F71mdFNDv07%2FlYNvMlF%2BNjxq13pKy8%2Bl3AbWq%2B44HLXunfILfnw4eEOgktP8Bc7b4tVLYFNCiv8xDmN5NCF1cU3xIatOmxE7SH1khIVON6rgpuiPq90fyxn23J1HHW5cKVMPeS5sQGOt4C5uZNCwW0J8LN8u0%2BBdNMpIIeWvNQZfA%2FHxlmCZT5C5UnU0rORUDDcVvaoQHK0RdPQ3Nnpt9iwKT%2BXqbKStg%2Bcpaop5jDaIUN0q1poB4wzcAFtHv1GUPL3NFs5vsWT%2Fovjsoz6LskVyTT0CtkLmaOYOQJypWe%2BS80tXa%2Fz%2BScBUz249Y4wouVB5KvKI690dM8E%2Fy4x2x1dp9GgoPuXKxbwgXQGqVqu5BeodEhMCX8BHF9BQWRpg33kafPWGqpasHDSLBvDMhsdwRHD8nlfcuRapX7%2FbevLiLX4XmdEgZFpvTjdiHeNNTX5KbP%2FaLRgVxf98GjzQVoNDvkuFOODj05OeP8P1HatXu1O51Pl2K3tmec24Xly00eFLYod%2B1zzeKfYN%2F1K5aAAmhq2GjE6734cS2bqJ%2BCuCTE8BfdcFskhdUiD3kI11WSWM5MziMzmkRe5HGaxdyYghVsSh%2B5hPI%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6F2ZFDDE5%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T075041Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=f3038e77a1af0afe8be259809fee5e7f0db2730826f80a66d873cd8f74ccbaf9',
        type: 'subtitles',
        label: 'English (US)',
      },
      {
        language: 'ja',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output1-ja.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkcwRQIhAM2lSSqZsVx1v2ub2zb7DgzJWdsTXHxCsfuXV1qCsCJNAiAJeTu0mxVRV%2FBxMMvhfIwLxOgMEBf1MH%2B2u4WvAL%2FGXyrfAwjp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDUzMzI2NzA5NzE0OCIM5bw6kKzPFbUvpX4uKrMD6XzibR3uyk7oSj4pfhsobA2AME6pDbF4qKTyQjZmj1BD6HqOenLz%2BH2C%2BXJvv76QK6X41suEo4DrlBVn2qUf7mqRAjF%2B88rohjNagt%2BpSYxFvkB7DRHx%2FXaqyskJB67RhGx7Rs3983ohSccKAUlC0z6I4vkhlXgWaYYCXuLsHMzCpCdnKA%2BeUD3D7iIMMDRyY8abDbW0tUmQlF6vwN9Y7e89yB5kPoTKyt%2BcXsQIfmgTvlJ2GB9S%2BuWxE8DKXpAVYKhLwdqDhnDVeU%2BnGr25w8%2BVaLSeSEZPHCQ37lR0D76WeBMZHFhNi9QkMuMI%2FJhJyTcLbE%2Bvb0vT2X8%2Fa9V40BxYWwwUh6MubJAlLaiQjZk1oqOsFl%2B4woDPNu9T9m2EqLe9Nr%2FFymngoEPaKTa%2F1Dz1aQzUCrNrq%2Fp%2FjBtGeO3LU%2BPuAlh4sko8%2B4ahLo4n64%2F71mdFNDv07%2FlYNvMlF%2BNjxq13pKy8%2Bl3AbWq%2B44HLXunfILfnw4eEOgktP8Bc7b4tVLYFNCiv8xDmN5NCF1cU3xIatOmxE7SH1khIVON6rgpuiPq90fyxn23J1HHW5cKVMPeS5sQGOt4C5uZNCwW0J8LN8u0%2BBdNMpIIeWvNQZfA%2FHxlmCZT5C5UnU0rORUDDcVvaoQHK0RdPQ3Nnpt9iwKT%2BXqbKStg%2Bcpaop5jDaIUN0q1poB4wzcAFtHv1GUPL3NFs5vsWT%2Fovjsoz6LskVyTT0CtkLmaOYOQJypWe%2BS80tXa%2Fz%2BScBUz249Y4wouVB5KvKI690dM8E%2Fy4x2x1dp9GgoPuXKxbwgXQGqVqu5BeodEhMCX8BHF9BQWRpg33kafPWGqpasHDSLBvDMhsdwRHD8nlfcuRapX7%2FbevLiLX4XmdEgZFpvTjdiHeNNTX5KbP%2FaLRgVxf98GjzQVoNDvkuFOODj05OeP8P1HatXu1O51Pl2K3tmec24Xly00eFLYod%2B1zzeKfYN%2F1K5aAAmhq2GjE6734cS2bqJ%2BCuCTE8BfdcFskhdUiD3kI11WSWM5MziMzmkRe5HGaxdyYghVsSh%2B5hPI%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6F2ZFDDE5%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T074946Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=fc9cb6a85155829c11c0e5d79f123037fadd319e2433480ac126a005fde4ea6a',
        type: 'subtitles',
        label: 'Japanese (JP)',
      },
    ],
    3: [
      {
        language: 'en',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output2.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkcwRQIhAM2lSSqZsVx1v2ub2zb7DgzJWdsTXHxCsfuXV1qCsCJNAiAJeTu0mxVRV%2FBxMMvhfIwLxOgMEBf1MH%2B2u4WvAL%2FGXyrfAwjp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDUzMzI2NzA5NzE0OCIM5bw6kKzPFbUvpX4uKrMD6XzibR3uyk7oSj4pfhsobA2AME6pDbF4qKTyQjZmj1BD6HqOenLz%2BH2C%2BXJvv76QK6X41suEo4DrlBVn2qUf7mqRAjF%2B88rohjNagt%2BpSYxFvkB7DRHx%2FXaqyskJB67RhGx7Rs3983ohSccKAUlC0z6I4vkhlXgWaYYCXuLsHMzCpCdnKA%2BeUD3D7iIMMDRyY8abDbW0tUmQlF6vwN9Y7e89yB5kPoTKyt%2BcXsQIfmgTvlJ2GB9S%2BuWxE8DKXpAVYKhLwdqDhnDVeU%2BnGr25w8%2BVaLSeSEZPHCQ37lR0D76WeBMZHFhNi9QkMuMI%2FJhJyTcLbE%2Bvb0vT2X8%2Fa9V40BxYWwwUh6MubJAlLaiQjZk1oqOsFl%2B4woDPNu9T9m2EqLe9Nr%2FFymngoEPaKTa%2F1Dz1aQzUCrNrq%2Fp%2FjBtGeO3LU%2BPuAlh4sko8%2B4ahLo4n64%2F71mdFNDv07%2FlYNvMlF%2BNjxq13pKy8%2Bl3AbWq%2B44HLXunfILfnw4eEOgktP8Bc7b4tVLYFNCiv8xDmN5NCF1cU3xIatOmxE7SH1khIVON6rgpuiPq90fyxn23J1HHW5cKVMPeS5sQGOt4C5uZNCwW0J8LN8u0%2BBdNMpIIeWvNQZfA%2FHxlmCZT5C5UnU0rORUDDcVvaoQHK0RdPQ3Nnpt9iwKT%2BXqbKStg%2Bcpaop5jDaIUN0q1poB4wzcAFtHv1GUPL3NFs5vsWT%2Fovjsoz6LskVyTT0CtkLmaOYOQJypWe%2BS80tXa%2Fz%2BScBUz249Y4wouVB5KvKI690dM8E%2Fy4x2x1dp9GgoPuXKxbwgXQGqVqu5BeodEhMCX8BHF9BQWRpg33kafPWGqpasHDSLBvDMhsdwRHD8nlfcuRapX7%2FbevLiLX4XmdEgZFpvTjdiHeNNTX5KbP%2FaLRgVxf98GjzQVoNDvkuFOODj05OeP8P1HatXu1O51Pl2K3tmec24Xly00eFLYod%2B1zzeKfYN%2F1K5aAAmhq2GjE6734cS2bqJ%2BCuCTE8BfdcFskhdUiD3kI11WSWM5MziMzmkRe5HGaxdyYghVsSh%2B5hPI%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6F2ZFDDE5%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T075157Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=d82f96ab425ad8c0913911be59e8dbc9007cb04980fee0dec0e4c7d9f8a8c183',
        type: 'subtitles',
        label: 'English (US)',
      },
      {
        language: 'ja',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output2-ja.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkcwRQIhAM2lSSqZsVx1v2ub2zb7DgzJWdsTXHxCsfuXV1qCsCJNAiAJeTu0mxVRV%2FBxMMvhfIwLxOgMEBf1MH%2B2u4WvAL%2FGXyrfAwjp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDUzMzI2NzA5NzE0OCIM5bw6kKzPFbUvpX4uKrMD6XzibR3uyk7oSj4pfhsobA2AME6pDbF4qKTyQjZmj1BD6HqOenLz%2BH2C%2BXJvv76QK6X41suEo4DrlBVn2qUf7mqRAjF%2B88rohjNagt%2BpSYxFvkB7DRHx%2FXaqyskJB67RhGx7Rs3983ohSccKAUlC0z6I4vkhlXgWaYYCXuLsHMzCpCdnKA%2BeUD3D7iIMMDRyY8abDbW0tUmQlF6vwN9Y7e89yB5kPoTKyt%2BcXsQIfmgTvlJ2GB9S%2BuWxE8DKXpAVYKhLwdqDhnDVeU%2BnGr25w8%2BVaLSeSEZPHCQ37lR0D76WeBMZHFhNi9QkMuMI%2FJhJyTcLbE%2Bvb0vT2X8%2Fa9V40BxYWwwUh6MubJAlLaiQjZk1oqOsFl%2B4woDPNu9T9m2EqLe9Nr%2FFymngoEPaKTa%2F1Dz1aQzUCrNrq%2Fp%2FjBtGeO3LU%2BPuAlh4sko8%2B4ahLo4n64%2F71mdFNDv07%2FlYNvMlF%2BNjxq13pKy8%2Bl3AbWq%2B44HLXunfILfnw4eEOgktP8Bc7b4tVLYFNCiv8xDmN5NCF1cU3xIatOmxE7SH1khIVON6rgpuiPq90fyxn23J1HHW5cKVMPeS5sQGOt4C5uZNCwW0J8LN8u0%2BBdNMpIIeWvNQZfA%2FHxlmCZT5C5UnU0rORUDDcVvaoQHK0RdPQ3Nnpt9iwKT%2BXqbKStg%2Bcpaop5jDaIUN0q1poB4wzcAFtHv1GUPL3NFs5vsWT%2Fovjsoz6LskVyTT0CtkLmaOYOQJypWe%2BS80tXa%2Fz%2BScBUz249Y4wouVB5KvKI690dM8E%2Fy4x2x1dp9GgoPuXKxbwgXQGqVqu5BeodEhMCX8BHF9BQWRpg33kafPWGqpasHDSLBvDMhsdwRHD8nlfcuRapX7%2FbevLiLX4XmdEgZFpvTjdiHeNNTX5KbP%2FaLRgVxf98GjzQVoNDvkuFOODj05OeP8P1HatXu1O51Pl2K3tmec24Xly00eFLYod%2B1zzeKfYN%2F1K5aAAmhq2GjE6734cS2bqJ%2BCuCTE8BfdcFskhdUiD3kI11WSWM5MziMzmkRe5HGaxdyYghVsSh%2B5hPI%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6F2ZFDDE5%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T075319Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=a8fd69cca1365fab7a10d7a56b00ee67b2c47a9d287f99226e3b71b309885727',
        type: 'subtitles',
        label: 'Japanese (JP)',
      },
    ],
    4: [
      {
        language: 'en',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output3.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkcwRQIhAM2lSSqZsVx1v2ub2zb7DgzJWdsTXHxCsfuXV1qCsCJNAiAJeTu0mxVRV%2FBxMMvhfIwLxOgMEBf1MH%2B2u4WvAL%2FGXyrfAwjp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDUzMzI2NzA5NzE0OCIM5bw6kKzPFbUvpX4uKrMD6XzibR3uyk7oSj4pfhsobA2AME6pDbF4qKTyQjZmj1BD6HqOenLz%2BH2C%2BXJvv76QK6X41suEo4DrlBVn2qUf7mqRAjF%2B88rohjNagt%2BpSYxFvkB7DRHx%2FXaqyskJB67RhGx7Rs3983ohSccKAUlC0z6I4vkhlXgWaYYCXuLsHMzCpCdnKA%2BeUD3D7iIMMDRyY8abDbW0tUmQlF6vwN9Y7e89yB5kPoTKyt%2BcXsQIfmgTvlJ2GB9S%2BuWxE8DKXpAVYKhLwdqDhnDVeU%2BnGr25w8%2BVaLSeSEZPHCQ37lR0D76WeBMZHFhNi9QkMuMI%2FJhJyTcLbE%2Bvb0vT2X8%2Fa9V40BxYWwwUh6MubJAlLaiQjZk1oqOsFl%2B4woDPNu9T9m2EqLe9Nr%2FFymngoEPaKTa%2F1Dz1aQzUCrNrq%2Fp%2FjBtGeO3LU%2BPuAlh4sko8%2B4ahLo4n64%2F71mdFNDv07%2FlYNvMlF%2BNjxq13pKy8%2Bl3AbWq%2B44HLXunfILfnw4eEOgktP8Bc7b4tVLYFNCiv8xDmN5NCF1cU3xIatOmxE7SH1khIVON6rgpuiPq90fyxn23J1HHW5cKVMPeS5sQGOt4C5uZNCwW0J8LN8u0%2BBdNMpIIeWvNQZfA%2FHxlmCZT5C5UnU0rORUDDcVvaoQHK0RdPQ3Nnpt9iwKT%2BXqbKStg%2Bcpaop5jDaIUN0q1poB4wzcAFtHv1GUPL3NFs5vsWT%2Fovjsoz6LskVyTT0CtkLmaOYOQJypWe%2BS80tXa%2Fz%2BScBUz249Y4wouVB5KvKI690dM8E%2Fy4x2x1dp9GgoPuXKxbwgXQGqVqu5BeodEhMCX8BHF9BQWRpg33kafPWGqpasHDSLBvDMhsdwRHD8nlfcuRapX7%2FbevLiLX4XmdEgZFpvTjdiHeNNTX5KbP%2FaLRgVxf98GjzQVoNDvkuFOODj05OeP8P1HatXu1O51Pl2K3tmec24Xly00eFLYod%2B1zzeKfYN%2F1K5aAAmhq2GjE6734cS2bqJ%2BCuCTE8BfdcFskhdUiD3kI11WSWM5MziMzmkRe5HGaxdyYghVsSh%2B5hPI%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6F2ZFDDE5%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T075438Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=95051c9026a24bba209fe4014d32b26ff50b7b662ac35eea5c420ec56abbef18',
        type: 'subtitles',
        label: 'English (US)',
      },
      {
        language: 'ja',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output3-ja.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkcwRQIhAM2lSSqZsVx1v2ub2zb7DgzJWdsTXHxCsfuXV1qCsCJNAiAJeTu0mxVRV%2FBxMMvhfIwLxOgMEBf1MH%2B2u4WvAL%2FGXyrfAwjp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDUzMzI2NzA5NzE0OCIM5bw6kKzPFbUvpX4uKrMD6XzibR3uyk7oSj4pfhsobA2AME6pDbF4qKTyQjZmj1BD6HqOenLz%2BH2C%2BXJvv76QK6X41suEo4DrlBVn2qUf7mqRAjF%2B88rohjNagt%2BpSYxFvkB7DRHx%2FXaqyskJB67RhGx7Rs3983ohSccKAUlC0z6I4vkhlXgWaYYCXuLsHMzCpCdnKA%2BeUD3D7iIMMDRyY8abDbW0tUmQlF6vwN9Y7e89yB5kPoTKyt%2BcXsQIfmgTvlJ2GB9S%2BuWxE8DKXpAVYKhLwdqDhnDVeU%2BnGr25w8%2BVaLSeSEZPHCQ37lR0D76WeBMZHFhNi9QkMuMI%2FJhJyTcLbE%2Bvb0vT2X8%2Fa9V40BxYWwwUh6MubJAlLaiQjZk1oqOsFl%2B4woDPNu9T9m2EqLe9Nr%2FFymngoEPaKTa%2F1Dz1aQzUCrNrq%2Fp%2FjBtGeO3LU%2BPuAlh4sko8%2B4ahLo4n64%2F71mdFNDv07%2FlYNvMlF%2BNjxq13pKy8%2Bl3AbWq%2B44HLXunfILfnw4eEOgktP8Bc7b4tVLYFNCiv8xDmN5NCF1cU3xIatOmxE7SH1khIVON6rgpuiPq90fyxn23J1HHW5cKVMPeS5sQGOt4C5uZNCwW0J8LN8u0%2BBdNMpIIeWvNQZfA%2FHxlmCZT5C5UnU0rORUDDcVvaoQHK0RdPQ3Nnpt9iwKT%2BXqbKStg%2Bcpaop5jDaIUN0q1poB4wzcAFtHv1GUPL3NFs5vsWT%2Fovjsoz6LskVyTT0CtkLmaOYOQJypWe%2BS80tXa%2Fz%2BScBUz249Y4wouVB5KvKI690dM8E%2Fy4x2x1dp9GgoPuXKxbwgXQGqVqu5BeodEhMCX8BHF9BQWRpg33kafPWGqpasHDSLBvDMhsdwRHD8nlfcuRapX7%2FbevLiLX4XmdEgZFpvTjdiHeNNTX5KbP%2FaLRgVxf98GjzQVoNDvkuFOODj05OeP8P1HatXu1O51Pl2K3tmec24Xly00eFLYod%2B1zzeKfYN%2F1K5aAAmhq2GjE6734cS2bqJ%2BCuCTE8BfdcFskhdUiD3kI11WSWM5MziMzmkRe5HGaxdyYghVsSh%2B5hPI%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6F2ZFDDE5%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T075420Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=160191d70fcc03a77dd81057f81fb1772d8112aec7f1b1c709d35a4b7a8f5554',
        type: 'subtitles',
        label: 'Japanese (JP)',
      },
    ],
    5: [
      {
        language: 'en',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output4.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkgwRgIhAL4SGTkFWhntnB7iTv9I9tIBW2dLfUfOdPY1CeWnd45pAiEAqkQLJp1kWyfcVDAVoZb4C1hc650EHEn5O2tP9NWBOEEq3wMI6f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw1MzMyNjcwOTcxNDgiDIIaX19mFiZPbLt5CCqzA0eJF5%2Frd5foPntLMcOxB4DeaXadBLpG1nUL6n0OnaZQrTgrTT3CpvDzQg1mx1JrrZiFfuXumCNT6XJI1%2BxsaShUOIoQ2AS4HTcxSHKq%2Be%2FMG34g8Tb2hiApPAenhNFpCWOKwNebJGREGB4cClbWiih2zxh0vAgGmpTYP5P7CrPAvtnDjJGYXT9k%2FugZ3NTsxQrklVn2Tr%2BV%2FeTtTshG6TO31ROZXOYnnGKq2O0r9KwrkjksxUymie3jo3LN%2FhPpVixUp%2FGUZ5tPkodClOwZXF2pz1v9WSRWgvoW%2Frs7YrqhHOUiZlXaB2rFnT7TKAMPVJC1JQXEv%2FMFrlGlq4wcQdPUzXd%2BYWfk49LR9T97i1pbwlZuhLL2SUSaZojMgxhX4appcXWFuXQtkDJuc0t4ghLTqM26fc5Znbn5kljjLTBXVQph1GhdX5uAxWcYrk3jUK0ubGrMljQbJngT6GS80S97JkTmCcW2uNBsqnBSrCYEPw4%2BvkXEGrVTeTSBDcIb0knnKUmJP0L2smC4nOCg2s7zdKY7G4E8jNlD%2FKsUIxqIyQI%2FykU4nOPTZzyfRVD7Ow5m%2FzD3kubEBjrdAoJV1H6z63Vbczh0ad4le%2BQdRzk4Tek7VsJ%2FkqaS3WEdDOgaYQTp89fkjOQw5HQwiJ275fUjnEnS7TVReLqQ7eKtlSdtHUW2kaXHBBLiolTZPEIh51KH0sKEAr73n5DjYcJBEWRwB6Tzo2lUYZvK9qmVThaktzZbG7DPqsRrgedM19MQgN1%2FiSbOMqK1t2sD%2B8LdtgqSQQW2X%2BLJeEM9pfsnjdPcGxGPRx4oPDSpD%2FZEApiPpAkjr4bH86xtlo7iwGIyqGvdbfiYeUm1qaWoFG7eY5tBCvXtZKguLdt%2B9RN%2Br5oUWQQ7CCV4mlUiPSBTPx9B7G1mi%2FVXgCVpJuHJEDdA%2F318o%2FyEjId%2FoJ%2FzjVyeSvNKUj3PiseV%2BrpGvtVZDwQA2Q9M%2FzP67jvhnXHDG6yuv77f1t4VJu%2B4g%2F9t16GQDu4JtZy%2FiuqDO7GicZe7kpne9dbHmIKDIkwJots%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6FHGM2JA2%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T075559Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=cdf13906d620f35a716852150241e624a1dda1933ea4b98d164f89a8c6dcf251',
        type: 'subtitles',
        label: 'English (US)',
      },
      {
        language: 'ja',
        trackURL:
          'https://staging-guidy-web-assets.s3.ap-northeast-1.amazonaws.com/video-tracks-demo/output4-ja.vtt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkgwRgIhAL4SGTkFWhntnB7iTv9I9tIBW2dLfUfOdPY1CeWnd45pAiEAqkQLJp1kWyfcVDAVoZb4C1hc650EHEn5O2tP9NWBOEEq3wMI6f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw1MzMyNjcwOTcxNDgiDIIaX19mFiZPbLt5CCqzA0eJF5%2Frd5foPntLMcOxB4DeaXadBLpG1nUL6n0OnaZQrTgrTT3CpvDzQg1mx1JrrZiFfuXumCNT6XJI1%2BxsaShUOIoQ2AS4HTcxSHKq%2Be%2FMG34g8Tb2hiApPAenhNFpCWOKwNebJGREGB4cClbWiih2zxh0vAgGmpTYP5P7CrPAvtnDjJGYXT9k%2FugZ3NTsxQrklVn2Tr%2BV%2FeTtTshG6TO31ROZXOYnnGKq2O0r9KwrkjksxUymie3jo3LN%2FhPpVixUp%2FGUZ5tPkodClOwZXF2pz1v9WSRWgvoW%2Frs7YrqhHOUiZlXaB2rFnT7TKAMPVJC1JQXEv%2FMFrlGlq4wcQdPUzXd%2BYWfk49LR9T97i1pbwlZuhLL2SUSaZojMgxhX4appcXWFuXQtkDJuc0t4ghLTqM26fc5Znbn5kljjLTBXVQph1GhdX5uAxWcYrk3jUK0ubGrMljQbJngT6GS80S97JkTmCcW2uNBsqnBSrCYEPw4%2BvkXEGrVTeTSBDcIb0knnKUmJP0L2smC4nOCg2s7zdKY7G4E8jNlD%2FKsUIxqIyQI%2FykU4nOPTZzyfRVD7Ow5m%2FzD3kubEBjrdAoJV1H6z63Vbczh0ad4le%2BQdRzk4Tek7VsJ%2FkqaS3WEdDOgaYQTp89fkjOQw5HQwiJ275fUjnEnS7TVReLqQ7eKtlSdtHUW2kaXHBBLiolTZPEIh51KH0sKEAr73n5DjYcJBEWRwB6Tzo2lUYZvK9qmVThaktzZbG7DPqsRrgedM19MQgN1%2FiSbOMqK1t2sD%2B8LdtgqSQQW2X%2BLJeEM9pfsnjdPcGxGPRx4oPDSpD%2FZEApiPpAkjr4bH86xtlo7iwGIyqGvdbfiYeUm1qaWoFG7eY5tBCvXtZKguLdt%2B9RN%2Br5oUWQQ7CCV4mlUiPSBTPx9B7G1mi%2FVXgCVpJuHJEDdA%2F318o%2FyEjId%2FoJ%2FzjVyeSvNKUj3PiseV%2BrpGvtVZDwQA2Q9M%2FzP67jvhnXHDG6yuv77f1t4VJu%2B4g%2F9t16GQDu4JtZy%2FiuqDO7GicZe7kpne9dbHmIKDIkwJots%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXYKJSEY6FHGM2JA2%2F20250811%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250811T075538Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=3d49c8538f0502e2b0b012fb83a0af589d4ea120dbda365c7356d28b8c41d3d1',
        type: 'subtitles',
        label: 'Japanese (JP)',
      },
    ],
  };
  appendTracks(trackFiles, videoMap);
}

/**
 * Returns the tracks for given videos from dashboard
 * @param {{ [videoId: string]: string }} videos - Object with videoId as key and videoURL as value
 * @returns {Promise<{ [videoId: string]: Array<{ language: string, trackURL: string, type: string, label: string }> }>} Object with videoId as key and trackURL as value
 */
async function getTracksFromDashboard(videos) {
  try {
    const response = await fetch(
      `${currentConfig.baseAPIUrl}/video-sub/${getAccountKey(currentConfig.cdnUrl)}/tracks`,
      {
        method: 'POST',
        body: JSON.stringify(videos),
        headers: {
          'Content-Type': 'application/json',
          Site: window.location.href,
        },
      }
    );
    if (!response.ok) {
      console.error('Failed to fetch tracks');
      return [];
    }
    const res = await response.json();
    return res.data;
  } catch (error) {
    console.error('Failed to fetch tracks');
    return [];
  }
}

/**
 * Appends tracks to videos
 * @param {{ [videoId: string]: Array<{ language: string, trackURL: string, type: string, label: string }> }} trackFiles - Object with videoId as key and trackURL as value
 * @param {Map<string, HTMLVideoElement>} videos - Map of videoId to video element
 */
async function appendTracks(trackFiles, videos) {
  for (const [videoId, tracks] of Object.entries(trackFiles)) {
    const video = videos.get(videoId);
    if (!video) continue;

    for (const track of tracks) {
      try {
        console.log('Fetching track:', track.trackURL);
        const response = await fetch(track.trackURL);
        if (!response.ok) {
          console.error(
            `Failed to fetch ${track.trackURL}: ${response.status} ${response.statusText}`
          );
          continue;
        }
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);

        const trackElement = document.createElement('track');
        trackElement.kind = track.type;
        trackElement.src = objectURL;
        trackElement.srclang = track.language;
        trackElement.label = track.label;
        if (track.language === 'ja') {
          trackElement.default = true;
        }

        video.appendChild(trackElement);
      } catch (err) {
        console.error('Error fetching track:', err);
      }
    }
  }
}

// PAGE STRUCTURE:-

function createListItem(header) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const listItem = document.createElement('li');
  listItem.setAttribute('data-hover', 'true');
  listItem.style.listStyle = 'none';
  listItem.style.marginBottom = isMobile ? '8px' : '10px';
  listItem.style.padding = isMobile ? '10px 12px' : '12px 14px';
  listItem.style.borderRadius = '12px';
  listItem.style.background = '#243044';
  listItem.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  listItem.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.03)';
  listItem.style.cursor = 'pointer';
  listItem.style.color = '#f8fafc';
  listItem.style.transition =
    'background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease';
  listItem.style.paddingLeft = `${
    ((parseInt(header.tag.charAt(1), 10) - 1) * 1 + 1) * 10
  }px`;
  listItem.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px; width: 100%;">
          <span style="flex-shrink: 0; min-width: ${isMobile ? '44px' : '52px'}; padding: 4px 8px; background: #1593EF; color: white; border-radius: 6px; font-size: ${isMobile ? '11px' : '12px'}; font-weight: 600; text-align: center;">${header.tag.toUpperCase()}</span>
          <a style="min-width: 0; margin: 0px; color: #f8fafc; text-decoration: none; line-height: 1.45; word-break: break-word; flex: 1; font-size: ${isMobile ? '13px' : '14px'};">${header.text}</a>
        </div>
    `;
  listItem.onmouseenter = () => {
    listItem.style.background = '#2b3a4d';
    listItem.style.borderColor = 'rgba(255, 255, 255, 0.14)';
    listItem.style.transform = 'translateY(-1px)';
  };
  listItem.onmouseleave = () => {
    listItem.style.background = '#243044';
    listItem.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    listItem.style.transform = 'translateY(0)';
  };
  listItem.onclick = () => {
    header.el.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  return listItem;
}

function generateLandkmarkItems(landmarks) {
  const items = [];
  landmarks.map((landmark) => {
    createLandmarkItem(landmark, items, 1);
  });
  return items;
}

function createLandmarkItem(landmark, items, level = 0) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const listItem = document.createElement('li');
  listItem.setAttribute('data-hover', 'true');
  listItem.style.listStyle = 'none';
  listItem.style.marginBottom = isMobile ? '8px' : '10px';
  listItem.style.padding = isMobile ? '10px 12px' : '12px 14px';
  listItem.style.borderRadius = '12px';
  listItem.style.background = '#243044';
  listItem.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  listItem.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.03)';
  listItem.style.cursor = 'pointer';
  listItem.style.color = '#f8fafc';
  listItem.style.transition =
    'background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease';
  listItem.style.marginLeft = `${Math.max(0, level - 1) * 14}px`;
  listItem.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px; width: 100%;">
          <span style="flex-shrink: 0; min-width: ${isMobile ? '44px' : '52px'}; padding: 4px 8px; background: #1593EF; color: white; border-radius: 6px; font-size: ${isMobile ? '11px' : '12px'}; font-weight: 600; text-align: center;"><\\></span>
          <div style="min-width: 0; flex: 1; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
            <span style="padding: 4px 8px; background: #314154; color: white; border-radius: 6px; font-size: ${isMobile ? '11px' : '12px'}; font-weight: 600;">${landmark.tag.toUpperCase()}</span>
          ${
            landmark.el.role ||
            landmark.el['aria-label'] ||
            landmark.el.id ||
            landmark.el.className
              ? `<span style="padding: 4px 8px; background: rgba(255, 255, 255, 0.06); color: #dbe4ee; border-radius: 6px; font-size: ${isMobile ? '11px' : '12px'}; font-weight: 500; word-break: break-word;">${
                  landmark.el.role ||
                  landmark.el['aria-label'] ||
                  landmark.el.id ||
                  landmark.el.className
                }</span>`
              : ''
          }
          </div>
        </div>
    `;
  listItem.onmouseenter = () => {
    listItem.style.background = '#2b3a4d';
    listItem.style.borderColor = 'rgba(255, 255, 255, 0.14)';
    listItem.style.transform = 'translateY(-1px)';
  };
  listItem.onmouseleave = () => {
    listItem.style.background = '#243044';
    listItem.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    listItem.style.transform = 'translateY(0)';
  };
  listItem.onclick = () => {
    landmark.el.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  items.push(listItem);
  if (landmark.children && landmark.children.length) {
    landmark.children.map((child) => {
      createLandmarkItem(child, items, level + 1);
    });
  }
}

function createLinkItem(link) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const listItem = document.createElement('li');
  listItem.setAttribute('data-hover', 'true');
  listItem.style.listStyle = 'none';
  listItem.style.marginBottom = isMobile ? '8px' : '10px';
  listItem.style.padding = isMobile ? '10px 12px' : '12px 14px';
  listItem.style.fontSize = isMobile ? '13px' : '14px';
  listItem.style.borderRadius = '12px';
  listItem.style.background = '#243044';
  listItem.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  listItem.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.03)';
  listItem.style.color = '#f8fafc';
  listItem.style.transition =
    'background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease';

  listItem.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px; width: 100%;">
        <span style="flex-shrink: 0; min-width: ${isMobile ? '44px' : '52px'}; padding: 4px 8px; background: #1593EF; color: white; border-radius: 6px; font-size: ${isMobile ? '11px' : '12px'}; font-weight: 600; text-align: center;">
            A
        </span>
        <a style="min-width: 0; display: flex; flex: 1; align-items: center; justify-content: space-between; gap: 12px; text-overflow: ellipsis; color: #f8fafc; text-decoration: none; margin: 0px;" target="_blank" href="${link.href}">
          <div style="min-width: 0; flex: 1; text-overflow: ellipsis; word-break: break-word; font-size: ${isMobile ? '13px' : '14px'};">${link.text}</div>
          <div style="flex-shrink: 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8.3335 3.33331H5.00016C4.55814 3.33331 4.13421 3.50891 3.82165 3.82147C3.50909 4.13403 3.3335 4.55795 3.3335 4.99998V15C3.3335 15.442 3.50909 15.8659 3.82165 16.1785C4.13421 16.4911 4.55814 16.6666 5.00016 16.6666H15.0002C15.4422 16.6666 15.8661 16.4911 16.1787 16.1785C16.4912 15.8659 16.6668 15.442 16.6668 15V11.6666M10.0002 9.99998L16.6668 3.33331M16.6668 3.33331V7.49998M16.6668 3.33331H12.5002" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </a>
      </div>
    `;
  listItem.onmouseenter = () => {
    listItem.style.background = '#2b3a4d';
    listItem.style.borderColor = 'rgba(255, 255, 255, 0.14)';
    listItem.style.transform = 'translateY(-1px)';
  };
  listItem.onmouseleave = () => {
    listItem.style.background = '#243044';
    listItem.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    listItem.style.transform = 'translateY(0)';
  };

  return listItem;
}

function getHeaderInfo() {
  const allHeaders = document.querySelectorAll(
    'h1:not(#woAcc-RootEle h1), h2:not(#woAcc-RootEle h2), h3:not(#woAcc-RootEle h3), h4:not(#woAcc-RootEle h4), h5:not(#woAcc-RootEle h5), h6:not(#woAcc-RootEle h6), [role="heading"]:not(#woAcc-RootEle [role="heading"])'
  );

  const headers = Array.from(allHeaders).filter(
    (header) => !header.closest('#woAcc-Modal')
  );
  const result = [];

  for (const header of headers) {
    result.push({
      tag: header.tagName,
      text: header.textContent,
      el: header,
    });
  }

  return result;
}

const landMarkSelector =
  'aside, header, nav, main, section, form, footer, search, [role="banner"], [role="navigation"], [role="complementary"], [role="contentinfo"], [role="table"], [role="search"]';

function buildTree(elements) {
  const tree = [];
  elements.map((element) => {
    let childList = Array.from(element.querySelectorAll(landMarkSelector));
    if (childList.length) {
      childList = childList.filter((child) => {
        return !child.closest('#woAcc-Modal') && !isNotVisible(child);
      });
    }
    const temp = {
      tag: element.tagName,
      el: element,
      children: childList.length ? buildTree(childList) : [],
    };
    tree.push(temp);
  });
  return tree;
}

function getLandmarksInfo() {
  const allLandMarks = document.querySelectorAll(landMarkSelector);
  const landmarks = Array.from(allLandMarks).filter((landmark) => {
    return (
      !landmark.closest('#woAcc-Modal') &&
      (landmark.parentElement.tagName === 'HTML' ||
        landmark.parentElement.tagName === 'BODY') &&
      !isNotVisible(landmark)
    );
  });
  // const result = [];
  // for (const landmark of landmarks) {
  //   result.push({
  //     tag: landmark.tagName,
  //     text: landmark.textContent,
  //     el: landmark,
  //   });
  // }
  return buildTree(landmarks);
}

function extractAnchorInfo() {
  const allAnchors = document.querySelectorAll('a[href]');
  const anchors = Array.from(allAnchors).filter(
    (header) => !header.closest('#woAcc-Modal')
  );
  // Function to extract the text or alt attribute of the first image
  const getTextOrAlt = (anchor) => {
    const textContent = anchor.textContent ? anchor.textContent.trim() : null;
    if (textContent) {
      return textContent;
    }

    const allImages = anchor.querySelectorAll('img');
    const images = Array.from(allImages).filter(
      (header) => !header.closest('#woAcc-Modal')
    );
    if (images.length > 0) {
      return images[0].alt;
    } else {
      return getTranslations('Missing link name');
    }
  };

  const result = [];
  for (const anchor of anchors) {
    result.push({
      tag: anchor.tagName,
      text: getTextOrAlt(anchor),
      href: anchor.getAttribute('href') || '#',
    });
  }

  return result;
}

const handleEscapeKeyPressInReadingModal = (event) => {
  if (event.key === 'Escape') {
    closeModal();
    event.stopPropagation();
    event.preventDefault();
  }
};

function showPageStructureModal() {
  currentOpenModal = 'pageStructure';
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const headers = getHeaderInfo();
  const headingsItem = Array.from(headers).map((header) => {
    return createListItem(header);
  });

  const landmarks = getLandmarksInfo();
  const landmarksItem = generateLandkmarkItems(landmarks);
  // const landmarksItem = Object.keys(landmarks).map((key) => {
  //   return createLandmarkItem(landmarks[key]);
  // });

  const links = extractAnchorInfo();
  const linkItems = [];
  Array.from(links).forEach((link) => {
    if (link && link.text) {
      const result = createLinkItem(link);
      if (result) {
        linkItems.push(result);
      }
    }
  });

  preventWidgetClose = true;
  innerContainer = generateModal({
    pageTitle: getTranslations('Page Structure'),
    mainContainerId: 'woAcc-PageStructure',
    closeModal: closeModal,
  });
  const pageStructureRoot = document.getElementById('woAcc-PageStructure');
  const pageStructureShell = pageStructureRoot?.firstElementChild;
  const pageStructureHeader = pageStructureShell?.firstElementChild;
  const pageStructureContentContainer = pageStructureShell?.children?.[1];
  const pageStructureInnerContainer =
    pageStructureContentContainer?.firstElementChild;

  if (pageStructureHeader) {
    pageStructureHeader.style.background = '#1E293BF2';
    pageStructureHeader.style.borderBottom =
      '1px solid rgba(255, 255, 255, 0.06)';
    if (isMobile) {
      pageStructureHeader.style.borderTopLeftRadius = '16px';
      pageStructureHeader.style.borderTopRightRadius = '16px';
    }
  }

  if (pageStructureContentContainer) {
    pageStructureContentContainer.style.backgroundColor = '#1E293A';
    pageStructureContentContainer.style.padding = '14px';
    pageStructureContentContainer.style.borderBottomLeftRadius = '20px';
    pageStructureContentContainer.style.borderBottomRightRadius = '20px';
    pageStructureContentContainer.style.overflowX = 'hidden';
    if (isMobile) {
      pageStructureContentContainer.style.height = 'auto';
      pageStructureContentContainer.style.maxHeight = 'calc(100dvh - 92px)';
      pageStructureContentContainer.style.padding = '10px';
    }
  }

  if (pageStructureInnerContainer) {
    pageStructureInnerContainer.style.backgroundColor = 'transparent';
    pageStructureInnerContainer.style.border = 'none';
    pageStructureInnerContainer.style.boxShadow = 'none';
    pageStructureInnerContainer.style.padding = '0';
    pageStructureInnerContainer.style.width = '100%';
    pageStructureInnerContainer.style.maxWidth = '100%';
  }

  if (pageStructureShell) {
    pageStructureShell.style.width = isMobile ? 'calc(100vw - 12px)' : '100%';
    pageStructureShell.style.maxWidth = isMobile
      ? 'calc(100vw - 12px)'
      : '600px';
    pageStructureShell.style.height = isMobile ? 'calc(100dvh - 12px)' : '90%';
    pageStructureShell.style.margin = isMobile ? '6px auto' : 'auto';
    pageStructureShell.style.justifyContent = isMobile
      ? 'flex-start'
      : 'center';
    pageStructureShell.style.alignItems = 'stretch';
  }

  document.body.removeEventListener(
    'keydown',
    handleEscapeKeyPressInReadingModal
  );
  document.body.addEventListener('keydown', handleEscapeKeyPressInReadingModal);

  // Create wrapper div
  var wrapperDiv = document.createElement('div');
  wrapperDiv.style.width = '100%';
  wrapperDiv.style.display = 'flex';
  wrapperDiv.style.gap = '6px';
  wrapperDiv.style.background = '#243044';
  wrapperDiv.style.padding = '6px';
  wrapperDiv.style.borderRadius = '16px';
  wrapperDiv.style.border = '1px solid rgba(255, 255, 255, 0.06)';
  if (isMobile) {
    wrapperDiv.style.gap = '4px';
    wrapperDiv.style.padding = '4px';
    wrapperDiv.style.borderRadius = '14px';
  }

  const headingsSection = document.createElement('div');
  const landMarksSection = document.createElement('div');
  const linkSection = document.createElement('div');

  headingsSection.style.display = 'block';
  headingsSection.style.marginTop = '12px';
  headingsSection.style.borderRadius = '14px';
  headingsSection.style.background = 'transparent';
  headingsSection.style.padding = '0';
  headingsSection.style.border = 'none';
  if (isMobile) {
    headingsSection.style.marginTop = '10px';
  }

  landMarksSection.style.display = 'none';
  landMarksSection.style.marginTop = '12px';
  landMarksSection.style.borderRadius = '14px';
  landMarksSection.style.background = 'transparent';
  landMarksSection.style.padding = '0';
  landMarksSection.style.border = 'none';
  if (isMobile) {
    landMarksSection.style.marginTop = '10px';
  }

  linkSection.style.display = 'none';
  linkSection.style.marginTop = '12px';
  linkSection.style.borderRadius = '14px';
  linkSection.style.background = 'transparent';
  linkSection.style.padding = '0';
  linkSection.style.border = 'none';
  if (isMobile) {
    linkSection.style.marginTop = '10px';
  }

  // Create headings radio button
  var headingButton = document.createElement('span');
  headingButton.textContent = getTranslations('Heading');
  headingButton.style.flex = '1 1 0%';
  headingButton.style.padding = '11px 12px';
  headingButton.style.textAlign = 'center';
  headingButton.style.cursor = 'pointer';
  headingButton.style.background = '#314154';
  headingButton.style.color = '#ffffff';
  headingButton.tabIndex = 0;
  headingButton.style.border = 'none';
  headingButton.style.borderRadius = '12px';
  headingButton.style.fontWeight = '600';
  headingButton.style.transition =
    'background-color 0.15s ease, color 0.15s ease';
  if (isMobile) {
    headingButton.style.padding = '9px 10px';
    headingButton.style.fontSize = '13px';
  }
  headingButton.onclick = function () {
    setPageStructureTab(headingButton);
  };

  // Create landmarks radio button
  var landMarksButton = document.createElement('span');
  landMarksButton.textContent = getTranslations('Landmarks');
  landMarksButton.style.flex = '1 1 0%';
  landMarksButton.style.padding = '11px 12px';
  landMarksButton.style.textAlign = 'center';
  landMarksButton.style.cursor = 'pointer';
  landMarksButton.style.background = '#243044';
  landMarksButton.style.color = '#dbe4ee';
  landMarksButton.tabIndex = 0;
  landMarksButton.style.border = 'none';
  landMarksButton.style.borderRadius = '12px';
  landMarksButton.style.fontWeight = '600';
  landMarksButton.style.transition =
    'background-color 0.15s ease, color 0.15s ease';
  if (isMobile) {
    landMarksButton.style.padding = '9px 10px';
    landMarksButton.style.fontSize = '13px';
  }
  landMarksButton.onclick = function () {
    setPageStructureTab(landMarksButton);
  };

  // Create links radio button
  var linksButton = document.createElement('span');
  linksButton.textContent = getTranslations('Links');
  linksButton.style.flex = '1 1 0%';
  linksButton.style.padding = '11px 12px';
  linksButton.style.textAlign = 'center';
  linksButton.style.cursor = 'pointer';
  linksButton.style.background = '#243044';
  linksButton.style.color = '#dbe4ee';
  linksButton.style.border = 'none';
  linksButton.style.borderRadius = '12px';
  linksButton.style.fontWeight = '600';
  linksButton.style.transition =
    'background-color 0.15s ease, color 0.15s ease';
  if (isMobile) {
    linksButton.style.padding = '9px 10px';
    linksButton.style.fontSize = '13px';
  }
  linksButton.onclick = function () {
    setPageStructureTab(linksButton);
  };
  linksButton.tabIndex = 0;

  const setPageStructureTab = (activeButton) => {
    const buttons = [headingButton, landMarksButton, linksButton];
    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.style.background = isActive ? '#314154' : '#243044';
      button.style.color = isActive ? '#ffffff' : '#dbe4ee';
      button.style.boxShadow = 'none';
      button.style.transform = 'none';
    });
    headingsSection.style.display =
      activeButton === headingButton ? 'block' : 'none';
    landMarksSection.style.display =
      activeButton === landMarksButton ? 'block' : 'none';
    linkSection.style.display = activeButton === linksButton ? 'block' : 'none';
  };

  // Append radio buttons to wrapper div
  wrapperDiv.style.background = '#243044';
  wrapperDiv.style.padding = '6px';
  wrapperDiv.style.borderRadius = '16px';
  wrapperDiv.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  wrapperDiv.appendChild(headingButton);
  wrapperDiv.appendChild(landMarksButton);
  wrapperDiv.appendChild(linksButton);

  // Append wrapper div to body
  innerContainer.innerContentContainer.appendChild(wrapperDiv);

  innerContainer.contentContainer.appendChild(headingsSection);
  innerContainer.contentContainer.appendChild(landMarksSection);
  innerContainer.contentContainer.appendChild(linkSection);
  innerContainer.contentContainer.style.padding = '18px';
  innerContainer.innerContentContainer.style.padding = '16px';
  if (isMobile) {
    innerContainer.contentContainer.style.padding = '10px';
    innerContainer.innerContentContainer.style.padding = '10px';
  }

  headingsItem.map((child) => {
    headingsSection.appendChild(child);
  });

  if (landmarksItem.length) {
    landmarksItem.map((child) => {
      landMarksSection.appendChild(child);
    });
  } else {
    const noLandmarkDiv = document.createElement('div');
    noLandmarkDiv.style.height = '100%';
    noLandmarkDiv.style.width = '100%';
    noLandmarkDiv.style.display = 'flex';
    noLandmarkDiv.style.justifyContent = 'center';
    noLandmarkDiv.style.alignItems = 'center';
    noLandmarkDiv.textContent = getTranslations('No landmarks found on page.');

    landMarksSection.appendChild(noLandmarkDiv);
  }

  linkItems.map((child) => {
    linkSection.appendChild(child);
  });

  setTimeout(() => {
    headingButton.focus();
    setPageStructureTab(headingButton);
  }, 200);
  return innerContainer;
}

function closeModal() {
  closeMainModal();
  if (innerContainer) {
    innerContainer = null;
    sendPostMessage('closeModal', currentOpenModal);
  }

  currentOpenModal = '';
}

// READING MODE

// eslint-disable-next-line no-unused-vars
function showReadingModeModal() {
  currentOpenModal = 'readingMode';

  innerContainer = generateModal({
    pageTitle: getTranslations('Reading Mode'),
    mainContainerId: 'WOReadingModeModal',
    closeModal: closeModal,
  });

  manageTagAppend(innerContainer.innerContentContainer, document.body);

  document.body.removeEventListener(
    'keydown',
    handleEscapeKeyPressInReadingModal
  );
  document.body.addEventListener('keydown', handleEscapeKeyPressInReadingModal);

  // Create wrapper div
  var wrapperDiv = document.createElement('div');
  wrapperDiv.style.width = '100%';
  wrapperDiv.style.display = 'flex';

  const headingsSection = document.createElement('div');
  const linkSection = document.createElement('div');
  headingsSection.style.display = 'block';
  linkSection.style.display = 'none';

  return innerContainer.innerContentContainer;
}

function manageTagAppend(parentElementOnModal, elementToRead) {
  if (
    elementToRead.nodeName !== 'IFRAME' &&
    elementToRead.id !== 'woAccessibilityRootEle'
  ) {
    if (elementToRead.nodeName === '#text') {
      parentElementOnModal.append(
        (parentElementOnModal.innerText
          ? parentElementOnModal.cloneNode().innerText + ''
          : '') + elementToRead.data
      );
    } else if (
      !['#comment', 'SCRIPT', 'STYLE'].includes(parentElementOnModal.nodeName)
    ) {
      for (let i = 0; i < elementToRead.childNodes.length; i++) {
        const element = elementToRead.childNodes.item(i);
        if (element.id !== 'woAccessibilityRootEle') {
          if (!['#comment', 'SCRIPT', 'STYLE'].includes(element.nodeName)) {
            if (element.nodeName === '#text') {
              parentElementOnModal.append(
                (parentElementOnModal.innerText
                  ? parentElementOnModal.cloneNode().innerText + ''
                  : '') + element.data
              );
            } else {
              const styles = window.getComputedStyle(element);
              if (
                !(
                  styles.getPropertyValue('display') === 'none' ||
                  styles.getPropertyValue('visibility') === 'hidden'
                )
              ) {
                if (element.innerText) {
                  let innerElement = parentElementOnModal;
                  if (
                    [
                      'p',
                      'font',
                      'a',
                      'li',
                      'h1',
                      'h2',
                      'h3',
                      'h4',
                      'h5',
                      'h6',
                      'ol',
                      'ul',
                      'menu',
                      'code',
                      'button',
                    ].includes(element.nodeName.toLowerCase())
                  ) {
                    const newElement = document.createElement(
                      element.nodeName === 'BUTTON' ? 'p' : element.nodeName
                    );
                    if (element.nodeName === 'A') {
                      newElement.href = element.href;
                    }
                    parentElementOnModal.appendChild(newElement);
                    innerElement = newElement;
                  }
                  if (element.children.length) {
                    manageTagAppend(innerElement, element);
                  } else {
                    innerElement.append(
                      (innerElement.innerHTML
                        ? innerElement.cloneNode().innerHTML + ''
                        : '') + element.innerHTML
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// Screen Reader

function startScreenReader() {
  const onClick = (e) => {
    const newTarget = collectedElements.indexOf(e.target);
    if (newTarget > 0) {
      const elements = document.querySelectorAll('.woAcc-SpeakWord');
      elements.forEach(function (element) {
        element.classList.remove('woAcc-SpeakWord');
      });
      globalStartedFrom = newTarget;
      speakElement(collectedElements, newTarget, newTarget);
    }
  };
  const onKeyUp = (e) => {
    if (e.key === 'Tab') {
      const target = collectedElements.indexOf(e.target);
      if (target > 0) {
        e.preventDefault();
        const newTarget = target;
        const elements = document.querySelectorAll('.woAcc-SpeakWord');
        elements.forEach(function (element) {
          element.classList.remove('woAcc-SpeakWord');
        });
        globalStartedFrom = newTarget;
        speakElement(collectedElements, newTarget, newTarget);
      }
    }
  };
  const allElements = [];
  collectedElements = manageTagAppendScreenReader(allElements, document.body);
  say(getTranslations('Screen reader enabled'), () => {
    if (collectedElements?.length) {
      speakElement(collectedElements);
    }
  });
  document.addEventListener('click', onClick);
  document.addEventListener('keyup', onKeyUp);
}

const getLabelForInput = (element) => {
  const labelId = element.getAttribute('aria-labelledby');
  if (labelId) {
    const labelElement = document.getElementById(labelId);
    return labelElement?.textContent?.trim();
  } else {
    const label =
      element.previousElementSibling &&
      element.previousElementSibling.tagName.toLowerCase() === 'label'
        ? element.previousElementSibling.textContent?.trim()
        : null;
    return label;
  }
};
const computeAccessibleName = (element) => {
  let label = '';
  if (element.tagName.toLowerCase() === 'input') {
    label = getLabelForInput(element);
  }
  const content =
    label ||
    element.textContent.trim() ||
    element.getAttribute('alt') ||
    element.getAttribute('value') ||
    element.getAttribute('placeholder') ||
    element.getAttribute('title') ||
    element.getAttribute('label') ||
    element.innerText;

  return element.getAttribute('aria-label') || content;
};

const computeRole = (element) => {
  const name = element.tagName?.toLowerCase();
  return (
    element?.getAttribute?.('role') || screenReaderElementMappings[name] || ''
  );
};

function manageTagAppendScreenReader(allElements, elementToRead) {
  if (elementToRead.nodeName === '#text') {
    if (elementToRead?.data) {
      const newElement = document.createElement('span');
      if (getDataById('furigana') === 'furiganaAdvance') {
        newElement.isFuriganaProcessed =
          elementToRead.parentNode.isFuriganaProcessed;
      }
      newElement.textContent = elementToRead.textContent;
      elementToRead.parentNode.replaceChild(newElement, elementToRead);
      newElement.tabIndex = 0;
      allElements.push(newElement);
    }
  } else {
    for (let i = 0; i < elementToRead.childNodes.length; i++) {
      const element = elementToRead.childNodes.item(i);
      if (element.className !== 'woAcc-modal') {
        if (!['#comment', 'SCRIPT', 'STYLE'].includes(element.nodeName)) {
          if (element.nodeName === '#text') {
            if (element?.data?.trim()?.length) {
              const newElement = document.createElement('span');
              if (getDataById('furigana') === 'furiganaAdvance') {
                newElement.isFuriganaProcessed =
                  elementToRead.parentNode.isFuriganaProcessed;
              }
              newElement.textContent = element.textContent;
              element.parentNode.replaceChild(newElement, element);
              newElement.tabIndex = 0;
              allElements.push(newElement);
            }
          } else if (element.getAttribute('aria-label')) {
            allElements.push(element);
            if (element.children.length) {
              manageTagAppendScreenReader(allElements, element);
            }
          } else {
            const styles = window.getComputedStyle(element);
            if (
              !(
                styles.getPropertyValue('display') === 'none' ||
                styles.getPropertyValue('visibility') === 'hidden'
              )
            ) {
              if (element.innerText) {
                if (
                  [
                    'p',
                    'font',
                    'a',
                    'li',
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'h5',
                    'h6',
                    'ol',
                    'ul',
                    'menu',
                    'code',
                    'section',
                  ].includes(element.nodeName.toLowerCase())
                ) {
                  const newElement = document.createElement(element.nodeName);
                  if (element.nodeName === 'A') {
                    newElement.href = element.href;
                  }
                  if (newElement?.innerText || newElement?.textContent) {
                    newElement.tabIndex = 0;
                    allElements.push(newElement);
                  }
                  if (element.nodeName === 'SECTION') {
                    const label = element?.getAttribute('aria-label');
                    if (label?.length) {
                      newElement.setAttribute('aria-label', label);
                    }
                    allElements.push(newElement);
                  }
                }
                if (element.children.length) {
                  manageTagAppendScreenReader(allElements, element);
                } else {
                  if (element?.innerText || element?.textContent) {
                    element.tabIndex = 0;
                    allElements.push(element);
                  }
                }
              } else if (
                element.nodeName.toLowerCase() === 'img' &&
                element.alt.trim().length
              ) {
                const newElement = document.createElement(element.nodeName);
                console.log(newElement);
                newElement.alt = element.alt;
                newElement.tabIndex = 0;
                allElements.push(newElement);
              } else if (element.children.length) {
                manageTagAppendScreenReader(allElements, element);
              }
            }
          }
        }
      }
    }
  }
  return allElements;
}

const speakElement = (elements, elementIndex = 0, startedFrom = 0) => {
  if (startedFrom !== globalStartedFrom || breakFlag) {
    return;
  }
  let element = elements[elementIndex];
  const text =
    element?.ariaLabel ||
    element?.innerText ||
    element?.textContent ||
    element?.alt;
  if (text || ['SECTION'].includes(element?.nodeName)) {
    element.focus?.();
    element.setFocus?.();
    element.classList?.add?.('woAcc-SpeakWord');
    const role = computeRole(element);
    const accessibleName = computeAccessibleName(element);
    let announcement = `${role}, ${accessibleName}  `;
    say(announcement, () => {
      element.classList?.remove?.('woAcc-SpeakWord');
      speakElement(elements, elementIndex + 1, startedFrom);
    });
  }
};

function cancelSpeechSynthesis() {
  window.speechSynthesis?.cancel();
  screenReaderRef?.stop?.();
  screenReaderRef?.remove?.();
}

async function say(speech, onEnd) {
  speech = speech.trim();

  // Bump the version
  const currentVersion = ++sayCallVersion;

  // Cancel previous
  cancelSpeechSynthesis();

  const partialReader = currentReadSpeed || 'moderateSpeed';
  const selectedLanguage =
    getDataById('woAccessibilityLang') === 'jp'
      ? 'ja'
      : getDataById('woAccessibilityLang') || 'en';

  if (['ja', 'en'].includes(selectedLanguage)) {
    const audio = await speak(speech, {
      instructions: screenReaderPrompts[partialReader],
      speed:
        partialReader === 'fastReading' ? 4 : screenReaderSpeed[partialReader],
      onEnd: () => {
        if (currentVersion === sayCallVersion) {
          onEnd?.();
        } else {
          audio?.stop?.();
        }
      },
      voice: 'shimmer',
    });

    if (currentVersion === sayCallVersion) {
      screenReaderRef = audio;
    } else {
      audio?.stop?.();
    }
    return;
  }
  if (!speech) return;
  const chunkSize = 200;
  const chunks = speech.match(new RegExp(`.{1,${chunkSize}}`, 'g'));
  chunks.forEach((chunk, index) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    const voicesList = window.speechSynthesis.getVoices();
    utterance.rate = screenReaderSpeed[partialReader];
    utterance.lang = selectedLanguage;
    utterance.voice = voicesList.find((voice) =>
      voice.lang.includes(selectedLanguage)
    );
    if (onEnd && index === chunks.length - 1) {
      utterance.addEventListener('end', () => {
        if (currentVersion === sayCallVersion) onEnd();
      });
    }
    setTimeout(() => {
      if (currentVersion === sayCallVersion) {
        window.speechSynthesis.speak(utterance);
      }
    });
  });
}

let partialReaderListener;

function handlePartialScreenReaderTabKeyUp(e) {
  handlePartialScreenReaderClick(e);
}

function startPartialScreenReader() {
  say(
    getTranslations('Starting to read the page, click where you want to read')
  );
  partialReaderListener = handlePartialScreenReaderClick;
  document.addEventListener('click', partialReaderListener);
  document.addEventListener('keyup', handlePartialScreenReaderTabKeyUp);
}

function removePartialScreenReader() {
  if (partialReaderListener) {
    document.removeEventListener('click', partialReaderListener);
  }
  document.removeEventListener('keyup', handlePartialScreenReaderTabKeyUp);
}

/**
 * This function handles the speaking logic of partial reader.
 * @param {Object {target : Element}} ev
 */
function handlePartialScreenReaderClick(ev) {
  // Note: The ev variable does not retrun the event prototyped values. from Focus function it only recieves target element as key.
  cancelSpeechSynthesis();

  const elements = document.querySelectorAll('.woAcc-SpeakWord');
  elements.forEach(function (element) {
    element.classList.remove('woAcc-SpeakWord');
  });
  let text = '';
  const element = ev.target;
  if (element.tagName.toLowerCase() === 'img') {
    text = element.getAttribute('aria-label') || element.getAttribute('alt');
  } else {
    const processNode = (node) => {
      if (node.nodeType !== Node.TEXT_NODE) {
        text += computeRole(node) + ' ';
      }
      if (node.nodeType === Node.TEXT_NODE) {
        const trimmedText = node.textContent.trim();
        if (trimmedText) {
          text += trimmedText + ' ';
        }
      } else if (node.getAttribute('aria-label')) {
        text += node.getAttribute('aria-label');
        [...(node?.children || [])].forEach(processNode);
      } else if (node.tagName?.toLowerCase() === 'img') {
        const altText = node.getAttribute('alt');
        if (altText) {
          text += altText + ' ';
        }
      } else if (node.tagName?.toLowerCase() === 'a') {
        text += node.textContent.trim() + ' ';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.childNodes.forEach(processNode);
      }
    };
    element.childNodes.forEach(processNode);
  }
  if (text) {
    const role = computeRole(element);
    text = `${role} ${text}`;
    element.focus?.();
    element.setFocus?.();
    element.classList?.add?.('woAcc-SpeakWord');
    say(text, () => {
      element.classList?.remove?.('woAcc-SpeakWord');
    });
  }
}

let mainContainer;
export function generateModal({ pageTitle, mainContainerId, closeModal }) {
  // Create main container
  mainContainer = document.createElement('div');
  mainContainer.id = '';
  mainContainer.style.visibility = 'visible';
  mainContainer.style.position = 'fixed';
  mainContainer.style.top = '0px';
  mainContainer.style.left = '0px';
  mainContainer.style.width = '100%';
  mainContainer.style.height = '100%';
  mainContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  mainContainer.style.display = 'flex';
  mainContainer.style.flexDirection = 'column';
  mainContainer.style.alignItems = 'center';
  mainContainer.style.zIndex = '1000000001';
  mainContainer.onclick = closeModal;
  if (mainContainerId) {
    mainContainer.setAttribute('id', mainContainerId);
  }

  // Create inner container
  var innerContainer = document.createElement('div');
  innerContainer.style.height = '90%';
  innerContainer.style.display = 'flex';
  innerContainer.style.justifyContent = 'center';
  innerContainer.style.alignItems = 'center';
  innerContainer.style.flexDirection = 'column';
  innerContainer.style.maxWidth = '600px';
  innerContainer.style.width = '100%';
  innerContainer.style.margin = 'auto';
  innerContainer.onclick = (e) => {
    e.stopPropagation();
  };

  // Create header
  var header = document.createElement('div');
  header.style.color = 'white';
  header.style.background =
    widgetConfig.buttonColor.value ||
    'linear-gradient(270deg, #00499E 0%, #1593EF 100%)';
  header.style.width = '100%';
  header.style.position = 'relative';
  header.style.fontSize = '1.4rem';
  header.style.borderTopLeftRadius = '20px';
  header.style.borderTopRightRadius = '20px';

  // Create title
  var title = document.createElement('h4');
  title.style.marginBottom = '0px';
  title.style.padding = '20px';
  title.style.fontFamily = 'Inter';
  title.style.fontSize = '24px';
  title.style.fontStyle = 'normal';
  title.style.lineHeight = 'normal';
  title.style.color = '#ffffff';
  title.setAttribute('data-translate', pageTitle);
  title.textContent = pageTitle;

  // Create close button container
  var closeButtonContainer = document.createElement('div');
  closeButtonContainer.style.height = '100%';
  closeButtonContainer.style.display = 'flex';
  closeButtonContainer.style.alignItems = 'center';
  closeButtonContainer.style.position = 'absolute';
  closeButtonContainer.style.top = '-5px';
  closeButtonContainer.style.right = '20px';

  // Create close button
  var closeButton = document.createElement('button');
  closeButton.tabIndex = '0';
  closeButton.style.color = 'white';
  closeButton.style.position = 'relative';
  closeButton.style.top = '0px';
  closeButton.style.fontSize = '36px';
  closeButton.style.background = 'transparent';
  closeButton.style.border = 'none';
  closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
  <path d="M15.2502 5.25834C15.1731 5.18108 15.0815 5.11979 14.9807 5.07798C14.8799 5.03616 14.7718 5.01463 14.6627 5.01463C14.5535 5.01463 14.4455 5.03616 14.3447 5.07798C14.2439 5.11979 14.1523 5.18108 14.0752 5.25834L10.0002 9.325L5.92519 5.25C5.84803 5.17285 5.75644 5.11165 5.65564 5.0699C5.55484 5.02814 5.4468 5.00665 5.33769 5.00665C5.22858 5.00665 5.12054 5.02814 5.01973 5.0699C4.91893 5.11165 4.82734 5.17285 4.75019 5.25C4.67303 5.32715 4.61183 5.41875 4.57008 5.51955C4.52833 5.62035 4.50684 5.72839 4.50684 5.8375C4.50684 5.94661 4.52833 6.05465 4.57008 6.15546C4.61183 6.25626 4.67303 6.34785 4.75019 6.425L8.82519 10.5L4.75019 14.575C4.67303 14.6522 4.61183 14.7437 4.57008 14.8446C4.52833 14.9454 4.50684 15.0534 4.50684 15.1625C4.50684 15.2716 4.52833 15.3797 4.57008 15.4805C4.61183 15.5813 4.67303 15.6729 4.75019 15.75C4.82734 15.8272 4.91893 15.8884 5.01973 15.9301C5.12054 15.9719 5.22858 15.9934 5.33769 15.9934C5.4468 15.9934 5.55484 15.9719 5.65564 15.9301C5.75644 15.8884 5.84803 15.8272 5.92519 15.75L10.0002 11.675L14.0752 15.75C14.1523 15.8272 14.2439 15.8884 14.3447 15.9301C14.4455 15.9719 14.5536 15.9934 14.6627 15.9934C14.7718 15.9934 14.8798 15.9719 14.9806 15.9301C15.0814 15.8884 15.173 15.8272 15.2502 15.75C15.3273 15.6729 15.3885 15.5813 15.4303 15.4805C15.472 15.3797 15.4935 15.2716 15.4935 15.1625C15.4935 15.0534 15.472 14.9454 15.4303 14.8446C15.3885 14.7437 15.3273 14.6522 15.2502 14.575L11.1752 10.5L15.2502 6.425C15.5669 6.10834 15.5669 5.575 15.2502 5.25834Z" fill="white"/>
</svg>`;
  closeButton.onclick = closeModal;

  // Append elements
  closeButtonContainer.appendChild(closeButton);
  header.appendChild(title);
  header.appendChild(closeButtonContainer);
  innerContainer.appendChild(header);

  // Create content container
  var contentContainer = document.createElement('div');
  contentContainer.classList.add('woAcc-modal-scroll');
  contentContainer.style.width = '100%';
  contentContainer.style.height = '90%';
  contentContainer.style.backgroundColor = '#F2F2F2';
  contentContainer.style.maxWidth = '600px';
  contentContainer.style.overflowY = 'auto';
  contentContainer.style.display = 'flex';
  contentContainer.style.flexDirection = 'column';
  contentContainer.style.borderBottomLeftRadius = '20px';
  contentContainer.style.borderBottomRightRadius = '20px';
  contentContainer.style.padding = '20px';

  var innerContentContainer = document.createElement('div');
  innerContentContainer.classList.add('woAcc-modal-scroll');
  innerContentContainer.style.width = '100%';
  innerContentContainer.style.backgroundColor = 'white';
  innerContentContainer.style.display = 'flex';
  innerContentContainer.style.flexDirection = 'column';
  innerContentContainer.style.borderRadius = '20px';
  innerContentContainer.style.padding = '20px';

  // Append content container
  innerContainer.appendChild(contentContainer);
  contentContainer.appendChild(innerContentContainer);

  // Append inner container to main container
  mainContainer.appendChild(innerContainer);

  // Append main container to body

  const rootEleWO = document.getElementById('woAccessibilityRootEle');
  rootEleWO.appendChild(mainContainer);
  return { innerContentContainer, contentContainer };
}

export function closeMainModal() {
  if (mainContainer) {
    mainContainer?.remove?.();
    mainContainer = null;
  }
}
