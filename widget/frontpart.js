import {
  // accIconInButton,
  getDataById,
  getLocalStorage,
  hideLoaderOnButton,
  isMobileDevice,
  rootElement,
  currentConfig,
  languageOptions,
  // showLoaderOnButton,
  widgetButton,
} from './constants.js';
import { importContentFile, sendWidgetOpenEvent } from './injector.js';
import { setDataById, translateDOMContent } from './content.js';

let contentFile;
let widgetConfig = window.woAccConfig || undefined;
const { staticPath } = currentConfig;

function widgetPositionResolver(widgetButton, config) {
  const deviceType = isMobileDevice() === true ? 'mobile' : 'desktop';
  const position =
    config?.buttonLocation[deviceType]?.position || 'bottom-right';
  switch (position) {
    case 'top-left':
      widgetButton.style.left = '20px';
      widgetButton.style.top = '20px';
      break;
    case 'top-middle':
      widgetButton.style.left = '50%';
      widgetButton.style.top = '20px';
      break;
    case 'top-right':
      widgetButton.style.right = '20px';
      widgetButton.style.top = '20px';
      break;
    case 'middle-left':
      widgetButton.style.left = '20px';
      widgetButton.style.top = '50%';
      break;
    case 'middle-right':
      widgetButton.style.right = '20px';
      widgetButton.style.top = '50%';
      break;
    case 'bottom-left':
      widgetButton.style.left = '20px';
      widgetButton.style.bottom = '20px';
      break;
    case 'bottom-middle':
      widgetButton.style.left = '50%';
      widgetButton.style.bottom = '20px';
      break;
    case 'bottom-right':
      widgetButton.style.right = '20px';
      widgetButton.style.bottom = '20px';
      break;
  }

  if (config?.buttonLocation[deviceType].isExactPositioning) {
    const tempPath = config?.buttonLocation[deviceType];
    let x;
    let y;
    const positions = {};
    positions[tempPath.horizontalPosition] = tempPath.horizontalValue;
    positions[tempPath.verticalPosition] = tempPath.verticalValue;
    const keys = Object.keys(positions);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      switch (key) {
        case 'toTheLeft':
          x = `-${positions[key]}`;
          break;
        case 'toTheRight':
          x = `${positions[key]}`;
          break;
        case 'lower':
          y = `${positions[key]}`;
          break;
        case 'higher':
          y = `-${positions[key]}`;
          break;
      }
    }
    widgetButton.style.transform = `translate(${x}px, ${y}px)`;
  }
}

function widgetTypeResolver(widgetButton, config) {
  const type = config?.buttonType || undefined;
  switch (type) {
    case 'small':
      Object.assign(widgetButton.style, {
        height: '32px',
        width: '32px',
      });
      break;
    case 'medium':
      Object.assign(widgetButton.style, {
        height: '44px',
        width: '44px',
      });
      break;
    case 'large':
      Object.assign(widgetButton.style, {
        height: '64px',
        width: '64px',
      });
      break;
    default:
  }
}

