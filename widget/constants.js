import { getBrowserName, getDeviceType, sendClickEvent } from './service.js';

export const isWoTestExists = true;
window.isWoTestExists = isWoTestExists;
const environment = 'development';
const siteOrigin = window.location.origin;
const widgetBaseUrl = `${siteOrigin}/widget`;

const envVariables = {
  development: {
    environment: 'development',
    baseAPIUrl: 'https://late-clowns-pick.loca.lt/api',
    iFrameCDN: 'http://localhost:5173',
    localePath: `${widgetBaseUrl}/locales`,
    cdnUrl: widgetBaseUrl,
    staticPath: 'https://staging-widget.braoza.com/v1/assets/static-assets/',
    dashboardUrl: 'https://late-clowns-pick.loca.lt',
    guidyQueueUrl: 'https://cute-cameras-open.loca.lt',
  },
  staging: {
    environment: 'staging',
    baseAPIUrl: 'https://www.staging.braoza.com/api',
    iFrameCDN: 'https://staging-widget.braoza.com/v1',
    localePath: 'https://staging-widget.braoza.com/v1/assets/locales/app',
    cdnUrl: 'https://staging-widget.braoza.com/v1/assets/static-pages',
    staticPath: 'https://staging-widget.braoza.com/v1/assets/static-assets/',
    dashboardUrl: 'https://www.staging.braoza.com',
    guidyQueueUrl: 'https://staging-queue.braoza.com',
  },
  production: {
    environment: 'production',
    baseAPIUrl: 'https://prod.braoza.com/api',
    iFrameCDN: 'https://widget.braoza.com/v1',
    localePath: 'https://widget.braoza.com/v1/assets/locales/app',
    cdnUrl: 'https://widget.braoza.com/v1/assets/static-pages',
    staticPath: 'https://widget.braoza.com/v1/assets/static-assets/',
    dashboardUrl: 'https://prod.braoza.com',
    guidyQueueUrl: 'https://prod-queue.braoza.com',
  },
};

export const currentConfig =
  envVariables[isWoTestExists ? 'development' : environment];

const { baseAPIUrl, cdnUrl, localePath, guidyQueueUrl } = currentConfig;

export const rootElement = document.createElement('div');
rootElement.setAttribute('id', 'woAcc-RootEle');
rootElement.setAttribute('class', 'woAcc-RootEle');
rootElement.setAttribute('style', 'woAcc-RootEle');
rootElement.setAttribute('guidy-ignore-translate', true);

document.body.append(rootElement);
// document.body.insertBefore(rootElement, document.body.firstChild);
export const localStorageKey = 'WoAccConfig';
export const widgetButton = document.createElement('button');
export const accIconInButton = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'svg'
);

// Add keyframes for spin animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes woAccLoader {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

let loader = document.createElement('div');
Object.assign(loader.style, {
  position: 'absolute',
  border: '4px solid #f3f3f3' /* Light grey */,
  borderTop: '4px solid #3498db' /* Blue */,
  borderRadius: '50%',
  width: '30px',
  height: '30px',
  animation: 'woAccLoader 2s linear infinite',
});

widgetButton.appendChild(loader);
loader.style.display = 'none';

export const showLoaderOnButton = () => {
  loader.style.display = 'block';
  accIconInButton.style.display = 'none';
  widgetButton.setAttribute('disabled', 'true');
};

export const hideLoaderOnButton = () => {
  loader.style.display = 'none';
  accIconInButton.style.display = 'block';
  widgetButton.removeAttribute('disabled');
};

const headerToken = 'VEVTVDpURVNU';

export function isNotVisible(element) {
  while (element) {
    const styles = getComputedStyle(element);
    if (
      styles.display === 'none' ||
      styles.visibility !== 'visible' ||
      styles.opacity <= 0
    ) {
      return true;
    }
    element = element.parentElement;
  }
  return false;
}

export function isMobileDevice() {
  const userAgent = navigator.userAgent;

  // Check for common mobile device identifiers
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  return mobileRegex.test(userAgent);
}

export function canonicalizeUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    u.protocol = u.protocol.toLowerCase();
    u.hostname = u.hostname.toLowerCase();
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(
      (p) => u.searchParams.delete(p)
    );
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    u.pathname = pathname;
    return u.toString();
  } catch {
    return rawUrl;
  }
}

