import { currentConfig } from './constants.js';

export const sendClickEvent = (data, widgetCode) => {
  fetch(`${currentConfig.baseAPIUrl}/widget/${widgetCode}/event`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      Site: window.location.href,
    },
  })
    .then((res) => res.json())
    .then((d) => {
      console.info('Success :::: ', d);
    })
    .catch((e) => {
      console.error('Fail', e);
    });
};

export function sendAnalyticsEvents(data, widgetCode) {
  const { name, currentActive = undefined } = data;
  const conditions = {
    contrast: currentActive === 'dark' || currentActive === 'high',
    saturationSettings: currentActive === 'lowSaturation',
    enlargeText: currentActive === 'large1',
    textSpacing: currentActive === 'space1',
    font: currentActive === 'readableFont',
    partialReader: currentActive === 'moderateSpeed',
    hideImages: currentActive === 'hide',
    textAlignment: currentActive === 'alignLeft',
  };

  const defaultActive = [
    'smartContrast',
    'screenReader',
    'muteSounds',
    'stopAnimation',
    'readingMode',
    'readingMask',
    'readingGuide',
    'highlightTitles',
    'linkHighlight',
    'textMagnifier',
    'highlightHover',
    'bigBlackCursor',
    'bigWhiteCursor',
    'pageStructure',
    'toolTip',
    'imageDescription',
    'virtualKeyboard',
    'voiceNavigation',
    'keyboardNavigation',
    'furigana',
  ];

  if (
    conditions[name] ||
    (defaultActive.includes(name) && currentActive !== 'default')
  ) {
    return sendClickEvent(
      [
        {
          type: 'function',
          event: name,
        },
      ],
      widgetCode
    );
  }
}

export function getDeviceType() {
  const width = window.innerWidth;
  const ua = navigator.userAgent;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  console.log({ ua, isTouch });
  // User agent checks
  const isMobileUA =
    /Mobi|Mobile|Android|iPhone|iPod|Windows Phone|BlackBerry/i.test(ua);
  const isTabletUA = /Tablet|iPad|PlayBook|Kindle|Silk/i.test(ua);

  // Screen width-based checks
  const isMobileScreen = width <= 768;
  const isTabletScreen = width > 768 && width <= 1024;

  // Accurate Detection Logic
  if ((isMobileUA || (isMobileScreen && isTouch)) && !isTabletUA) {
    return 'Mobile';
  } else if (isTabletUA || (isTabletScreen && isTouch)) {
    return 'Tablet';
  } else {
    return 'Desktop';
  }
}

// export async function getBrowserName(skipUserAgentData) {
//   if (navigator.userAgentData && !skipUserAgentData) {
//     // Modern API (more accurate)
//     const uaData = await navigator.userAgentData.getHighEntropyValues([
//       'brands',
//     ]);
//     const brands = uaData.brands
//       .filter((b) => !/Chromium|Brand/i.test(b.brand))
//       .map((b) => b.brand)?.[0];
//     return brands || getBrowserName(true);
//   } else {
//     // Fallback for older browsers
//     const ua = navigator.userAgent;

//     if (/edg/i.test(ua)) {
//       return 'Microsoft Edge';
//     } else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
//       return 'Opera';
//     } else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) {
//       return 'Google Chrome';
//     } else if (/firefox|fxios/i.test(ua)) {
//       return 'Mozilla Firefox';
//     } else if (/safari/i.test(ua) && !/chrome|crios|opr|edg/i.test(ua)) {
//       return 'Safari';
//     } else if (/msie|trident/i.test(ua)) {
//       return 'Internet Explorer';
//     } else {
//       return 'Unknown Browser';
//     }
//   }
// }

/**
 * Attempts to detect the browser name from a user agent string based on Bowser's logic.
 *
 * @param {string} [userAgentString=navigator.userAgent] - The user agent string to parse. Defaults to the current browser's user agent.
 * @returns {string} The detected browser name or 'Unknown'.
 */