function loadButton() {
  Object.assign(widgetButton.style, {
    borderRadius: '50%',
    background:
      widgetConfig?.buttonColor?.value ||
      'linear-gradient(270deg, #00499E 0%, #1593EF 100%)',
    inset: 'auto 13px 13px auto',
    width: '64px',
    height: '64px',
    transform: 'initial',
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '0px',
    textAlign: 'center',
    transition: 'all 0.1s ease 0s',
    // backgroundColor: widgetConfig?.buttonColor.value || "rgb(54, 73, 255)",
    cursor: 'pointer',
    border: '0px',
    outlineOffset: '3px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
  });
  widgetTypeResolver(widgetButton, widgetConfig);
  if (widgetConfig?.buttonLocation?.desktop?.position) {
    widgetPositionResolver(widgetButton, widgetConfig);
  }
  // else {
  //   const widgetPosition = getDataById("widgetPosition");
  //   if (widgetPosition === "left") {
  //     widgetButton.style.left = "20px";
  //   }
  // }
  // accIconInButton.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // accIconInButton.setAttribute("height", "24");
  // accIconInButton.setAttribute("viewBox", "0 -960 960 960");
  // accIconInButton.setAttribute("width", "24");
  // accIconInButton.setAttribute("role", "presentation");
  // Object.assign(accIconInButton.style, {
  //   transition: "transform 0.15s ease 0s",
  //   height: "60%",
  //   width: "60%",
  //   fill:
  //     widgetConfig.buttonColor.value === "#ffffff" ||
  //     widgetConfig.buttonColor.value === "rgb(255, 255, 255)"
  //       ? "black"
  //       : "rgb(255, 255, 255)",
  // });
  // const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  // path.setAttribute(
  //   "d",
  //   "M479.133-730Q438-730 409-758.288q-29-28.287-29-69.5Q380-869 408.867-898q28.868-29 70-29Q520-927 549-898.133q29 28.867 29 70.08 0 41.212-28.867 69.633-28.867 28.42-70 28.42ZM334-63v-512q-59.043-4.6-119.3-14.229Q154.444-598.857 94-617l31-117q83 24 175.454 33.5 92.454 9.5 178.5 9.5T659-700.5q94-9.5 178-33.5l30 117q-62 16-122 26.5t-119 15.443V-63H506v-251h-52v251H334Z"
  // );
  // accIconInButton.appendChild(path);
  const accIconInButton = document.createElement('img');
  Object.assign(accIconInButton.style, {
    transition: 'transform 0.15s ease 0s',
    height: '70%',
    width: '70%',
  });
  accIconInButton.src = iconResolver();
  widgetButton.appendChild(accIconInButton);

  widgetButton.addEventListener('click', loadContent);
  widgetButton.ariaLabel = 'Guidy Widget';
  widgetButton.id = 'guidy-widget-btn';
  rootElement.appendChild(widgetButton);
}