export const getImageAlts = async () => {
  try {
    const pageUrl = encodeURIComponent(canonicalizeUrl(window.location.href));
    const response = await fetch(
      `${baseAPIUrl}/imageAlt/${getAccountKey(cdnUrl)}/existing-images?url=${pageUrl}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch image alts');
      return [];
    }
    const res = await response.json();
    return res.data;
  } catch (e) {
    return [];
  }
};

export const translateText = async (data) => {
  return fetch('http://localhost:3001/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${headerToken}`,
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => res.data)
    .catch((err) => {
      console.log(err, ':::::: err');
    });
};

export const callGuidyDashboard = async (data) => {
  try {
    // console.log(`${baseAPIUrl}/widget/${getAccountKey(cdnUrl)}/guidyNode`);
    const response = await fetch(
      `${baseAPIUrl}/widget/${getAccountKey(cdnUrl)}/guidyNode`,
      {
        method: 'POST',
        headers: {
          Site: window.location.href,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch');
      return new Error('Failed to fetch');
    }

    const resData = await response.json();
    if (data.path === 'convert-to-hiragana') {
      return resData?.data.converted || '';
    } else if (data.path === 'translate') {
      return resData?.data?.data || {};
    } else if (data.path === 'summarize') {
      return resData?.data?.data || '';
    } else if (data.path === 'convert-to-furigana') {
      return resData?.data?.data || {};
    } else {
      return resData?.data?.data.text || '';
    }
  } catch (error) {
    return new Error(error.message);
  }
};

export const getHiragana = async (text, signal) => {
  try {
    const response = await fetch(`${baseAPIUrl}/convert-to-hiragana`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${headerToken}`,
      },
      body: JSON.stringify({ words: text }),
      signal,
    });

    if (!response.ok) {
      console.error('Failed to fetch translation');
      return '';
    }

    const data = await response.json();
    return data?.converted || '';
  } catch (error) {
    console.error('Error fetching translation:', error);
    return '';
  }
};

export const getSyllables = async (data) => {
  try {
    const response = await fetch(`${baseAPIUrl}/hyphenate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${headerToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to fetch translation');
      return '';
    }

    const responseData = await response.json();
    return responseData?.data?.text || '';
  } catch (error) {
    console.error('Error fetching translation:', error);
    return '';
  }
};

export function getLocalStorage() {
  return JSON.parse(window.localStorage.getItem(localStorageKey) || '{}');
}

export function getDataById(id) {
  const data = getLocalStorage();
  const currentState = data[id] || 'default';
  return currentState;
}

export function getLocalStorageData(key) {
  if (window.localStorage.getItem(key)) {
    try {
      return JSON.parse(window.localStorage.getItem(key));
    } catch (error) {
      return window.localStorage.getItem(key);
    }
  }
}

export function setLocalStorageData(key, data) {
  window.localStorage.setItem(
    key,
    typeof data !== 'string' ? JSON.stringify(data) : data
  );
}

const loadedTranslations = {};

const updateContent = (lang, translations, root = undefined) => {
  loadedTranslations[lang] = translations;
  let elements;
  if (root) {
    elements = root.querySelectorAll('[data-translate]');
  } else {
    elements = document.querySelectorAll('[data-translate]');
  }
  elements.forEach((element) => {
    const key = element.getAttribute('data-translate');
    if (translations[key]) {
      if (element.tagName === 'INPUT' || element.placeholder !== undefined) {
        element.placeholder = translations[key];
      } else {
        element.textContent = translations[key];
      }
    }
  });
};

export const translateContent = (root = undefined) => {
  const currentLanguage = getDataById('woAccessibilityLang');
  if (loadedTranslations[currentLanguage]) {
    updateContent(currentLanguage, loadedTranslations[currentLanguage], root);
  } else {
    loadLanguage(currentLanguage, root);
  }
};

const loadLanguage = (lang, root = undefined) => {
  fetch(`${localePath}/${lang}.json`)
    .then((response) => response.json())
    .then((translations) => updateContent(lang, translations, root))
    .catch((err) => {
      console.log(err, '::: err');
    });
};

export function getTranslations(text, root = undefined) {
  const currentLanguage = getDataById('woAccessibilityLang');
  if (!loadedTranslations[currentLanguage]) {
    loadLanguage(currentLanguage, root);
  }
  return loadedTranslations[currentLanguage]?.[text] || text;
}

export function getAccountKey(cdnUrl) {
  const n = getGuidyScript(cdnUrl);
  if (n) return n.dataset.account;
}

export function getGuidyScript(cdnUrl) {
  const e = cdnUrl.replace(/\./g, '\\.');
  const t = new RegExp('^'.concat(e, '/.*'));
  const n = Array.from(document.querySelectorAll('script[data-account]')).find(
    (e) => t.test(e.src)
  );
  if (n) return n;
}

export const defaultKeyboardShortcuts = [
  {
    key: 'stopAnimation',
    label: 'Stop Animation',
    shortcut: 'CTRL + ALT + SHIFT + Z',
  },
  {
    key: 'imageDescription',
    label: 'Image Description',
    shortcut: 'CTRL + ALT + SHIFT + I',
  },
  {
    key: 'hideImages',
    label: 'Hide Images',
    shortcut: 'CTRL + ALT + SHIFT + U',
  },
  {
    key: 'voiceNavigation',
    label: 'Voice Navigation',
    shortcut: 'CTRL + ALT + SHIFT + V',
  },
  {
    key: 'muteSounds',
    label: 'Mute Sounds',
    shortcut: 'CTRL + ALT + SHIFT + O',
  },
  {
    key: 'virtualKeyboard',
    label: 'Virtual Keyboard',
    shortcut: 'CTRL + ALT + SHIFT + B',
  },
  {
    key: 'keyboardNavigation',
    label: 'Keyboard Navigation',
    shortcut: 'CTRL + ALT + SHIFT + N',
  },
  {
    key: 'highlightTitles',
    label: 'Highlight Titles',
    shortcut: 'CTRL + ALT + SHIFT + K',
  },
  {
    key: 'linkHighlight',
    label: 'Link Highlight',
    shortcut: 'CTRL + ALT + SHIFT + L',
  },
  {
    key: 'highlightHover',
    label: 'Highlight Hover',
    shortcut: 'CTRL + ALT + SHIFT + H',
  },
  {
    key: 'highlightForm',
    label: 'Highlight Form',
    shortcut: 'CTRL + ALT + SHIFT + J',
  },
  {
    key: 'readingGuide',
    label: 'Reading Guide',
    shortcut: 'CTRL + ALT + SHIFT + G',
  },
  {
    key: 'cursorIcon',
    label: 'Cursor Icon',
    shortcut: 'CTRL + ALT + SHIFT + X',
  },
  {
    key: 'pageStructure',
    label: 'Page Structure',
    shortcut: 'CTRL + ALT + SHIFT + P',
  },
  { key: 'toolTip', label: 'Tooltip', shortcut: 'CTRL + ALT + SHIFT + Y' },
  {
    key: 'textMagnifier',
    label: 'Text Magnifier',
    shortcut: 'CTRL + ALT + SHIFT + M',
  },
  {
    key: 'textAlignment',
    label: 'Text Alignment',
    shortcut: 'CTRL + ALT + SHIFT + A',
  },
  {
    key: 'syllabicDivision',
    label: 'Syllabic Division',
    shortcut: 'CTRL + ALT + SHIFT + F',
  },
  {
    key: 'removeItalics',
    label: 'Remove Italics',
    shortcut: 'CTRL + ALT + SHIFT + Q',
  },
  {
    key: 'removeUnderlines',
    label: 'Remove Underlines',
    shortcut: 'CTRL + ALT + SHIFT + W',
  },
  {
    key: 'removeShadows',
    label: 'Remove Shadows',
    shortcut: 'CTRL + ALT + SHIFT + E',
  },
  { key: 'contrast', label: 'Contrast', shortcut: 'CTRL + ALT + SHIFT + C' },
  {
    key: 'saturationSettings',
    label: 'Saturation',
    shortcut: 'CTRL + ALT + SHIFT + S',
  },
  {
    key: 'smartContrast',
    label: 'Smart Contrast',
    shortcut: 'CTRL + ALT + Q',
  },
  {
    key: 'colorAdjustments',
    label: 'Color Adjustments',
    shortcut: 'CTRL + ALT + C',
  },
  {
    key: 'enlargeText',
    label: 'Enlarge Text',
    shortcut: 'CTRL + ALT + E',
  },
  {
    key: 'textSpacing',
    label: 'Text Spacing',
    shortcut: 'CTRL + ALT + Y',
  },
  {
    key: 'font',
    label: 'Font',
    shortcut: 'CTRL + ALT + F',
  },
  {
    key: 'displayInText',
    label: 'Display In Text',
    shortcut: 'CTRL + ALT + R',
  },
  {
    key: 'bigBlackCursor',
    label: 'Big Black Cursor',
    shortcut: 'CTRL + ALT + B',
  },
  {
    key: 'bigWhiteCursor',
    label: 'Big White Cursor',
    shortcut: 'CTRL + ALT + W',
  },
];

export const CODE_TO_KEY = {
  // Letters
  KeyA: 'A',
  KeyB: 'B',
  KeyC: 'C',
  KeyD: 'D',
  KeyE: 'E',
  KeyF: 'F',
  KeyG: 'G',
  KeyH: 'H',
  KeyI: 'I',
  KeyJ: 'J',
  KeyK: 'K',
  KeyL: 'L',
  KeyM: 'M',
  KeyN: 'N',
  KeyO: 'O',
  KeyP: 'P',
  KeyQ: 'Q',
  KeyR: 'R',
  KeyS: 'S',
  KeyT: 'T',
  KeyU: 'U',
  KeyV: 'V',
  KeyW: 'W',
  KeyX: 'X',
  KeyY: 'Y',
  KeyZ: 'Z',

  // Numbers (top row)
  Digit0: '0',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',

  // Whitespace & controls
  Space: 'Space',
  Enter: 'Enter',
  Escape: 'Esc',
  Backspace: 'Backspace',
  Tab: 'Tab',

  // Arrows
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',

  // Modifiers
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl',
  AltLeft: 'Alt',
  AltRight: 'Alt',
  MetaLeft: 'Meta',
  MetaRight: 'Meta',

  // Function keys
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',

  // Punctuation (US QWERTY)
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`',
};

export const miniWidgetOptions = [
  'colorAdjustments',
  'contrast',
  'linkHighlight',
  'enlargeText',
  'stopAnimation',
  'font',
  'bigWhiteCursor',
];
export const nanoWidgetOptions = ['contrast', 'enlargeText', 'bigWhiteCursor'];

export const rules = {
  accesskeys: {
    id: 'accesskeys',
    impact: 'serious',
    selector: '[accesskey]',
    excludeHidden: false,
    tags: ['cat.keyboard', 'best-practice'],
    all: [],
    any: [],
    none: ['accesskeys'],
  },
  'unique-alt-text': {
    id: 'unique-alt-text', // R_3 Custom
    enabled: true,
    selector: 'img',
    none: ['unique-alt'],
    metadata: {
      description:
        'Checks that each unique image has a unique alternative text (<pre>alt</pre>) value. Different images — meaning images with different <pre>src</pre> attributes — should not have identical <pre>alt</pre> values.',
      help: "Write each image's <pre>alt</pre> attribute to uniquely describe that image's meaning or purpose.",
      helpUrl: 'https://www.w3.org/TR/WCAG20-TECHS/H37.html',
    },
  },
  'no-extraneous-alt-text': {
    id: 'no-extraneous-alt-text', // R_7 Custom
    enabled: true,
    selector: 'img',
    any: ['no-extraneous-alt-text'],
    metadata: {
      description:
        "Checks that each <pre>alt</pre> attribute contains no extraneous text. When writing <pre>alt</pre> text, describe only the content's meaning or function. There is no need to identify that content as a photo of..., icon of..., graphic of..., illustration of..., and inclusion of any file names, such as IMG_2905.JPG, should be avoided.",
      help: "Delete from the <pre>alt</pre> attribute extraneous text such as 'image of,' 'photo of,' 'graphic of', 'illustration of', 'icon of', etc. For example, replace: <pre>alt='A photo of an astronaut performing a space walk'</pre> with <pre>alt='An astronaut performing a space walk'</pre>.",
      helpUrl: 'https://www.w3.org/TR/WCAG20-TECHS/H37.html',
    },
  },
  'new-tab-warning': {
    id: 'new-tab-warning', // R_44 Custom
    tags: ['cat.time-and-navigation', 'wcag2aaa', 'wcag325'],
    impact: 'moderate',
    selector: 'a[target="_blank"]',
    any: ['new-tab-warning'],
    enabled: true,
    metadata: {
      description:
        'Checks for new tabs or windows opening without warning user. New tabs or windows can be very disorienting for users, particularly those who rely on screen readers or other assistive technologies. Any link that opens a new tab or window should communicate this fact beforehand.',
      help: "Add <pre>(opens in a new tab)</pre> within the link text. For example: Visit the <pre><a href='https://nasa.gov' target='_blank'>Visit NASA's website (opens in a new tab)</a></pre> for more information. For images or texts that cannot be modified, add an <pre>aria-label</pre> with the same info. For example: <pre><a href='https://nasa.gov' aria-label='Visit NASA's website (opens in a new tab)' target='_blank'><img src='nasa.jpg' alt='NASA logo' /></a></pre>.",
      helpUrl:
        'https://www.w3.org/WAI/WCAG21/Understanding/change-on-request.html',
    },
  },
  'has-multiple-h1': {
    id: 'has-multiple-h1', //R_31 Custom
    tags: ['cat.structure', 'wcag2aa', 'wcag246'],
    impact: 'moderate',
    selector: 'html',
    any: ['has-multiple-h1'],
    enabled: true,
    metadata: {
      description:
        'Checks that the page has a single <pre><h1></pre> element. Structuring pages with a logical and predictable heading hierarchy allows users to easily find information and more efficiently navigate the page. Users relying on screen readers and other assistive technologies should be able to understand the page structure by quickly skimming the page. Each page should have a single <pre><h1></pre> element under which all subsequent headings (<pre><h2></pre>, <pre><h3></pre>, etc.) should semantically fit.',
      help: 'Change, add, or remove headings to maintain a logical hierarchy of headings that begins with a single <pre><h1></pre> element.',
      helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings',
    },
  },
  'headings-and-labels-2': {
    id: 'headings-and-labels-2', // R_34 Custom
    tags: ['cat.forms', 'wcag2aa', 'wcag246', 'wcag412'],
    impact: 'serious',
    selector: 'form',
    any: ['form-field-labels'],
    enabled: true,
    metadata: {
      description:
        'Checks that each form field has an associated <pre><label></pre> element or descriptive text. Without labeling or description, users who rely on screen readers or other assistive technologies cannot determine the input requested.',
      help: "Add a <pre><label></pre> element that describes the form field. To associate the <pre><label></pre> with the form field it describes, add a <pre>for</pre> attribute to the <pre><label></pre> that references the <pre>id</pre> of the form field. For example: <pre><label for='fname'>First name:</label><input type='text' id='fname'></pre>. If adding an associated <pre><label></pre> is impossible, add a descriptive <pre>aria-label</pre> attribute to the form field. For example: <pre><input type='text' aria-label='First name'></pre>. If a nearby element can serve to describe a form field, add an <pre>aria-labelledby</pre> attribute to the form field that references the <pre>id</pre> attribute of the descriptive element.",
      helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings',
    },
  },
  'headings-and-labels-3': {
    id: 'headings-and-labels-3', // R_35 Custom
    tags: ['cat.forms', 'wcag2aa', 'wcag246'],
    impact: 'serious',
    selector: 'input[type="submit"], input[type="reset"]',
    any: ['submit-reset-value'],
    enabled: true,
    metadata: {
      description:
        "Checks that each Submit or Reset <pre><input></pre> element for a populated <pre>value</pre> attribute. Every interactive control needs descriptive text that assistive technology can access to inform users of that control's function. When an <input> element has either a <pre>type=submit</pre> or <pre>type=reset</pre> attribute, descriptive text should be added using a <pre>value</pre> attribute.",
      help: "Add a <pre>value</pre> attribute to the <pre><input></pre> element identified. For example: <pre><input type='submit' value='Submit registration form'></pre>.",
      helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings',
    },
  },
  'headings-and-labels-4': {
    id: 'headings-and-labels-4', // R_36 Custom
    tags: ['cat.forms', 'wcag2aa', 'wcag246'],
    impact: 'serious',
    selector: 'button',
    any: ['button-labels'],
    enabled: true,
    metadata: {
      description:
        "Checks that all <pre><button></pre> elements have an associated label or descriptive text to make the button's function clear to users who rely on screen readers or other assistive technologies.",
      help: "Add text within the <pre><button></pre> element to describe its function. For example:<pre><button>Submit</button></pre>. If that's not possible, add an <pre>aria-label</pre> attribute to the <pre><button></pre> element. For example: <pre><button aria-label='Submit registration form'>...</button></pre>.",
      helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings',
    },
  },
  'is-valid-by': {
    id: 'is-valid-by', // R_15 Custom
    selector: '*[aria-labelledby], *[aria-describedby]',
    enabled: true,
    any: ['is-valid-by'],
    impact: 'critical',
    metadata: {
      description: 'Invalid aria-labelledby or aria-describedby attribute',
      help: 'If a nearby text element (<div> or <span> usually) serves as a label or descriptive text, assign it the id referenced by the aria-labelledby or aria-describedby attribute. If no such descriptive text element exists, create it and assign it that id.',
      helpUrl:
        'https://www.w3.org/WAI/GL/wiki/Using_aria-labelledby_to_provide_a_text_alternative_for_non-text_content',
    },
    tags: ['cat.aria', 'wcag2a', 'wcag131'],
  },
  'area-alt': {
    id: 'area-alt',
    impact: 'critical',
    selector: 'map area[href]',
    excludeHidden: false,
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag244',
      'wcag412',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT6.a',
      'EN-301-549',
      'EN-9.2.4.4',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['c487ae'],
    all: [],
    any: [
      {
        options: {
          attribute: 'alt',
        },
        id: 'non-empty-alt',
      },
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'aria-allowed-attr': {
    id: 'aria-allowed-attr',
    impact: 'critical',
    matches: 'aria-allowed-attr-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    actIds: ['5c01ea'],
    all: [
      {
        options: {
          validTreeRowAttrs: [
            'aria-posinset',
            'aria-setsize',
            'aria-expanded',
            'aria-level',
          ],
        },
        id: 'aria-allowed-attr',
      },
    ],
    any: [],
    none: ['aria-unsupported-attr'],
  },
  'aria-allowed-role': {
    id: 'aria-allowed-role',
    impact: 'minor',
    excludeHidden: false,
    selector: '[role]',
    matches: 'aria-allowed-role-matches',
    tags: ['cat.aria', 'best-practice'],
    all: [],
    any: [
      {
        options: {
          allowImplicit: true,
          ignoredTags: [],
        },
        id: 'aria-allowed-role',
      },
    ],
    none: [],
  },
  'aria-braille-equivalent': {
    id: 'aria-braille-equivalent',
    reviewOnFail: true,
    impact: 'serious',
    selector: '[aria-brailleroledescription], [aria-braillelabel]',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    all: ['braille-roledescription-equivalent', 'braille-label-equivalent'],
    any: [],
    none: [],
  },
  'aria-command-name': {
    id: 'aria-command-name',
    impact: 'serious',
    selector: '[role="link"], [role="button"], [role="menuitem"]',
    matches: 'no-naming-method-matches',
    tags: [
      'cat.aria',
      'wcag2a',
      'wcag412',
      'TTv5',
      'TT6.a',
      'EN-301-549',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['97a4e1'],
    all: [],
    any: [
      'has-visible-text',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'aria-conditional-attr': {
    id: 'aria-conditional-attr',
    impact: 'serious',
    matches: 'aria-allowed-attr-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    actIds: ['5c01ea'],
    all: [
      {
        options: {
          invalidTableRowAttrs: [
            'aria-posinset',
            'aria-setsize',
            'aria-expanded',
            'aria-level',
          ],
        },
        id: 'aria-conditional-attr',
      },
    ],
    any: [],
    none: [],
  },
  'aria-deprecated-role': {
    id: 'aria-deprecated-role',
    impact: 'minor',
    selector: '[role]',
    matches: 'no-empty-role-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    actIds: ['674b10'],
    all: [],
    any: [],
    none: ['deprecatedrole'],
  },
  'aria-dialog-name': {
    id: 'aria-dialog-name',
    impact: 'serious',
    selector: '[role="dialog"], [role="alertdialog"]',
    matches: 'no-naming-method-matches',
    tags: ['cat.aria', 'best-practice'],
    all: [],
    any: [
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'aria-hidden-body': {
    id: 'aria-hidden-body',
    impact: 'critical',
    selector: 'body',
    excludeHidden: false,
    matches: 'is-initiator-matches',
    tags: [
      'cat.aria',
      'wcag2a',
      'wcag131',
      'wcag412',
      'EN-301-549',
      'EN-9.1.3.1',
      'EN-9.4.1.2',
    ],
    all: [],
    any: ['aria-hidden-body'],
    none: [],
  },
  'aria-hidden-focus': {
    id: 'aria-hidden-focus', //R_59
    impact: 'serious',
    selector: '[aria-hidden="true"]',
    matches: 'aria-hidden-focus-matches',
    excludeHidden: false,
    tags: [
      'cat.name-role-value',
      'wcag2a',
      'wcag412',
      'TTv5',
      'TT6.a',
      'EN-301-549',
      'EN-9.4.1.2',
    ],
    actIds: ['6cfa84'],
    all: [
      'focusable-modal-open',
      'focusable-disabled',
      'focusable-not-tabbable',
    ],
    any: ['testFocusable'],
    none: [],
  },
  'aria-input-field-name': {
    id: 'aria-input-field-name',
    impact: 'serious',
    selector:
      '[role="combobox"], [role="listbox"], [role="searchbox"], [role="slider"], [role="spinbutton"], [role="textbox"]',
    matches: 'no-naming-method-matches',
    tags: [
      'cat.aria',
      'wcag2a',
      'wcag412',
      'TTv5',
      'TT5.c',
      'EN-301-549',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['e086e5'],
    all: [],
    any: [
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: ['no-implicit-explicit-label'],
  },
  'aria-meter-name': {
    id: 'aria-meter-name',
    impact: 'serious',
    selector: '[role="meter"]',
    matches: 'no-naming-method-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag111', 'EN-301-549', 'EN-9.1.1.1'],
    all: [],
    any: [
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'aria-progressbar-name': {
    id: 'aria-progressbar-name',
    impact: 'serious',
    selector: '[role="progressbar"]',
    matches: 'no-naming-method-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag111', 'EN-301-549', 'EN-9.1.1.1'],
    all: [],
    any: [
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'aria-prohibited-attr': {
    id: 'aria-prohibited-attr',
    impact: 'serious',
    matches: 'aria-allowed-attr-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    actIds: ['5c01ea'],
    all: [],
    any: [],
    none: [
      {
        options: {
          elementsAllowedAriaLabel: ['applet', 'input'],
        },
        id: 'aria-prohibited-attr',
      },
    ],
  },
  'aria-required-attr': {
    id: 'aria-required-attr',
    impact: 'critical',
    selector: '[role]',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    actIds: ['4e8ab6'],
    all: [],
    any: ['aria-required-attr'],
    none: [],
  },
  'aria-required-children': {
    id: 'aria-required-children',
    impact: 'critical',
    selector: '[role]',
    matches: 'aria-required-children-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag131', 'EN-301-549', 'EN-9.1.3.1'],
    actIds: ['bc4a75', 'ff89c9'],
    all: [],
    any: [
      {
        options: {
          reviewEmpty: [
            'doc-bibliography',
            'doc-endnotes',
            'grid',
            'list',
            'listbox',
            'menu',
            'menubar',
            'table',
            'tablist',
            'tree',
            'treegrid',
            'rowgroup',
          ],
        },
        id: 'aria-required-children',
      },
    ],
    none: [],
  },
  'aria-required-parent': {
    id: 'aria-required-parent',
    impact: 'critical',
    selector: '[role]',
    matches: 'aria-required-parent-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag131', 'EN-301-549', 'EN-9.1.3.1'],
    actIds: ['ff89c9'],
    all: [],
    any: [
      {
        options: {
          ownGroupRoles: ['listitem', 'treeitem'],
        },
        id: 'aria-required-parent',
      },
    ],
    none: [],
  },
  'aria-roledescription': {
    id: 'aria-roledescription',
    impact: 'serious',
    selector: '[aria-roledescription]',
    tags: [
      'cat.aria',
      'wcag2a',
      'wcag412',
      'EN-301-549',
      'EN-9.4.1.2',
      'deprecated',
    ],
    enabled: false,
    all: [],
    any: [
      {
        options: {
          supportedRoles: [
            'button',
            'img',
            'checkbox',
            'radio',
            'combobox',
            'menuitemcheckbox',
            'menuitemradio',
          ],
        },
        id: 'aria-roledescription',
      },
    ],
    none: [],
  },
  'aria-roles': {
    id: 'aria-roles',
    impact: 'critical',
    selector: '[role]',
    matches: 'no-empty-role-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    actIds: ['674b10'],
    all: [],
    any: [],
    none: ['invalidrole', 'abstractrole', 'unsupportedrole'],
  },
  'aria-text': {
    id: 'aria-text',
    impact: 'serious',
    selector: '[role=text]',
    tags: ['cat.aria', 'best-practice'],
    all: [],
    any: ['no-focusable-content'],
    none: [],
  },
  'aria-toggle-field-name': {
    id: 'aria-toggle-field-name',
    impact: 'serious',
    selector:
      '[role="checkbox"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="radio"], [role="switch"], [role="option"]',
    matches: 'no-naming-method-matches',
    tags: [
      'cat.aria',
      'wcag2a',
      'wcag412',
      'TTv5',
      'TT5.c',
      'EN-301-549',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['e086e5'],
    all: [],
    any: [
      'has-visible-text',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: ['no-implicit-explicit-label'],
  },
  'aria-tooltip-name': {
    id: 'aria-tooltip-name',
    impact: 'serious',
    selector: '[role="tooltip"]',
    matches: 'no-naming-method-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    all: [],
    any: [
      'has-visible-text',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'aria-treeitem-name': {
    id: 'aria-treeitem-name',
    impact: 'serious',
    selector: '[role="treeitem"]',
    matches: 'no-naming-method-matches',
    tags: ['cat.aria', 'best-practice'],
    all: [],
    any: [
      'has-visible-text',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'aria-valid-attr-value': {
    id: 'aria-valid-attr-value',
    impact: 'critical',
    matches: 'aria-has-attr-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    actIds: ['6a7281'],
    all: [
      {
        options: [],
        id: 'aria-valid-attr-value',
      },
      'aria-errormessage',
      'aria-level',
    ],
    any: [],
    none: [],
  },
  'aria-valid-attr': {
    id: 'aria-valid-attr',
    impact: 'critical',
    matches: 'aria-has-attr-matches',
    tags: ['cat.aria', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    actIds: ['5f99a7'],
    all: [],
    any: [
      {
        options: [],
        id: 'aria-valid-attr',
      },
    ],
    none: [],
  },
  'audio-caption': {
    id: 'audio-caption',
    impact: 'critical',
    selector: 'audio',
    enabled: false,
    excludeHidden: false,
    tags: [
      'cat.time-and-media',
      'wcag2a',
      'wcag121',
      'EN-301-549',
      'EN-9.1.2.1',
      'section508',
      'section508.22.a',
      'deprecated',
    ],
    actIds: ['2eb176', 'afb423'],
    all: [],
    any: [],
    none: ['caption'],
  },
  'autocomplete-valid': {
    id: 'autocomplete-valid',
    impact: 'serious',
    matches: 'autocomplete-matches',
    tags: [
      'cat.forms',
      'wcag21aa',
      'wcag135',
      'EN-301-549',
      'EN-9.1.3.5',
      'ACT',
    ],
    actIds: ['73f2c2'],
    all: [
      {
        options: {
          stateTerms: [
            'none',
            'false',
            'true',
            'disabled',
            'enabled',
            'undefined',
            'null',
          ],
        },
        id: 'autocomplete-valid',
      },
    ],
    any: [],
    none: [],
  },
  'avoid-inline-spacing': {
    id: 'avoid-inline-spacing',
    impact: 'serious',
    selector: '[style]',
    matches: 'is-visible-on-screen-matches',
    tags: [
      'cat.structure',
      'wcag21aa',
      'wcag1412',
      'EN-301-549',
      'EN-9.1.4.12',
      'ACT',
    ],
    actIds: ['24afc2', '9e45ec', '78fd32'],
    all: [
      {
        options: {
          cssProperty: 'letter-spacing',
          minValue: 0.12,
        },
        id: 'important-letter-spacing',
      },
      {
        options: {
          cssProperty: 'word-spacing',
          minValue: 0.16,
        },
        id: 'important-word-spacing',
      },
      {
        options: {
          multiLineOnly: true,
          cssProperty: 'line-height',
          minValue: 1.5,
          normalValue: 1,
        },
        id: 'important-line-height',
      },
    ],
    any: [],
    none: [],
  },
  blink: {
    id: 'blink',
    impact: 'serious',
    selector: 'blink',
    excludeHidden: false,
    tags: [
      'cat.time-and-media',
      'wcag2a',
      'wcag222',
      'section508',
      'section508.22.j',
      'TTv5',
      'TT2.b',
      'EN-301-549',
      'EN-9.2.2.2',
    ],
    all: [],
    any: [],
    none: ['is-on-screen'],
  },
  'button-name': {
    id: 'button-name',
    impact: 'critical',
    selector: 'button',
    matches: 'no-explicit-name-required-matches',
    tags: [
      'cat.name-role-value',
      'wcag2a',
      'wcag412',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT6.a',
      'EN-301-549',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['97a4e1', 'm6b1q3'],
    all: [],
    any: [
      'button-has-visible-text',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
      'presentational-role',
    ],
    none: [],
  },
  bypass: {
    id: 'bypass',
    impact: 'serious',
    selector: 'html',
    pageLevel: true,
    matches: 'bypass-matches',
    reviewOnFail: true,
    tags: [
      'cat.keyboard',
      'wcag2a',
      'wcag241',
      'section508',
      'section508.22.o',
      'TTv5',
      'TT9.a',
      'EN-301-549',
      'EN-9.2.4.1',
    ],
    actIds: ['cf77f2', '047fe0', 'b40fd1', '3e12e1', 'ye5d6e'],
    all: [],
    any: [
      'internal-link-present',
      {
        options: {
          selector: ':is(h1, h2, h3, h4, h5, h6):not([role]), [role=heading]',
        },
        id: 'header-present',
      },
      {
        options: {
          selector: 'main, [role=main]',
        },
        id: 'landmark',
      },
    ],
    none: [],
  },
  'color-contrast-enhanced': {
    id: 'color-contrast-enhanced',
    impact: 'serious',
    matches: 'color-contrast-matches',
    excludeHidden: false,
    enabled: false,
    tags: ['cat.color', 'wcag2aaa', 'wcag146', 'ACT'],
    actIds: ['09o5cg'],
    all: [],
    any: [
      {
        options: {
          ignoreUnicode: true,
          ignoreLength: false,
          ignorePseudo: false,
          boldValue: 700,
          boldTextPt: 14,
          largeTextPt: 18,
          contrastRatio: {
            normal: {
              expected: 7,
              minThreshold: 4.5,
            },
            large: {
              expected: 4.5,
              minThreshold: 3,
            },
          },
          pseudoSizeThreshold: 0.25,
          shadowOutlineEmMax: 0.1,
          textStrokeEmMin: 0.03,
        },
        id: 'color-contrast-enhanced',
      },
    ],
    none: [],
  },
  'color-contrast': {
    id: 'color-contrast',
    impact: 'serious',
    matches: 'color-contrast-matches',
    excludeHidden: false,
    tags: [
      'cat.color',
      'wcag2aa',
      'wcag143',
      'TTv5',
      'TT13.c',
      'EN-301-549',
      'EN-9.1.4.3',
      'ACT',
    ],
    actIds: ['afw4f7', '09o5cg'],
    all: [],
    any: [
      {
        options: {
          ignoreUnicode: true,
          ignoreLength: false,
          ignorePseudo: false,
          boldValue: 700,
          boldTextPt: 14,
          largeTextPt: 18,
          contrastRatio: {
            normal: {
              expected: 4.5,
            },
            large: {
              expected: 3,
            },
          },
          pseudoSizeThreshold: 0.25,
          shadowOutlineEmMax: 0.2,
          textStrokeEmMin: 0.03,
        },
        id: 'color-contrast',
      },
    ],
    none: [],
  },
  'css-orientation-lock': {
    id: 'css-orientation-lock',
    impact: 'serious',
    selector: 'html',
    tags: [
      'cat.structure',
      'wcag134',
      'wcag21aa',
      'EN-301-549',
      'EN-9.1.3.4',
      'experimental',
    ],
    actIds: ['b33eff'],
    all: [
      {
        options: {
          degreeThreshold: 2,
        },
        id: 'css-orientation-lock',
      },
    ],
    any: [],
    none: [],
    preload: true,
  },
  'definition-list': {
    id: 'definition-list',
    impact: 'serious',
    selector: 'dl',
    matches: 'no-role-matches',
    tags: ['cat.structure', 'wcag2a', 'wcag131', 'EN-301-549', 'EN-9.1.3.1'],
    all: [],
    any: [],
    none: [
      'structured-dlitems',
      {
        options: {
          validRoles: ['definition', 'term', 'listitem'],
          validNodeNames: ['dt', 'dd'],
          divGroups: true,
        },
        id: 'only-dlitems',
      },
    ],
  },
  dlitem: {
    id: 'dlitem',
    impact: 'serious',
    selector: 'dd, dt',
    matches: 'no-role-matches',
    tags: ['cat.structure', 'wcag2a', 'wcag131', 'EN-301-549', 'EN-9.1.3.1'],
    all: [],
    any: ['dlitem'],
    none: [],
  },
  'document-title': {
    id: 'document-title',
    impact: 'serious',
    selector: 'html',
    matches: 'is-initiator-matches',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag242',
      'TTv5',
      'TT12.a',
      'EN-301-549',
      'EN-9.2.4.2',
      'ACT',
    ],
    actIds: ['2779a5'],
    all: [],
    any: ['doc-has-title'],
    none: [],
  },
  'duplicate-id-active': {
    id: 'duplicate-id-active',
    impact: 'serious',
    selector: '[id]',
    matches: 'duplicate-id-active-matches',
    excludeHidden: false,
    tags: ['cat.parsing', 'wcag2a-obsolete', 'wcag411', 'deprecated'],
    enabled: false,
    actIds: ['3ea0c8'],
    all: [],
    any: ['duplicate-id-active'],
    none: [],
  },
  'duplicate-id-aria': {
    id: 'duplicate-id-aria',
    impact: 'critical',
    selector: '[id]',
    matches: 'duplicate-id-aria-matches',
    excludeHidden: false,
    tags: ['cat.parsing', 'wcag2a', 'wcag412', 'EN-301-549', 'EN-9.4.1.2'],
    reviewOnFail: true,
    actIds: ['3ea0c8'],
    all: [],
    any: ['duplicate-id-aria'],
    none: [],
  },
  'duplicate-id': {
    id: 'duplicate-id',
    impact: 'minor',
    selector: '[id]',
    matches: 'duplicate-id-misc-matches',
    excludeHidden: false,
    tags: ['cat.parsing', 'wcag2a-obsolete', 'wcag411', 'deprecated'],
    enabled: false,
    actIds: ['3ea0c8'],
    all: [],
    any: ['duplicate-id'],
    none: [],
  },
  'empty-heading': {
    id: 'empty-heading',
    impact: 'minor',
    selector: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
    matches: 'heading-matches',
    tags: ['cat.name-role-value', 'best-practice'],
    actIds: ['ffd0e9'],
    all: [],
    any: [
      'has-visible-text',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'empty-table-header': {
    id: 'empty-table-header', // R_11
    impact: 'minor',
    selector: 'th:not([role]), [role="rowheader"], [role="columnheader"]',
    tags: ['cat.name-role-value', 'best-practice'],
    all: [],
    any: ['has-visible-text'],
    none: [],
  },
  'focus-order-semantics': {
    id: 'focus-order-semantics',
    impact: 'minor',
    selector: 'div, h1, h2, h3, h4, h5, h6, [role=heading], p, span',
    matches: 'inserted-into-focus-order-matches',
    tags: ['cat.keyboard', 'best-practice', 'experimental'],
    all: [],
    any: [
      {
        options: [],
        id: 'has-widget-role',
      },
      {
        options: {
          roles: ['tooltip'],
        },
        id: 'valid-scrollable-semantics',
      },
    ],
    none: [],
  },
  'form-field-multiple-labels': {
    id: 'form-field-multiple-labels',
    impact: 'moderate',
    selector: 'input, select, textarea',
    matches: 'label-matches',
    tags: [
      'cat.forms',
      'wcag2a',
      'wcag332',
      'TTv5',
      'TT5.c',
      'EN-301-549',
      'EN-9.3.3.2',
    ],
    all: [],
    any: [],
    none: ['multiple-label'],
  },
  'frame-focusable-content': {
    id: 'frame-focusable-content',
    impact: 'serious',
    selector: 'html',
    matches: 'frame-focusable-content-matches',
    tags: [
      'cat.keyboard',
      'wcag2a',
      'wcag211',
      'TTv5',
      'TT4.a',
      'EN-301-549',
      'EN-9.2.1.1',
    ],
    actIds: ['akn7bn'],
    all: [],
    any: ['frame-focusable-content'],
    none: [],
  },
  'frame-tested': {
    id: 'frame-tested',
    impact: 'critical',
    selector: 'html, frame, iframe',
    tags: ['cat.structure', 'best-practice', 'review-item'],
    all: [
      {
        options: {
          isViolation: false,
        },
        id: 'frame-tested',
      },
    ],
    any: [],
    none: [],
  },
  'frame-title-unique': {
    id: 'frame-title-unique',
    impact: 'serious',
    selector: 'frame[title], iframe[title]',
    matches: 'frame-title-has-text-matches',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag412',
      'TTv5',
      'TT12.d',
      'EN-301-549',
      'EN-9.4.1.2',
    ],
    actIds: ['4b1c6c'],
    all: [],
    any: [],
    none: ['unique-frame-title'],
    reviewOnFail: true,
  },
  'frame-title': {
    id: 'frame-title',
    impact: 'serious',
    selector: 'frame, iframe',
    matches: 'no-negative-tabindex-matches',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag412',
      'section508',
      'section508.22.i',
      'TTv5',
      'TT12.d',
      'EN-301-549',
      'EN-9.4.1.2',
    ],
    actIds: ['cae760'],
    all: [],
    any: [
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
      'aria-label',
      'aria-labelledby',
      'presentational-role',
    ],
    none: [],
  },
  'heading-order': {
    id: 'heading-order', // R_33 Custom
    impact: 'moderate',
    selector: 'h1, h2, h3, h4, h5, h6, [role=heading]',
    matches: 'heading-matches',
    tags: ['cat.semantics', 'best-practice'],
    all: [],
    any: ['heading-order'],
    none: [],
  },
  'hidden-content': {
    id: 'hidden-content',
    impact: 'minor',
    selector: '*',
    excludeHidden: false,
    tags: ['cat.structure', 'best-practice', 'experimental', 'review-item'],
    all: [],
    any: ['hidden-content'],
    none: [],
  },
  'html-has-lang': {
    id: 'html-has-lang',
    impact: 'serious',
    selector: 'html',
    matches: 'is-initiator-matches',
    tags: [
      'cat.language',
      'wcag2a',
      'wcag311',
      'TTv5',
      'TT11.a',
      'EN-301-549',
      'EN-9.3.1.1',
      'ACT',
    ],
    actIds: ['b5c3f8'],
    all: [],
    any: [
      {
        options: {
          attributes: ['lang', 'xml:lang'],
        },
        id: 'has-lang',
      },
    ],
    none: [],
  },
  'html-lang-valid': {
    id: 'html-lang-valid',
    impact: 'serious',
    selector:
      'html[lang]:not([lang=""]), html[xml\\:lang]:not([xml\\:lang=""])',
    tags: [
      'cat.language',
      'wcag2a',
      'wcag311',
      'TTv5',
      'TT11.a',
      'EN-301-549',
      'EN-9.3.1.1',
      'ACT',
    ],
    actIds: ['bf051a'],
    all: [],
    any: [],
    none: [
      {
        options: {
          attributes: ['lang', 'xml:lang'],
        },
        id: 'valid-lang',
      },
    ],
  },
  'html-xml-lang-mismatch': {
    id: 'html-xml-lang-mismatch',
    impact: 'moderate',
    selector: 'html[lang][xml\\:lang]',
    matches: 'xml-lang-mismatch-matches',
    tags: [
      'cat.language',
      'wcag2a',
      'wcag311',
      'EN-301-549',
      'EN-9.3.1.1',
      'ACT',
    ],
    actIds: ['5b7ae0'],
    all: ['xml-lang-mismatch'],
    any: [],
    none: [],
  },
  'identical-links-same-purpose': {
    id: 'identical-links-same-purpose',
    impact: 'minor',
    selector: 'a[href], area[href], [role="link"]',
    excludeHidden: false,
    enabled: false,
    matches: 'identical-links-same-purpose-matches',
    tags: ['cat.semantics', 'wcag2aaa', 'wcag249'],
    actIds: ['b20e66'],
    all: ['identical-links-same-purpose'],
    any: [],
    none: [],
  },
  'image-alt': {
    id: 'image-alt',
    impact: 'critical',
    selector: 'img',
    matches: 'no-explicit-name-required-matches',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag111',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT7.a',
      'TT7.b',
      'EN-301-549',
      'EN-9.1.1.1',
      'ACT',
    ],
    actIds: ['23a2a8'],
    all: [],
    any: [
      'has-alt',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
      'presentational-role',
    ],
    none: ['alt-space-value'],
  },
  'image-redundant-alt': {
    id: 'image-redundant-alt',
    impact: 'minor',
    selector: 'img',
    tags: ['cat.text-alternatives', 'best-practice'],
    all: [],
    any: [],
    none: [
      {
        options: {
          parentSelector: 'button, [role=button], a[href], p, li, td, th',
        },
        id: 'duplicate-img-label',
      },
    ],
  },
  'input-button-name': {
    id: 'input-button-name',
    impact: 'critical',
    selector: 'input[type="button"], input[type="submit"], input[type="reset"]',
    matches: 'no-explicit-name-required-matches',
    tags: [
      'cat.name-role-value',
      'wcag2a',
      'wcag412',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT5.c',
      'EN-301-549',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['97a4e1'],
    all: [],
    any: [
      'non-empty-if-present',
      {
        options: {
          attribute: 'value',
        },
        id: 'non-empty-value',
      },
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
      'presentational-role',
    ],
    none: [],
  },
  'input-image-alt': {
    id: 'input-image-alt',
    impact: 'critical',
    selector: 'input[type="image"]',
    matches: 'no-explicit-name-required-matches',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag111',
      'wcag412',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT7.a',
      'EN-301-549',
      'EN-9.1.1.1',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['59796f'],
    all: [],
    any: [
      {
        options: {
          attribute: 'alt',
        },
        id: 'non-empty-alt',
      },
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'label-content-name-mismatch': {
    id: 'label-content-name-mismatch',
    impact: 'serious',
    matches: 'label-content-name-mismatch-matches',
    tags: [
      'cat.semantics',
      'wcag21a',
      'wcag253',
      'EN-301-549',
      'EN-9.2.5.3',
      'experimental',
    ],
    actIds: ['2ee8b8'],
    all: [],
    any: [
      {
        options: {
          pixelThreshold: 0.1,
          occurrenceThreshold: 3,
        },
        id: 'label-content-name-mismatch',
      },
    ],
    none: [],
  },
  'label-title-only': {
    id: 'label-title-only',
    impact: 'serious',
    selector: 'input, select, textarea',
    matches: 'label-matches',
    tags: ['cat.forms', 'best-practice'],
    all: [],
    any: [],
    none: ['title-only'],
  },
  label: {
    id: 'label',
    impact: 'critical',
    selector: 'input, textarea',
    matches: 'label-matches',
    tags: [
      'cat.forms',
      'wcag2a',
      'wcag412',
      'section508',
      'section508.22.n',
      'TTv5',
      'TT5.c',
      'EN-301-549',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['e086e5'],
    all: [],
    any: [
      'implicit-label',
      'explicit-label',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
      {
        options: {
          attribute: 'placeholder',
        },
        id: 'non-empty-placeholder',
      },
      'presentational-role',
    ],
    none: ['hidden-explicit-label'],
  },
  'landmark-banner-is-top-level': {
    id: 'landmark-banner-is-top-level',
    impact: 'moderate',
    selector: 'header:not([role]), [role=banner]',
    matches: 'landmark-has-body-context-matches',
    tags: ['cat.semantics', 'best-practice'],
    all: [],
    any: ['landmark-is-top-level'],
    none: [],
  },
  'landmark-complementary-is-top-level': {
    id: 'landmark-complementary-is-top-level',
    impact: 'moderate',
    selector: 'aside:not([role]), [role=complementary]',
    tags: ['cat.semantics', 'best-practice'],
    all: [],
    any: ['landmark-is-top-level'],
    none: [],
  },
  'landmark-contentinfo-is-top-level': {
    id: 'landmark-contentinfo-is-top-level',
    impact: 'moderate',
    selector: 'footer:not([role]), [role=contentinfo]',
    matches: 'landmark-has-body-context-matches',
    tags: ['cat.semantics', 'best-practice'],
    all: [],
    any: ['landmark-is-top-level'],
    none: [],
  },
  'landmark-main-is-top-level': {
    id: 'landmark-main-is-top-level',
    impact: 'moderate',
    selector: 'main:not([role]), [role=main]',
    tags: ['cat.semantics', 'best-practice'],
    all: [],
    any: ['landmark-is-top-level'],
    none: [],
  },
  'landmark-no-duplicate-banner': {
    id: 'landmark-no-duplicate-banner',
    impact: 'moderate',
    selector: 'header:not([role]), [role=banner]',
    tags: ['cat.semantics', 'best-practice'],
    all: [],
    any: [
      {
        options: {
          selector: 'header:not([role]), [role=banner]',
          role: 'banner',
        },
        id: 'page-no-duplicate-banner',
      },
    ],
    none: [],
  },
  'landmark-no-duplicate-contentinfo': {
    id: 'landmark-no-duplicate-contentinfo',
    impact: 'moderate',
    selector: 'footer:not([role]), [role=contentinfo]',
    tags: ['cat.semantics', 'best-practice'],
    all: [],
    any: [
      {
        options: {
          selector: 'footer:not([role]), [role=contentinfo]',
          role: 'contentinfo',
        },
        id: 'page-no-duplicate-contentinfo',
      },
    ],
    none: [],
  },
  'landmark-no-duplicate-main': {
    id: 'landmark-no-duplicate-main',
    impact: 'moderate',
    selector: 'main:not([role]), [role=main]',
    tags: ['cat.semantics', 'best-practice'],
    all: [],
    any: [
      {
        options: {
          selector: "main:not([role]), [role='main']",
        },
        id: 'page-no-duplicate-main',
      },
    ],
    none: [],
  },
  'landmark-one-main': {
    id: 'landmark-one-main',
    impact: 'moderate',
    selector: 'html',
    tags: ['cat.semantics', 'best-practice'],
    all: [
      {
        options: {
          selector: "main:not([role]), [role='main']",
          passForModal: true,
        },
        id: 'page-has-main',
      },
    ],
    any: [],
    none: [],
  },
  'landmark-unique': {
    id: 'landmark-unique',
    impact: 'moderate',
    selector:
      '[role=banner], [role=complementary], [role=contentinfo], [role=main], [role=navigation], [role=region], [role=search], [role=form], form, footer, header, aside, main, nav, section',
    tags: ['cat.semantics', 'best-practice'],
    matches: 'landmark-unique-matches',
    all: [],
    any: ['landmark-is-unique'],
    none: [],
  },
  'link-purpose-in-context': {
    id: 'link-purpose-in-context', // R_27 Custom
    selector: 'a[href]',
    enabled: true,
    any: ['link-purpose-in-context'],
    impact: 'serious',
    metadata: {
      description: 'Link lacks descriptive text',
      help: "Add descriptive link text to describe what a link points to within the <a> element. If adding descriptive link text is impossible, add a descriptive aria-label attribute to the <a> element. Alternatively, if the link is not intended for user interaction, add an aria-hidden='true' attribute.",
      helpUrl:
        'https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-refs.html',
    },
    tags: [
      'cat.text-alternatives',
      'wcag2aaa',
      'wcag244',
      'wcag249',
      'wcag412',
    ],
  },
  'link-in-text-block': {
    id: 'link-in-text-block',
    impact: 'serious',
    selector: 'a[href], [role=link]',
    matches: 'link-in-text-block-matches',
    excludeHidden: false,
    tags: [
      'cat.color',
      'wcag2a',
      'wcag141',
      'TTv5',
      'TT13.a',
      'EN-301-549',
      'EN-9.1.4.1',
    ],
    all: [],
    any: [
      {
        options: {
          requiredContrastRatio: 3,
          allowSameColor: true,
        },
        id: 'link-in-text-block',
      },
      'link-in-text-block-style',
    ],
    none: [],
  },
  'link-name': {
    id: 'link-name',
    impact: 'serious',
    selector: 'a[href]',
    tags: [
      'cat.name-role-value',
      'wcag2a',
      'wcag244',
      'wcag412',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT6.a',
      'EN-301-549',
      'EN-9.2.4.4',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['c487ae'],
    all: [],
    any: [
      'has-visible-text',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: ['focusable-no-name'],
  },
  list: {
    id: 'list', // R_14
    impact: 'serious',
    selector: 'ul, ol',
    matches: 'no-role-matches',
    tags: ['cat.structure', 'wcag2a', 'wcag131', 'EN-301-549', 'EN-9.1.3.1'],
    all: [],
    any: [],
    none: [
      {
        options: {
          validRoles: ['listitem'],
          validNodeNames: ['li'],
        },
        id: 'only-listitems',
      },
    ],
  },
  listitem: {
    id: 'listitem', // R_13
    impact: 'serious',
    selector: 'li',
    matches: 'no-role-matches',
    tags: ['cat.structure', 'wcag2a', 'wcag131', 'EN-301-549', 'EN-9.1.3.1'],
    all: [],
    any: ['listitem'],
    none: [],
  },
  marquee: {
    id: 'marquee',
    impact: 'serious',
    selector: 'marquee',
    excludeHidden: false,
    tags: [
      'cat.parsing',
      'wcag2a',
      'wcag222',
      'TTv5',
      'TT2.b',
      'EN-301-549',
      'EN-9.2.2.2',
    ],
    all: [],
    any: [],
    none: ['is-on-screen'],
  },
  'meta-refresh-no-exceptions': {
    id: 'meta-refresh-no-exceptions',
    impact: 'minor',
    selector: 'meta[http-equiv="refresh"][content]',
    excludeHidden: false,
    enabled: false,
    tags: ['cat.time-and-media', 'wcag2aaa', 'wcag224', 'wcag325'],
    actIds: ['bisz58'],
    all: [],
    any: [
      {
        options: {
          minDelay: 72e3,
          maxDelay: false,
        },
        id: 'meta-refresh-no-exceptions',
      },
    ],
    none: [],
  },
  'meta-refresh': {
    id: 'meta-refresh',
    impact: 'critical',
    selector: 'meta[http-equiv="refresh"][content]',
    excludeHidden: false,
    tags: [
      'cat.time-and-media',
      'wcag2a',
      'wcag221',
      'TTv5',
      'TT8.a',
      'EN-301-549',
      'EN-9.2.2.1',
    ],
    actIds: ['bc659a', 'bisz58'],
    all: [],
    any: [
      {
        options: {
          minDelay: 0,
          maxDelay: 72e3,
        },
        id: 'meta-refresh',
      },
    ],
    none: [],
  },
  'meta-viewport-large': {
    id: 'meta-viewport-large',
    impact: 'minor',
    selector: 'meta[name="viewport"]',
    matches: 'is-initiator-matches',
    excludeHidden: false,
    tags: ['cat.sensory-and-visual-cues', 'best-practice'],
    all: [],
    any: [
      {
        options: {
          scaleMinimum: 5,
          lowerBound: 2,
        },
        id: 'meta-viewport-large',
      },
    ],
    none: [],
  },
  'meta-viewport': {
    id: 'meta-viewport',
    impact: 'critical',
    selector: 'meta[name="viewport"]',
    matches: 'is-initiator-matches',
    excludeHidden: false,
    tags: [
      'cat.sensory-and-visual-cues',
      'wcag2aa',
      'wcag144',
      'EN-301-549',
      'EN-9.1.4.4',
      'ACT',
    ],
    actIds: ['b4f0c3'],
    all: [],
    any: [
      {
        options: {
          scaleMinimum: 2,
        },
        id: 'meta-viewport',
      },
    ],
    none: [],
  },
  'nested-interactive': {
    id: 'nested-interactive',
    impact: 'serious',
    matches: 'nested-interactive-matches',
    tags: [
      'cat.keyboard',
      'wcag2a',
      'wcag412',
      'TTv5',
      'TT6.a',
      'EN-301-549',
      'EN-9.4.1.2',
    ],
    actIds: ['307n5z'],
    all: [],
    any: ['no-focusable-content'],
    none: [],
  },
  'no-autoplay-audio': {
    id: 'no-autoplay-audio',
    impact: 'moderate',
    excludeHidden: false,
    selector: 'audio[autoplay], video[autoplay]',
    matches: 'no-autoplay-audio-matches',
    reviewOnFail: true,
    tags: [
      'cat.time-and-media',
      'wcag2a',
      'wcag142',
      'TTv5',
      'TT2.a',
      'EN-301-549',
      'EN-9.1.4.2',
      'ACT',
    ],
    actIds: ['80f0bf'],
    preload: true,
    all: [
      {
        options: {
          allowedDuration: 3,
        },
        id: 'no-autoplay-audio',
      },
    ],
    any: [],
    none: [],
  },
  'object-alt': {
    id: 'object-alt',
    impact: 'serious',
    selector: 'object[data]',
    matches: 'object-is-loaded-matches',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag111',
      'section508',
      'section508.22.a',
      'EN-301-549',
      'EN-9.1.1.1',
    ],
    actIds: ['8fc3b6'],
    all: [],
    any: [
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
      'presentational-role',
    ],
    none: [],
  },
  'p-as-heading': {
    id: 'p-as-heading',
    impact: 'serious',
    selector: 'p',
    matches: 'p-as-heading-matches',
    tags: [
      'cat.semantics',
      'wcag2a',
      'wcag131',
      'EN-301-549',
      'EN-9.1.3.1',
      'experimental',
    ],
    all: [
      {
        options: {
          margins: [
            {
              weight: 150,
              italic: true,
            },
            {
              weight: 150,
              size: 1.15,
            },
            {
              italic: true,
              size: 1.15,
            },
            {
              size: 1.4,
            },
          ],
          passLength: 1,
          failLength: 0.5,
        },
        id: 'p-as-heading',
      },
    ],
    any: [],
    none: [],
  },
  'page-has-heading-one': {
    id: 'page-has-heading-one', //R_32
    impact: 'moderate',
    selector: 'html',
    tags: ['cat.semantics', 'best-practice'],
    all: [
      {
        options: {
          selector:
            'h1:not([role], [aria-level]), :is(h1, h2, h3, h4, h5, h6):not([role])[aria-level=1], [role=heading][aria-level=1]',
          passForModal: true,
        },
        id: 'page-has-heading-one',
      },
    ],
    any: [],
    none: [],
  },
  'presentation-role-conflict': {
    id: 'presentation-role-conflict',
    impact: 'minor',
    selector: 'img[alt=\'\'], [role="none"], [role="presentation"]',
    matches: 'has-implicit-chromium-role-matches',
    tags: ['cat.aria', 'best-practice', 'ACT'],
    actIds: ['46ca7f'],
    all: [],
    any: [],
    none: ['is-element-focusable', 'has-global-aria-attribute'],
  },
  region: {
    id: 'region',
    impact: 'moderate',
    selector: 'body *',
    tags: ['cat.keyboard', 'best-practice'],
    all: [],
    any: [
      {
        options: {
          regionMatcher: 'dialog, [role=dialog], [role=alertdialog], svg',
        },
        id: 'region',
      },
    ],
    none: [],
  },
  'role-img-alt': {
    id: 'role-img-alt',
    impact: 'serious',
    selector: "[role='img']:not(img, area, input, object)",
    matches: 'html-namespace-matches',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag111',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT7.a',
      'EN-301-549',
      'EN-9.1.1.1',
      'ACT',
    ],
    actIds: ['23a2a8'],
    all: [],
    any: [
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  'scope-attr-valid': {
    id: 'scope-attr-valid',
    impact: 'moderate',
    selector: 'td[scope], th[scope]',
    tags: ['cat.tables', 'best-practice'],
    all: [
      'html5-scope',
      {
        options: {
          values: ['row', 'col', 'rowgroup', 'colgroup'],
        },
        id: 'scope-value',
      },
    ],
    any: [],
    none: [],
  },
  'scrollable-region-focusable': {
    id: 'scrollable-region-focusable',
    impact: 'serious',
    selector: '*:not(select,textarea)',
    matches: 'scrollable-region-focusable-matches',
    tags: [
      'cat.keyboard',
      'wcag2a',
      'wcag211',
      'wcag213',
      'TTv5',
      'TT4.a',
      'EN-301-549',
      'EN-9.2.1.1',
      'EN-9.2.1.3',
    ],
    actIds: ['0ssw9k'],
    all: [],
    any: ['focusable-content', 'focusable-element'],
    none: [],
  },
  'select-name': {
    id: 'select-name',
    impact: 'critical',
    selector: 'select',
    tags: [
      'cat.forms',
      'wcag2a',
      'wcag412',
      'section508',
      'section508.22.n',
      'TTv5',
      'TT5.c',
      'EN-301-549',
      'EN-9.4.1.2',
      'ACT',
    ],
    actIds: ['e086e5'],
    all: [],
    any: [
      'implicit-label',
      'explicit-label',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
      'presentational-role',
    ],
    none: ['hidden-explicit-label'],
  },
  'server-side-image-map': {
    id: 'server-side-image-map',
    impact: 'minor',
    selector: 'img[ismap]',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag211',
      'section508',
      'section508.22.f',
      'TTv5',
      'TT4.a',
      'EN-301-549',
      'EN-9.2.1.1',
    ],
    all: [],
    any: [],
    none: ['exists'],
  },
  'skip-link': {
    id: 'skip-link',
    impact: 'moderate',
    selector: 'a[href^="#"], a[href^="/#"]',
    matches: 'skip-link-matches',
    tags: ['cat.keyboard', 'best-practice'],
    all: [],
    any: ['skip-link'],
    none: [],
  },
  'svg-img-alt': {
    id: 'svg-img-alt',
    impact: 'serious',
    selector:
      '[role="img"], [role="graphics-symbol"], svg[role="graphics-document"]',
    matches: 'svg-namespace-matches',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag111',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT7.a',
      'EN-301-549',
      'EN-9.1.1.1',
      'ACT',
    ],
    actIds: ['7d6734'],
    all: [],
    any: [
      'svg-non-empty-title',
      'aria-label',
      'aria-labelledby',
      {
        options: {
          attribute: 'title',
        },
        id: 'non-empty-title',
      },
    ],
    none: [],
  },
  tabindex: {
    id: 'tabindex',
    impact: 'serious',
    selector: '[tabindex]',
    tags: ['cat.keyboard', 'best-practice'],
    all: [],
    any: ['tabindex'],
    none: [],
  },
  'table-duplicate-name': {
    id: 'table-duplicate-name',
    impact: 'minor',
    selector: 'table',
    tags: ['cat.tables', 'best-practice'],
    all: [],
    any: [],
    none: ['same-caption-summary'],
  },
  'table-fake-caption': {
    id: 'table-fake-caption',
    impact: 'serious',
    selector: 'table',
    matches: 'data-table-matches',
    tags: [
      'cat.tables',
      'experimental',
      'wcag2a',
      'wcag131',
      'section508',
      'section508.22.g',
      'EN-301-549',
      'EN-9.1.3.1',
    ],
    all: ['caption-faked'],
    any: [],
    none: [],
  },
  'target-size': {
    id: 'target-size',
    impact: 'serious',
    selector: '*',
    enabled: false,
    matches: 'widget-not-inline-matches',
    tags: ['cat.sensory-and-visual-cues', 'wcag22aa', 'wcag258'],
    all: [],
    any: [
      {
        options: {
          minSize: 24,
        },
        id: 'target-size',
      },
      {
        options: {
          minOffset: 24,
        },
        id: 'target-offset',
      },
    ],
    none: [],
  },
  'td-has-header': {
    id: 'td-has-header',
    impact: 'critical',
    selector: 'table',
    matches: 'data-table-large-matches',
    tags: [
      'cat.tables',
      'experimental',
      'wcag2a',
      'wcag131',
      'section508',
      'section508.22.g',
      'TTv5',
      'TT14.b',
      'EN-301-549',
      'EN-9.1.3.1',
    ],
    all: ['td-has-header'],
    any: [],
    none: [],
  },
  'td-headers-attr': {
    id: 'td-headers-attr',
    impact: 'serious',
    selector: 'table',
    matches: 'table-or-grid-role-matches',
    tags: [
      'cat.tables',
      'wcag2a',
      'wcag131',
      'section508',
      'section508.22.g',
      'TTv5',
      'TT14.b',
      'EN-301-549',
      'EN-9.1.3.1',
    ],
    actIds: ['a25f45'],
    all: ['td-headers-attr'],
    any: [],
    none: [],
  },
  'th-has-data-cells': {
    id: 'th-has-data-cells',
    impact: 'serious',
    selector: 'table',
    matches: 'data-table-matches',
    tags: [
      'cat.tables',
      'wcag2a',
      'wcag131',
      'section508',
      'section508.22.g',
      'TTv5',
      'TT14.b',
      'EN-301-549',
      'EN-9.1.3.1',
    ],
    actIds: ['d0f69e'],
    all: ['th-has-data-cells'],
    any: [],
    none: [],
  },
  'valid-lang': {
    id: 'valid-lang',
    impact: 'serious',
    selector: '[lang]:not(html), [xml\\:lang]:not(html)',
    tags: [
      'cat.language',
      'wcag2aa',
      'wcag312',
      'TTv5',
      'TT11.b',
      'EN-301-549',
      'EN-9.3.1.2',
      'ACT',
    ],
    actIds: ['de46e4'],
    all: [],
    any: [],
    none: [
      {
        options: {
          attributes: ['lang', 'xml:lang'],
        },
        id: 'valid-lang',
      },
    ],
  },
  'video-caption': {
    id: 'video-caption',
    impact: 'critical',
    selector: 'video',
    tags: [
      'cat.text-alternatives',
      'wcag2a',
      'wcag122',
      'section508',
      'section508.22.a',
      'TTv5',
      'TT17.a',
      'EN-301-549',
      'EN-9.1.2.2',
    ],
    actIds: ['eac66b'],
    all: [],
    any: [],
    none: ['caption'],
  },
};

/**
 * Widget to Dashboard
 *
 * send message from child to parent i.e. from widget(react) to dashboard
 * @param {String} eventName - name of the event to handle apply specific handlers
 * @param {Object} payload - payload data for handlers
 */
export function sendMessageToDashboard(eventName, payload) {
  window.parent.postMessage(
    {
      eventName: eventName,
      payload,
      source: 'WidgetToDashboard',
    },
    currentConfig.dashboardUrl
  );
}

/**
 * Convert RGB to Hex
 * @param {String} rgb
 * @returns {String} Hex value
 */
export function rgbToHex(rgb) {
  const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(
    rgb
  );
  if (!result) return rgb; // If the color is already in a format like hex, return it

  const r = parseInt(result[1], 10);
  const g = parseInt(result[2], 10);
  const b = parseInt(result[3], 10);

  // Ensure the values are properly zero-padded
  return (
    '#' +
    [r, g, b]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

class Color {
  constructor(r, g, b, a = 1) {
    this.r = r / 255;
    this.g = g / 255;
    this.b = b / 255;
    this.alpha = a;
  }

  setAlpha(alpha) {
    this.alpha = alpha;
    return this;
  }

  getLuminosity() {
    const RsRGB =
      this.r <= 0.04045
        ? this.r / 12.92
        : Math.pow((this.r + 0.055) / 1.055, 2.4);
    const GsRGB =
      this.g <= 0.04045
        ? this.g / 12.92
        : Math.pow((this.g + 0.055) / 1.055, 2.4);
    const BsRGB =
      this.b <= 0.04045
        ? this.b / 12.92
        : Math.pow((this.b + 0.055) / 1.055, 2.4);
    return 0.2126 * RsRGB + 0.7152 * GsRGB + 0.0722 * BsRGB;
  }

  getSaturation() {
    const max = Math.max(this.r, this.g, this.b);
    const min = Math.min(this.r, this.g, this.b);

    if (max === min) {
      return 0;
    }

    return (max - min) / (1 - Math.abs(max + min - 1));
  }

  setSaturation(s) {
    if (s < 0 || s > 1) {
      return this;
    }

    const hsl = this.toHsl();
    hsl.s = s;
    return Color.fromHsl(hsl.h, hsl.s, hsl.l, this.alpha);
  }

  static fromHsl(h, s, l, alpha) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return new Color(r * 255, g * 255, b * 255, alpha);
  }

  toHsl() {
    const r = this.r;
    const g = this.g;
    const b = this.b;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h, s, l };
  }
}

const nonSeparableBlendModes = ['hue', 'saturation', 'color', 'luminosity'];

const blendFunctions = {
  normal(Cb, Cs) {
    return Cs;
  },
  multiply(Cb, Cs) {
    return Cs * Cb;
  },
  screen(Cb, Cs) {
    return Cb + Cs - Cb * Cs;
  },
  overlay(Cb, Cs) {
    return this['hard-light'](Cs, Cb);
  },
  darken(Cb, Cs) {
    return Math.min(Cb, Cs);
  },
  lighten(Cb, Cs) {
    return Math.max(Cb, Cs);
  },
  'color-dodge'(Cb, Cs) {
    return Cb === 0 ? 0 : Cs === 1 ? 1 : Math.min(1, Cb / (1 - Cs));
  },
  'color-burn'(Cb, Cs) {
    return Cb === 1 ? 1 : Cs === 0 ? 0 : 1 - Math.min(1, (1 - Cb) / Cs);
  },
  'hard-light'(Cb, Cs) {
    return Cs <= 0.5 ? this.multiply(Cb, 2 * Cs) : this.screen(Cb, 2 * Cs - 1);
  },
  'soft-light'(Cb, Cs) {
    if (Cs <= 0.5) {
      return Cb - (1 - 2 * Cs) * Cb * (1 - Cb);
    } else {
      const D = Cb <= 0.25 ? ((16 * Cb - 12) * Cb + 4) * Cb : Math.sqrt(Cb);
      return Cb + (2 * Cs - 1) * (D - Cb);
    }
  },
  difference(Cb, Cs) {
    return Math.abs(Cb - Cs);
  },
  exclusion(Cb, Cs) {
    return Cb + Cs - 2 * Cb * Cs;
  },
  hue(Cb, Cs) {
    return Cs.setSaturation(Cb.getSaturation()).setLuminosity(
      Cb.getLuminosity()
    );
  },
  saturation(Cb, Cs) {
    return Cb.setSaturation(Cs.getSaturation()).setLuminosity(
      Cb.getLuminosity()
    );
  },
  color(Cb, Cs) {
    return Cs.setLuminosity(Cb.getLuminosity());
  },
  luminosity(Cb, Cs) {
    return Cb.setLuminosity(Cs.getLuminosity());
  },
};

function flattenColors(sourceColor, backdrop, blendMode = 'normal') {
  const blendingResult = blend(backdrop, sourceColor, blendMode);

  const r = simpleAlphaCompositing(
    sourceColor.r,
    sourceColor.alpha,
    backdrop.r,
    backdrop.alpha,
    blendingResult.r
  );
  const g = simpleAlphaCompositing(
    sourceColor.g,
    sourceColor.alpha,
    backdrop.g,
    backdrop.alpha,
    blendingResult.g
  );
  const b = simpleAlphaCompositing(
    sourceColor.b,
    sourceColor.alpha,
    backdrop.b,
    backdrop.alpha,
    blendingResult.b
  );

  const αo = clamp(
    sourceColor.alpha + backdrop.alpha * (1 - sourceColor.alpha),
    0,
    1
  );

  if (αo === 0) {
    return new Color(r * 255, g * 255, b * 255, αo);
  }

  const Cr = Math.round((r / αo) * 255);
  const Cg = Math.round((g / αo) * 255);
  const Cb = Math.round((b / αo) * 255);

  return new Color(Cr, Cg, Cb, αo);
}

function simpleAlphaCompositing(Cs, αs, Cb, αb, blendingResult) {
  return αs * (1 - αb) * Cs + αs * αb * blendingResult + (1 - αs) * αb * Cb;
}

function clamp(value, min, max) {
  return Math.min(Math.max(min, value), max);
}

function blend(Cb, Cs, blendMode) {
  if (nonSeparableBlendModes.includes(blendMode)) {
    return blendFunctions[blendMode](Cb, Cs);
  }

  const C = new Color();
  ['r', 'g', 'b'].forEach((channel) => {
    C[channel] = blendFunctions[blendMode](Cb[channel], Cs[channel]);
  });
  return C;
}

function parseColor(colorString) {
  let match;

  // rgba(r, g, b, a)
  match = colorString.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (match) {
    return new Color(
      parseInt(match[1]),
      parseInt(match[2]),
      parseInt(match[3]),
      parseFloat(match[4])
    );
  }

  // rgb(r, g, b)
  match = colorString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (match) {
    return new Color(
      parseInt(match[1]),
      parseInt(match[2]),
      parseInt(match[3])
    );
  }

  // hex (#rrggbb or #rgb)
  match = colorString.match(/^#([0-9a-f]{3,4}){1,2}$/i);
  if (match) {
    let hex = match[1];
    if (hex.length === 3) {
      return new Color(
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      );
    } else if (hex.length === 4) {
      return new Color(
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        parseInt(hex[3] + hex[3], 16) / 255
      );
    } else if (hex.length === 6) {
      return new Color(
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      );
    } else if (hex.length === 8) {
      return new Color(
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
        parseInt(hex.substring(6, 8), 16) / 255
      );
    }
  }

  // named colors (fallback - browser dependent)
  const tempElement = document.createElement('div');
  tempElement.style.color = colorString;
  document.body.appendChild(tempElement);
  const computedColor = getComputedStyle(tempElement).color;
  document.body.removeChild(tempElement);
  if (computedColor && computedColor !== colorString) {
    return parseColor(computedColor);
  }

  return null; // Or throw an error for invalid color
}

export function getActualBackgroundColor(element) {
  const backgroundStack = [];
  let currentElement = element;

  while (currentElement) {
    const style = getComputedStyle(currentElement);
    const bgColor = style.backgroundColor;
    const opacity = parseFloat(style.opacity);

    if (
      bgColor &&
      bgColor !== 'transparent' &&
      bgColor !== 'rgba(0, 0, 0, 0)'
    ) {
      const color = parseColor(bgColor);
      if (color) {
        backgroundStack.push({
          color: color.setAlpha(color.alpha * opacity),
          blendMode: style.mixBlendMode,
        });
        if (color.alpha * opacity >= 1) {
          break; // Stop if we find a fully opaque background
        }
      }
    }

    currentElement = currentElement.parentElement;
  }

  // If no opaque background found, push the default white background
  if (
    backgroundStack.length === 0 ||
    backgroundStack.every((bg) => bg.color.alpha < 1)
  ) {
    backgroundStack.push({
      color: new Color(255, 255, 255, 1),
      blendMode: 'normal',
    });
  }

  let finalColor = new Color(0, 0, 0, 0); // Start with transparent black
  for (let i = backgroundStack.length - 1; i >= 0; i--) {
    finalColor = flattenColors(
      backgroundStack[i].color,
      finalColor,
      backgroundStack[i].blendMode
    );
  }

  return rgbToHex(
    `rgba(${Math.round(finalColor.r * 255)}, ${Math.round(
      finalColor.g * 255
    )}, ${Math.round(finalColor.b * 255)}, ${finalColor.alpha})`
  );
}
/**
 * Function to wait for an element to be present in the DOM
 * @param {String} selector Css selector for the HTML element to wait for
 * @param {Number} timeout milliseconds to wait max
 * @returns {Promise} A promise that resolves when the element is found and returns element
 */
export function waitForSelector(selector, timeout = 5000) {
  // Added timeout parameter with a default value of 5000ms (5 seconds)
  return new Promise((resolve, reject) => {
    let timer; // Variable to hold the timeout timer

    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        clearTimeout(timer); // Clear the timeout if element is found
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    timer = setTimeout(() => {
      observer.disconnect(); // Stop observing if timeout occurs
      resolve(null); // resolve with null if element is not found
    }, timeout);
  });
}

let timeout;
export const debounce = (callback, delay) => {
  clearTimeout(timeout);
  timeout = setTimeout(callback, delay);
};

const getCurrentSessionPage = () => {
  return JSON.parse(sessionStorage.getItem('GuidySession'))?.pages || [];
};

const addPageToSession = (page) => {
  const guidySession = JSON.parse(sessionStorage.getItem('GuidySession')) || {};
  if (!guidySession.pages || !Array.isArray(guidySession.pages))
    guidySession.pages = [page];
  else guidySession.pages.push(page);

  sessionStorage.setItem('GuidySession', JSON.stringify(guidySession));
};

export async function sendPageViewsEvent(page) {
  page = page.split('?')[0]?.replace(/\/$/, '');
  const pages = getCurrentSessionPage();
  if (pages.includes(page)) {
    return;
  }
  sendClickEvent(
    {
      event: { page },
      type: 'pageViews',
    },
    getAccountKey(cdnUrl)
  );
  addPageToSession(page);
}

export async function sendWebsiteMetrics() {
  if (sessionStorage.getItem('GuidySession')) {
    return;
  }
  sendClickEvent(
    {
      type: 'metrics',
      event: { device: getDeviceType(), browser: await getBrowserName() },
    },
    getAccountKey(cdnUrl)
  );
}

/**
 *
 * @param {String} text A text to be spoken
 * @param {Object} option An object containing optional parameters
 * @param {String} option.voice The voice to be used for speech (default: 'shimmer')
 * @param {Function} option.onEnd A callback function to be called when the speech ends
 * @param {Object} option.ref A reference to the audio element
 * @param {String} option.instructions Instructions for the TTS engine
 * @returns {Promise} A promise that resolves when the speech ends
 */
export async function speak(text, option = {}) {
  const {
    voice = 'shimmer',
    onEnd = () => {},
    instructions = 'Speak in a cheerful and positive tone.',
  } = option;

  const audio = new Audio();
  const mediaSource = new MediaSource();
  let sourceBuffer;
  let reader;
  const abortController = new AbortController();

  let isStopped = false;

  const cleanup = () => {
    try {
      if (reader) reader.cancel().catch(() => {});
      URL.revokeObjectURL(audio.src);
      audio.src = '';
    } catch (err) {
      console.warn('Cleanup failed:', err);
    }
  };

  // Attach stop method directly to audio
  audio.stop = () => {
    if (isStopped) return;
    isStopped = true;
    try {
      abortController.abort();
      audio.pause();
      audio.currentTime = 0;
      cleanup();
    } catch (err) {
      console.warn('Stop failed:', err);
    }
  };

  try {
    if (!text.trim()) return;
    const response = await fetch(`${guidyQueueUrl}/speak`, {
      method: 'POST',
      body: JSON.stringify({ text, voice, instructions }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headerToken}`,
        Site: window.location.href,
        'widget-key': getAccountKey(cdnUrl),
      },
      signal: abortController.signal,
    });

    if (!response.ok || !response.body) {
      console.warn('Failed to fetch audio stream');
      return;
    }

    mediaSource.addEventListener('sourceopen', async () => {
      sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      reader = response.body.getReader();

      const pump = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            const waitForUpdate = () => {
              if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
                try {
                  mediaSource.endOfStream();
                } catch (err) {
                  console.warn('Failed to end stream:', err);
                }
              } else {
                setTimeout(waitForUpdate, 10);
              }
            };
            waitForUpdate();
            return;
          }

          const append = () => {
            if (isStopped || mediaSource.readyState !== 'open') return;

            if (!sourceBuffer.updating) {
              try {
                sourceBuffer.appendBuffer(value);
              } catch (err) {
                console.warn('Append failed:', err);
                return;
              }
              pump(); // keep reading
            } else {
              setTimeout(append, 10);
            }
          };

          append();
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Stream read error:', err);
          }
        }
      };

      pump();
    });

    audio.addEventListener('canplay', () => {
      if (!isStopped) {
        audio.play().catch((err) => console.warn('Play failed:', err));
      }
    });

    audio.addEventListener('ended', () => {
      cleanup();
      onEnd();
    });

    audio.src = URL.createObjectURL(mediaSource);

    return audio;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error speaking:', error.message);
    }
    cleanup();
    return audio;
  }
}