export function getBrowserName(userAgentString) {
  // Use the provided UA string or default to the current environment's navigator.userAgent
  const ua =
    userAgentString ||
    (typeof navigator !== 'undefined' ? navigator.userAgent : '') ||
    '';

  if (!ua) {
    return 'Unknown'; // Cannot determine without a user agent string
  }

  // --- Simplified Browser Checks (Order is important!) ---
  // Based on the logic and order from the provided Bowser browsersList
  // Each entry has 'test' (RegExp(s) or function) and 'name' (string or function)

  const browserChecks = [
    // Bots first
    { test: [/googlebot/i], name: 'Googlebot' },
    { test: [/adsbot-google/i], name: 'AdsBot Google' },
    { test: [/bingbot/i], name: 'Bingbot' },
    { test: [/duckduckbot/i], name: 'DuckDuckBot' },
    { test: [/yandexbot/i], name: 'YandexBot' },

    // Specific Browsers (less common / more specific patterns first)
    { test: [/Whale/i], name: 'NAVER Whale Browser' },
    { test: [/Focus/i], name: 'Focus' }, // Firefox Focus
    { test: [/Swing/i], name: 'Swing' },
    { test: [/Coast/i], name: 'Opera Coast' },
    { test: [/opt\/\d+(?:.?_?\d+)+/i], name: 'Opera Touch' }, // Opera Touch
    { test: [/YandexSearchBrowser/i], name: 'Yandex Search Browser' }, // Before Yandex Browser
    { test: [/yabrowser/i], name: 'Yandex Browser' },
    { test: [/ucbrowser/i], name: 'UC Browser' },
    { test: [/Maxthon|mxios/i], name: 'Maxthon' },
    { test: [/epiphany/i], name: 'Epiphany' },
    { test: [/puffin/i], name: 'Puffin' },
    { test: [/sleipnir/i], name: 'Sleipnir' },
    { test: [/k-meleon/i], name: 'K-Meleon' },
    { test: [/micromessenger/i], name: 'WeChat' },
    // QQ Browser - split into two checks for simplicity
    { test: [/qqbrowserlite/i], name: 'QQ Browser Lite' },
    { test: [/qqbrowser/i], name: 'QQ Browser' },
    { test: [/Vivaldi/i], name: 'Vivaldi' }, // Check before Chrome/Chromium
    { test: [/SeaMonkey/i], name: 'SeaMonkey' }, // Check before Firefox
    { test: [/Sailfish Browser/i], name: 'Sailfish Browser' }, // More specific than Sailfish platform
    { test: [/silk/i], name: 'Amazon Silk' },
    { test: [/phantom/i], name: 'PhantomJS' },
    { test: [/slimerjs/i], name: 'SlimerJS' },
    { test: [/webOS\sBrowser/i], name: 'webOS Browser' }, // More specific than WebOS platform test
    { test: [/bada/i], name: 'Bada' }, // Dolfin browser on Bada platform
    { test: [/Tizen Browser/i], name: 'Tizen Browser' }, // More specific than Tizen platform test
    { test: [/QupZilla/i], name: 'QupZilla' }, // Falkon's previous name
    { test: [/Falkon/i], name: 'Falkon' },
    { test: [/MiuiBrowser/i], name: 'Mi Browser' }, // Xiaomi's Browser
    { test: [/GSA/i], name: 'Google Search App' }, // Google Search App
    { test: [/PaleMoon/i], name: 'Pale Moon' }, // Check before Firefox
    { test: [/MZBrowser/i], name: 'MZ Browser' }, // Meizu Browser

    // Major Engines / Browsers (More common patterns later)
    // Edge - New Chromium Edge (\s Edg/) before older Edge (Edg[ea])
    { test: [/\sEdg\//i], name: 'Microsoft Edge' },
    { test: [/Edg([ea]|ios)/i], name: 'Microsoft Edge' }, // Older Edge / Mobile Edge before IE
    { test: [/msie|trident/i], name: 'Internet Explorer' }, // IE before Chromium/Chrome/Safari
    { test: [/Electron/i], name: 'Electron' }, // Electron framework before Chromium
    { test: [/Chromium/i], name: 'Chromium' }, // Chromium before Chrome
    { test: [/Chrome|CriOS|crmo/i], name: 'Google Chrome' }, // Chrome before Safari
    { test: [/Firefox|FxiOS|Focus/i], name: 'Mozilla Firefox' }, // Firefox/Focus (check Focus again in case pattern matches)
    { test: [/SamsungBrowser/i], name: 'Samsung Internet' }, // Before Android Browser/Safari
    { test: [/opr\/|opios/i], name: 'Opera' }, // Opera Blink/iOS before legacy Opera
    { test: [/opera/i], name: 'Opera' }, // Legacy Opera

    // Mobile/Platform Browsers (often contain Safari/AppleWebKit)
    // BlackBerry before Safari
    { test: [/BlackBerry|\bbb\d+/i, /rim\stablet/i], name: 'BlackBerry' },
    // Android Browser (specific check from Bowser logic)
    {
      test: (ua) =>
        !/like android/i.test(ua) &&
        /android/i.test(ua) &&
        !/Chrome/i.test(ua) &&
        !/Firefox/i.test(ua),
      name: 'Android Browser',
    },
    { test: [/PlayStation 4/i], name: 'PlayStation 4' },

    // Safari must be checked last among WebKit browsers
    // because many others include "Safari" and "AppleWebKit" in their UA
    { test: [/safari|applewebkit/i], name: 'Safari' },

    // Less common Platform identifiers sometimes used as browser names
    { test: [/(web|hpw)[o0]s/i], name: 'WebOS Browser' },
    { test: [/tizen/i], name: 'Tizen Browser' }, // Platform fallback if specific browser wasn't caught
    { test: [/sailfish/i], name: 'Sailfish Browser' }, // Platform fallback
  ];

  // --- Execution Logic ---
  for (const check of browserChecks) {
    let match = false;
    if (Array.isArray(check.test)) {
      // Check multiple regexes if provided
      match = check.test.some((regex) => regex.test(ua));
    } else if (check.test instanceof RegExp) {
      // Check single regex
      match = check.test.test(ua);
    } else if (typeof check.test === 'function') {
      // Execute test function
      match = check.test(ua);
    }

    if (match) {
      // If the name is a function, execute it (e.g., for conditional names)
      // In this simplified version, all names are strings, but keeping for flexibility
      return typeof check.name === 'function' ? check.name(ua) : check.name;
    }
  }

  // If no specific browser rule matched
  return 'Unknown';
}