function loadTranslateButton() {
  // Determine button size based on config (matching widgetTypeResolver logic)
  const type = widgetConfig?.buttonType || 'large';
  let buttonSize = 64; // default to large
  let hoverWidth = 150;
  let fontSize = 16;
  let hoverBorderRadius = 32;
  let arrowSize = 20; // arrow icon size

  switch (type) {
    case 'small':
      buttonSize = 32;
      hoverWidth = 100;
      fontSize = 12;
      hoverBorderRadius = 16;
      arrowSize = 14;
      break;
    case 'medium':
      buttonSize = 44;
      hoverWidth = 125;
      fontSize = 14;
      hoverBorderRadius = 22;
      arrowSize = 16;
      break;
    case 'large':
      buttonSize = 64;
      hoverWidth = 150;
      fontSize = 16;
      hoverBorderRadius = 32;
      arrowSize = 20;
      break;
    default:
      buttonSize = 64;
      hoverWidth = 150;
      fontSize = 16;
      hoverBorderRadius = 32;
      arrowSize = 20;
  }

  // Get default language from storage or HTML lang attribute
  const getDefaultLanguage = () => {
    const storedLanguage = getDataById('websiteLanguage');

    // If stored language is 'default' or not set, get from HTML lang attribute
    if (storedLanguage === 'default' || !storedLanguage) {
      const htmlLang = document.documentElement.lang;
      // Return HTML lang if it exists and is 2 chars, otherwise default to 'en'
      return htmlLang && htmlLang.length === 2 ? htmlLang.toLowerCase() : 'en';
    }

    return storedLanguage;
  };

  // Variable to track selected language (initialize from storage or HTML)
  let selectedLanguage = getDefaultLanguage();

  // Position resolver for translate button
  const translateButtonPositionResolver = (translateButton, config) => {
    const deviceType = isMobileDevice() === true ? 'mobile' : 'desktop';
    const position =
      config?.buttonLocation[deviceType]?.position || 'bottom-right';
    const offset = buttonSize + 36; // Offset from main widget button

    // Reset all positioning styles first
    translateButton.style.left = '';
    translateButton.style.right = '';
    translateButton.style.top = '';
    translateButton.style.bottom = '';
    translateButton.style.transform = '';

    switch (position) {
      case 'top-left':
        translateButton.style.left = `${offset}px`;
        translateButton.style.top = '20px';
        break;
      case 'top-middle':
        // Position beside the centered button (offset to the right with larger gap)
        translateButton.style.left = `calc(50% + ${buttonSize + 16}px)`;
        translateButton.style.top = '20px';
        break;
      case 'top-right':
        translateButton.style.right = `${offset}px`;
        translateButton.style.top = '20px';
        break;
      case 'middle-left':
        translateButton.style.left = `${offset}px`;
        translateButton.style.top = '50%';
        break;
      case 'middle-right':
        translateButton.style.right = `${offset}px`;
        translateButton.style.top = '50%';
        break;
      case 'bottom-left':
        translateButton.style.left = `${offset}px`;
        translateButton.style.bottom = '20px';
        break;
      case 'bottom-middle':
        // Position beside the centered button (offset to the right with larger gap)
        translateButton.style.left = `calc(50% + ${buttonSize + 16}px)`;
        translateButton.style.bottom = '20px';
        break;
      case 'bottom-right':
        translateButton.style.right = `${offset}px`;
        translateButton.style.bottom = '20px';
        break;
    }

    // Handle exact positioning if enabled
    if (config?.buttonLocation[deviceType]?.isExactPositioning) {
      const tempPath = config?.buttonLocation[deviceType];
      let x = 0;
      let y = 0;
      const positions = {};
      positions[tempPath.horizontalPosition] = tempPath.horizontalValue;
      positions[tempPath.verticalPosition] = tempPath.verticalValue;
      const keys = Object.keys(positions);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        switch (key) {
          case 'toTheLeft':
            x = -positions[key];
            break;
          case 'toTheRight':
            x = positions[key];
            break;
          case 'lower':
            y = positions[key];
            break;
          case 'higher':
            y = -positions[key];
            break;
        }
      }

      // Apply transform along with existing translateX/translateY if present
      const currentTransform = translateButton.style.transform;
      if (currentTransform && currentTransform.includes('translate')) {
        translateButton.style.transform = `${currentTransform} translate(${x}px, ${y}px)`;
      } else {
        translateButton.style.transform = `translate(${x}px, ${y}px)`;
      }
    }
  };

  // Position resolver for dropdown
  const dropdownPositionResolver = (dropdown, translateButton, config) => {
    const deviceType = isMobileDevice() === true ? 'mobile' : 'desktop';
    const position =
      config?.buttonLocation[deviceType]?.position || 'bottom-right';
    const dropdownGap = 20; // Gap between button and dropdown

    // Reset positioning
    dropdown.style.left = '';
    dropdown.style.right = '';
    dropdown.style.top = '';
    dropdown.style.bottom = '';

    // Position dropdown above the translate button, aligned to its edge
    switch (position) {
      case 'top-left':
      case 'top-middle':
      case 'top-right':
        // For top positions, dropdown appears below the button
        dropdown.style.top = `${20 + buttonSize + dropdownGap}px`;
        if (position === 'top-left') {
          dropdown.style.left = `${buttonSize + 36}px`;
        } else if (position === 'top-middle') {
          dropdown.style.left = `calc(50% + ${buttonSize + 16}px)`;
        } else {
          dropdown.style.right = `${buttonSize + 36}px`;
        }
        break;

      case 'middle-left':
      case 'middle-right':
        // For middle positions, dropdown appears above the button (vertically)
        // Reduce height to fit better in available space
        dropdown.style.bottom = `calc(50% + ${buttonSize / 2}px + ${dropdownGap}px)`;
        dropdown.style.maxHeight = '300px'; // Reduced height for middle positions
        if (position === 'middle-left') {
          dropdown.style.left = `${buttonSize + 36}px`;
        } else {
          dropdown.style.right = `${buttonSize + 36}px`;
        }
        break;

      case 'bottom-left':
      case 'bottom-middle':
      case 'bottom-right':
        // For bottom positions, dropdown appears above the button
        dropdown.style.bottom = `${20 + buttonSize + dropdownGap}px`;
        if (position === 'bottom-left') {
          dropdown.style.left = `${buttonSize + 36}px`;
        } else if (position === 'bottom-middle') {
          dropdown.style.left = `calc(50% + ${buttonSize + 16}px)`;
        } else {
          dropdown.style.right = `${buttonSize + 36}px`;
        }
        break;
    }
  };

  // Create style tag for the translate button and dropdown styles
  const styleTag = document.createElement('style');
  styleTag.id = 'guidy-translate-button-styles';
  styleTag.textContent = `
    #guidy-translate-btn {
      position: fixed;
      width: ${buttonSize}px;
      height: ${buttonSize}px;
      border-radius: 50%;
      background: ${widgetConfig?.buttonColor?.value || 'linear-gradient(270deg, #00499E 0%, #1593EF 100%)'};
      border: 0px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: width 0.3s ease, border-radius 0.3s ease, padding 0.3s ease;
      z-index: 99999;
      padding: 0;
      outline: none;
    }

    #guidy-translate-btn:hover {
      width: ${hoverWidth}px;
      border-radius: ${hoverBorderRadius}px;
      padding: 0 8px;
      justify-content: flex-start;
    }

    #guidy-translate-btn.expanded {
      width: 260px;
      border-radius: ${hoverBorderRadius}px;
      padding: 0 16px;
      justify-content: flex-start;
    }

    #guidy-translate-btn:focus {
      outline: 2px solid #1593EF;
      outline-offset: 2px;
    }

    .guidy-translate-code {
      position: absolute;
      left: 0;
      right: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: ${fontSize}px;
      font-weight: 700;
      color: #ffffff;
      text-align: center;
      white-space: nowrap;
      transition: opacity 0.2s ease;
    }

    #guidy-translate-btn:hover .guidy-translate-code {
      opacity: 0;
    }

    #guidy-translate-btn.expanded .guidy-translate-code {
      opacity: 0;
    }

    .guidy-translate-full {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: ${fontSize - 1}px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s ease 0.1s;
      pointer-events: none;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }

    #guidy-translate-btn:hover .guidy-translate-full {
      opacity: 1;
    }

    #guidy-translate-btn.expanded .guidy-translate-full {
      opacity: 1;
      pointer-events: auto;
    }

    .guidy-translate-arrow {
      width: ${arrowSize}px;
      margin-left: auto;
      flex-shrink: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
      color: #ffffff;
      opacity: 0;
      transform: rotate(180deg); /* Point down when closed */
    }

    #guidy-translate-btn:hover .guidy-translate-arrow {
      transition-delay: 0.2s;
      opacity: 1;
    }

    #guidy-translate-btn.expanded .guidy-translate-arrow {
      opacity: 1;
      transform: rotate(0deg); /* Point up when open */
      transition-delay: 0s;
    }

    /* Language Dropdown Styles */
    .guidy-language-dropdown {
      position: fixed;
      width: 260px;
      max-height: 450px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 100000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .guidy-language-dropdown.active {
      display: flex;
      animation: guidyDropdownFadeIn 0.2s ease;
    }

    @keyframes guidyDropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .guidy-language-search-wrapper {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .guidy-language-search {
      width: 100%;
      padding: 10px 12px 10px 36px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cpath d='m21 21-4.35-4.35'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: 10px center;
    }

    .guidy-language-search:focus {
      border-color: #1593EF;
    }

    .guidy-language-list {
      overflow-y: auto;
      flex: 1;
      padding: 8px;
    }

    .guidy-language-list::-webkit-scrollbar {
      width: 6px;
    }

    .guidy-language-list::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 3px;
    }

    .guidy-language-list::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    .guidy-language-list::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    .guidy-language-option {
      display: flex;
      align-items: center;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      margin-bottom: 4px;
      border: 2px solid transparent;
      background: #f2f2f2; 
    }

    .guidy-language-option:hover {
      background-color: #e3e3e3;
    }

    .guidy-language-option.selected {
      background-color: #eff6ff;
      border-color: #1593EF;
    }

    .guidy-language-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1593EF 0%, #00499E 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .guidy-language-label {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }

    .guidy-language-checkmark {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 2px solid #1593EF;
      background: #1593EF;
      display: none;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .guidy-language-option.selected .guidy-language-checkmark {
      display: flex;
    }

    .guidy-language-checkmark svg {
      width: 14px;
      height: 14px;
      stroke: white;
      stroke-width: 3;
    }

    .guidy-language-option.hidden {
      display: none;
    }
  `;

  // Append style tag to head
  document.head.appendChild(styleTag);

  // Create the translate button
  const translateButton = document.createElement('button');
  translateButton.id = 'guidy-translate-btn';
  translateButton.setAttribute(
    'aria-label',
    'Language Selector, current language: English'
  );
  translateButton.setAttribute('aria-haspopup', 'listbox');
  translateButton.setAttribute('aria-expanded', 'false');
  translateButton.type = 'button';

  // Find the default language object
  const defaultLangObj =
    languageOptions.find((lang) => lang.value === selectedLanguage) ||
    languageOptions[0];

  // Create language code element (visible by default)
  const languageCode = document.createElement('span');
  languageCode.className = 'guidy-translate-code';
  languageCode.textContent = defaultLangObj.value.toUpperCase();
  languageCode.setAttribute('aria-hidden', 'true');

  // Create full language name element (visible on hover)
  const languageFull = document.createElement('span');
  languageFull.className = 'guidy-translate-full';
  languageFull.textContent = defaultLangObj.label;
  languageFull.setAttribute('aria-hidden', 'true');

  // Update button aria-label with default language
  translateButton.setAttribute(
    'aria-label',
    `Language Selector, current language: ${defaultLangObj.label}`
  );

  // Create arrow icon element (visible when expanded)
  const arrowIcon = document.createElement('span');
  arrowIcon.className = 'guidy-translate-arrow';
  arrowIcon.setAttribute('aria-hidden', 'true');
  arrowIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${arrowSize}" height="${arrowSize}" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M10.94 7.94a1.5 1.5 0 0 1 2.12 0l5.658 5.656a1.5 1.5 0 1 1-2.122 2.121L12 11.122l-4.596 4.596a1.5 1.5 0 1 1-2.122-2.12z"/></g></svg>`;

  // Append elements to button
  translateButton.appendChild(languageCode);
  translateButton.appendChild(languageFull);
  translateButton.appendChild(arrowIcon);

  // Create language dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'guidy-language-dropdown';
  dropdown.id = 'guidy-language-dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.setAttribute('aria-label', 'Language selection');

  // Create search wrapper
  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'guidy-language-search-wrapper';

  // Create search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'guidy-language-search';
  searchInput.placeholder = 'Search language';
  searchInput.setAttribute('aria-label', 'Search language');

  searchWrapper.appendChild(searchInput);

  // Create language list
  const languageList = document.createElement('div');
  languageList.className = 'guidy-language-list';

  // Track focused option index for keyboard navigation
  let focusedOptionIndex = -1;

  // Function to update focused option
  const updateFocusedOption = (newIndex) => {
    const visibleOptions = Array.from(
      languageList.querySelectorAll('.guidy-language-option:not(.hidden)')
    );

    if (visibleOptions.length === 0) return;

    // Clamp index
    if (newIndex < 0) newIndex = visibleOptions.length - 1;
    if (newIndex >= visibleOptions.length) newIndex = 0;

    focusedOptionIndex = newIndex;

    // Update focus styling
    visibleOptions.forEach((opt, index) => {
      if (index === focusedOptionIndex) {
        opt.style.outline = '2px solid #1593EF';
        opt.style.outlineOffset = '-2px';
        opt.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        opt.style.outline = '';
        opt.style.outlineOffset = '';
      }
    });
  };

  // Function to select currently focused option
  const selectFocusedOption = () => {
    const visibleOptions = Array.from(
      languageList.querySelectorAll('.guidy-language-option:not(.hidden)')
    );
    if (focusedOptionIndex >= 0 && focusedOptionIndex < visibleOptions.length) {
      visibleOptions[focusedOptionIndex].click();
    }
  };

  // Function to open dropdown
  const openDropdown = () => {
    dropdown.classList.add('active');
    translateButton.classList.add('expanded');
    translateButton.setAttribute('aria-expanded', 'true');
    searchInput.focus();
    focusedOptionIndex = -1;

    // Scroll to selected option for better accessibility
    setTimeout(() => {
      const selectedOption = languageList.querySelector(
        '.guidy-language-option.selected'
      );
      if (selectedOption) {
        selectedOption.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 100); // Small delay to ensure dropdown is fully rendered
  };

  // Function to close dropdown
  const closeDropdown = () => {
    dropdown.classList.remove('active');
    translateButton.classList.remove('expanded');
    translateButton.setAttribute('aria-expanded', 'false');
    searchInput.value = '';
    focusedOptionIndex = -1;
    // Reset search filter
    languageList.querySelectorAll('.guidy-language-option').forEach((opt) => {
      opt.classList.remove('hidden');
      opt.style.outline = '';
      opt.style.outlineOffset = '';
    });
    translateButton.focus();
  };

  // Render language options
  languageOptions.forEach((language) => {
    const option = document.createElement('div');
    option.className = 'guidy-language-option';
    option.dataset.value = language.value;
    option.dataset.label = language.label.toLowerCase();
    option.setAttribute('role', 'option');
    option.setAttribute('aria-label', language.label);
    option.setAttribute('tabindex', '-1');

    if (language.value === selectedLanguage) {
      option.classList.add('selected');
      option.setAttribute('aria-selected', 'true');
    } else {
      option.setAttribute('aria-selected', 'false');
    }

    // Create language badge
    const badge = document.createElement('div');
    badge.className = 'guidy-language-badge';
    badge.textContent = language.value.toUpperCase();
    badge.setAttribute('aria-hidden', 'true');

    // Create language label
    const label = document.createElement('div');
    label.className = 'guidy-language-label';
    label.textContent = language.label;

    // Create checkmark
    const checkmark = document.createElement('div');
    checkmark.className = 'guidy-language-checkmark';
    checkmark.setAttribute('aria-hidden', 'true');
    checkmark.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    option.appendChild(badge);
    option.appendChild(label);
    option.appendChild(checkmark);

    // Click handler for selecting a language
    const selectLanguage = () => {
      // Update selected language
      selectedLanguage = language.value;

      // Persist language selection to storage
      setDataById('websiteLanguage', language.value);

      // Update button text and aria-label
      languageCode.textContent = language.value.toUpperCase();
      languageFull.textContent = language.label;
      translateButton.setAttribute(
        'aria-label',
        `Language Selector, current language: ${language.label}`
      );

      // Update selected state in list
      document.querySelectorAll('.guidy-language-option').forEach((opt) => {
        opt.classList.remove('selected');
        opt.setAttribute('aria-selected', 'false');
      });
      option.classList.add('selected');
      option.setAttribute('aria-selected', 'true');

      // Close dropdown and shrink button
      closeDropdown();

      translateDOMContent();
    };

    option.addEventListener('click', selectLanguage);

    // Keyboard navigation for individual options
    option.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectLanguage();
      }
    });

    languageList.appendChild(option);
  });

  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const options = languageList.querySelectorAll('.guidy-language-option');

    options.forEach((option) => {
      const label = option.dataset.label;
      const value = option.dataset.value;

      if (label.includes(searchTerm) || value.includes(searchTerm)) {
        option.classList.remove('hidden');
      } else {
        option.classList.add('hidden');
      }
    });

    // Reset focused option when search changes
    focusedOptionIndex = -1;
    options.forEach((opt) => {
      opt.style.outline = '';
      opt.style.outlineOffset = '';
    });
  });

  // Keyboard navigation in search input
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateFocusedOption(focusedOptionIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      updateFocusedOption(focusedOptionIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedOptionIndex >= 0) {
        selectFocusedOption();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    }
  });

  // Assemble dropdown
  dropdown.appendChild(searchWrapper);
  dropdown.appendChild(languageList);

  // Append button and dropdown to root element
  rootElement.appendChild(translateButton);
  rootElement.appendChild(dropdown);

  // Apply dynamic positioning based on widget config
  if (widgetConfig?.buttonLocation) {
    translateButtonPositionResolver(translateButton, widgetConfig);
    dropdownPositionResolver(dropdown, translateButton, widgetConfig);
  }

  // Toggle dropdown on button click
  translateButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains('active')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Keyboard navigation for button
  translateButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (dropdown.classList.contains('active')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    } else if (e.key === 'Escape' && dropdown.classList.contains('active')) {
      e.preventDefault();
      closeDropdown();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !translateButton.contains(e.target)) {
      if (dropdown.classList.contains('active')) {
        closeDropdown();
      }
    }
  });
}

const loadContent = async () => {
  const startTime = Date.now();
  console.log({ startTime });
  if (!contentFile) {
    sendWidgetOpenEvent();
    contentFile = await importContentFile(widgetConfig);
  }
  contentFile.loadWidget();
};

function iconResolver() {
  const icons = {
    'icon-chair': `${staticPath}images/icon-chair-white.svg`,
    'icon-hide': `${staticPath}images/icon-hide-white.svg`,
    'icon-user': `${staticPath}images/icon-user-white.svg`,
    'icon-wheel': `${staticPath}images/icon-wheel-white.svg`,
    'icon-hands': `${staticPath}images/icon-hands-white.svg`,
    'icon-characters': `${staticPath}images/icon-characters-white.svg`,
    'icon-customize': `${staticPath}images/icon-customize-white.svg`,
  };
  return icons[widgetConfig.buttonIcon] ?? icons['icon-chair'];
}

function handleCustomTrigger() {
  const selector = widgetConfig.customTrigger;
  const element = document.querySelector(selector);
  // if (selector[0] === '.') {
  //   element = document.getElementsByClassName(
  //     selector.substring(1, selector.length)
  //   )[0];
  // } else if (selector[0] === '#') {
  //   element = document.getElementById(selector.substring(1, selector.length));
  // }
  if (element) {
    element.addEventListener('click', loadContent);
  } else {
    console.error('Fail to load widget.');
    console.error(
      'Element id or class you provided was not found. Update your id in script tag and try again.'
    );
  }
}

async function setInitialThings() {
  const data = getLocalStorage();
  const isApplied = Object.keys(data).some((appliedKey) => {
    if (
      !['woAccessibilityLang', 'enlargeMenu', 'widgetPosition'].includes(
        appliedKey
      )
    ) {
      const value = data[appliedKey];
      if (value !== 'default') {
        return true;
      }
    }
    return false;
  });
  // if (isApplied) {
  await importContentFile(widgetConfig);
  hideLoaderOnButton();
  // }
  if (widgetConfig.isCustomTriggerSet) {
    handleCustomTrigger();
  } else {
    loadButton();
    if (widgetConfig.isWebsiteLanguageEnabled) loadTranslateButton();
  }
}

setInitialThings();