export const languageOptions = [
  {
    label: 'English',
    value: 'en',
  },
  {
    label: 'Japanese',
    value: 'ja',
  },
  {
    label: 'Australian English',
    value: 'au',
  },
  {
    label: 'Arabic',
    value: 'ar',
  },
  {
    label: 'Azerbaijani',
    value: 'az',
  },
  {
    label: 'Bulgarian',
    value: 'bg',
  },
  {
    label: 'Bengali',
    value: 'bn',
  },
  {
    label: 'Breton',
    value: 'br',
  },
  {
    label: 'Catalan',
    value: 'ca',
  },
  {
    label: 'Chechen',
    value: 'ce',
  },
  {
    label: 'Czech',
    value: 'cs',
  },
  {
    label: 'Welsh',
    value: 'cy',
  },
  {
    label: 'Danish',
    value: 'da',
  },
  {
    label: 'German',
    value: 'de',
  },
  {
    label: 'Greek',
    value: 'el',
  },
  {
    label: 'Spanish',
    value: 'es',
  },
  {
    label: 'Estonian',
    value: 'et',
  },
  {
    label: 'Persian',
    value: 'fa',
  },
  {
    label: 'Finnish',
    value: 'fi',
  },
  {
    label: 'Faroese',
    value: 'fo',
  },
  {
    label: 'French',
    value: 'fr',
  },
  {
    label: 'British English',
    value: 'gb',
  },
  {
    label: 'Hausa',
    value: 'ha',
  },
  {
    label: 'Hebrew',
    value: 'he',
  },
  {
    label: 'Hindi',
    value: 'hi',
  },
  {
    label: 'Croatian',
    value: 'hr',
  },
  {
    label: 'Haitian Creole',
    value: 'ht',
  },
  {
    label: 'Hungarian',
    value: 'hu',
  },
  {
    label: 'Indonesian',
    value: 'id',
  },
  {
    label: 'Italian',
    value: 'it',
  },
  {
    label: 'Georgian',
    value: 'ka',
  },
  {
    label: 'Korean',
    value: 'ko',
  },
  {
    label: 'Lithuanian',
    value: 'lt',
  },
  {
    label: 'Montenegrin',
    value: 'me',
  },
  {
    label: 'Mexican Spanish',
    value: 'mx',
  },
  {
    label: 'Norwegian',
    value: 'no',
  },
  {
    label: 'Punjabi',
    value: 'pa',
  },
  {
    label: 'Polish',
    value: 'pl',
  },
  {
    label: 'Portuguese',
    value: 'pt',
  },
  {
    label: 'Romanian',
    value: 'ro',
  },
  {
    label: 'Russian',
    value: 'ru',
  },
  {
    label: 'Sinhala',
    value: 'si',
  },
  {
    label: 'Slovak',
    value: 'sk',
  },
  {
    label: 'Samoan',
    value: 'sm',
  },
  {
    label: 'Serbian',
    value: 'sr',
  },
  {
    label: 'Swedish',
    value: 'sv',
  },
  {
    label: 'Thai',
    value: 'th',
  },
  {
    label: 'Tagalog',
    value: 'tl',
  },
  {
    label: 'Turkish',
    value: 'tr',
  },
  {
    label: 'Dutch',
    value: 'nl',
  },
  {
    label: 'Taiwanese Mandarin',
    value: 'tw',
  },
  {
    label: 'Ukrainian',
    value: 'uk',
  },
  {
    label: 'Vietnamese',
    value: 'vi',
  },
  {
    label: 'Chinese',
    value: 'zh',
  },
];
