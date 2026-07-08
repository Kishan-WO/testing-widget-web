import {
  hideLoaderOnButton,
  showLoaderOnButton,
  localStorageKey,
  currentConfig,
  rootElement,
  getAccountKey,
  getGuidyScript,
  isMobileDevice,
  sendMessageToDashboard,
  sendPageViewsEvent,
  sendWebsiteMetrics,
} from './constants.js';
import { handleDashboardMessage, resolveRules } from './ruleResolver.js';
import { sendClickEvent } from './service.js';

const isWoTestExists = window.isWoTestExists || false;
const { staticPath, cdnUrl, baseAPIUrl } = currentConfig;

const widgetScript = 'frontpart.js';

let contentFile;

export function importContentFile() {
  showLoaderOnButton();
  const type = window.woAccConfig?.widgetType || 'full';
  switch (type) {
    case 'full':
      return new Promise(function (resolve) {
        import('./content.js')
          .then((module) => {
            contentFile = module;
            resolve(contentFile);
          })
          .catch((err) => {
            console.error('Failed to load content-apply module:', err);
            hideLoaderOnButton();
          });
      });

    case 'mini':
      return new Promise(function (resolve) {
        import('./miniWidget.js')
          .then((module) => {
            contentFile = module;
            contentFile.loadWidget();
            resolve(true);
          })
          .catch((err) => {
            console.error('Failed to load Mini Widget:', err);
          });
      });

    case 'nano':
      return new Promise(function (resolve) {
        import('./nanoWidget.js')
          .then((module) => {
            contentFile = module;
            contentFile.loadWidget();
            resolve(true);
          })
          .catch((err) => {
            console.error('Failed to load Nano Widget:', err);
          });
      });
  }
}

function getLocalStorage() {
  return JSON.parse(window.localStorage.getItem(localStorageKey) || '{}');
}

function verifySubscription(accountKey) {
  return new Promise((resolve, reject) => {
    fetch(`${baseAPIUrl}/widget/settings?code=${accountKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Site: window.location.href,
        IsMobile: isMobileDevice(),
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        console.error('Failed to verify widget subscription.');
        reject(err);
      });
  });
}

function setConfig(config) {
  if (!window.woAccConfig) {
    window.woAccConfig = {};
  }
  window.woAccConfig = {
    ...window.woAccConfig,
    isWoTestExists,
    ...config,
  };
}

export function sendWidgetOpenEvent() {
  sendClickEvent([{ event: 'open', type: 'widget' }], getAccountKey(cdnUrl));
}

function overRideConfig(config, attributes) {
  Object.keys(attributes).map((attr) => {
    switch (attr) {
      case 'data-position':
        if (
          [
            'top-left',
            'top-middle',
            'top-right',
            'middle-left',
            'middle-right',
            'bottom-left',
            'bottom-middle',
            'bottom-right',
          ].includes(attributes[attr])
        ) {
          config.buttonLocation.desktop.position = attributes[attr];
        }
        break;
      case 'data-size':
        if (['small', 'medium', 'large'].includes(attributes[attr])) {
          config.buttonType = attributes[attr];
        }
        break;
      case 'data-language':
        config.language = attributes[attr];
        break;
      case 'data-color':
        config.buttonColor.value = attributes[attr];
        break;
      case 'data-type':
        if (['user', 'chair', 'hide'].includes(attributes[attr])) {
          config.buttonIcon = `icon-${attributes[attr]}`;
        }
        break;
      case 'data-mobile':
        break;
      case 'data-trigger':
        config.customTrigger = attributes[attr];
        break;
      case 'data-widget-type':
        config.widgetType = attributes[attr];
        break;
    }
  });
}

function getPageLanguage() {
  // 1. Get language from lang attribute
  let language = document.documentElement.lang;
  if (language?.length && language.includes('-')) {
    language = language.split('-')[0];
  }
  if (language) {
    return language;
  }

  // 2. Use browser api to get language  using "navigator.language || navigator.languages[0]"
  language = navigator.language || navigator.userLanguage;
  return language ? language.split('-')[0] : 'en';
}

function checkAuth() {
  const accountKey = getAccountKey(cdnUrl);
  if (accountKey) {
    const storageData = getLocalStorage();
    if (
      !storageData.disableWidget ||
      (storageData.disableWidget &&
        storageData.disableWidget !== 'disableWidget')
    ) {
      setConfig({ accountKey, isWoTestExists });
      verifySubscription(accountKey)
        .then((config) => {
          const guidyScript = getGuidyScript(cdnUrl);
          // const attributes = Array.from(guidyScript.attributes).reduce(
          //   (acc, attr) => {
          //     acc[attr.name] = attr.value;
          //     return acc;
          //   },
          //   {}
          // );
          if (config) {
            if (config.language === 'auto') {
              config.language = getPageLanguage() || 'en';
            }
            if (config.websiteLanguage === 'auto') {
              config.websiteLanguage = getPageLanguage() || 'en';
            }
            if (
              guidyScript.getAttribute('data-trigger') &&
              guidyScript.getAttribute('data-trigger') !== ''
            ) {
              config.isCustomTriggerSet = true;
              config.customTrigger = guidyScript.getAttribute('data-trigger');
            }
            setConfig(config);
          }
          if (config?.widgetType === 'full') {
            injectDiv();
            setTimeout(() => {
              sendMessageToDashboard('widgetLoaded', {
                widgetType: config?.widgetType,
              });
            }, 1000);
          } else {
            importContentFile();
            setTimeout(() => {
              sendMessageToDashboard('widgetLoaded', {
                widgetType: config?.widgetType,
              });
            }, 1000);
          }
          window.addEventListener('message', (event) => {
            if (event.data?.source === 'GuidyDashboardToWidget') {
              window.guidyDashboardFixMode = true;
              document
                .getElementById('guidy-widget-btn')
                ?.setAttribute?.('disabled', true);
              handleDashboardMessage(event);
            }
          });
          resolveRules();
          injectSkipButtonDiv();
          injectCommonStyles();
          stopAutoPlayAndAppendControls();
          sendClickEvent(
            [{ event: 'load', type: 'widget' }],
            getAccountKey(cdnUrl)
          );
          sendWebsiteMetrics();
          sendPageViewsEvent(window.location.href);
        })
        .catch((e) => {
          console.log(e);
          console.error('Failed to load widget.');
          sendMessageToDashboard('widgetLoadError', {
            message: e.message,
          });
          // // TODO: Remove when API starts working
          // let config = undefined;
          // // config = widgetConfiguration[`config7`]; // nano
          // // config = widgetConfiguration[`config3`]; // mini
          // if (
          //   localStorage.getItem("widgetConfig") &&
          //   localStorage.getItem("widgetConfig") !== ""
          // ) {
          //   try {
          //     config = JSON.parse(localStorage.getItem("widgetConfig"));
          //   } catch (e) {
          //     console.log(e, ":::::::: e");
          //   }
          // }
          // if (!config) {
          //   // const number = getRandomNumber();
          //   // config = widgetConfiguration[`config${number}`];
          //   config = widgetConfiguration.config1;
          // }
          // if (config) {
          //   setConfig(config);
          // }
          // if (!config?.widgetType || config.widgetType === "full") {
          //   injectDiv();
          // } else {
          //   importContentFile(config);
          // }
        })
        .finally(() => {
          // This 2 options will be added based on flag received from backend
          // injectSkipButtonDiv();
          // injectCommonStyles();
          // stopAutoPlayAndAppendControls();
        });
    }
  }
}

function injectSkipButtonDiv() {
  const modalStyle = document.createElement('style');

  modalStyle.innerHTML = `.woAcc-modal {
    display: flex;
    position: fixed; 
    z-index: 1000000000; 
    left: -100%; 
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto; 
    background-color: rgba(0,0,0,0.4);
    transition: left 0.3s ease; 
  }

  .tabNavigation .woAcc-modal:focus {
    left: 0;
  }

  .woAcc-modal-content {
    position: absolute; 
    top: 20px;
    left: 20px;
    height: fit-content;
    width: 320px;
    background-color: #fff;
    border-radius: 10px;
    border: 2px solid rgb(54, 73, 255);
    box-shadow: 0 0 1px 5px #3649ff47;
  }

  .woAcc-modal-content button {
    border: none;
    background: #fefefe;
    color: black;
    padding: 15px 20px;
    cursor: pointer;
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
  }

  .woAcc-modal-content button span {
    padding:0px 25px 0px 10px;
  }

  .woAcc-modal-content button .enter-container {
    width: 35px;
    display: flex;
    flex-direction: column;
  }

  .woAcc-modal-content button div
  {
    place-self: center;
  }

  .woAcc-modal-content button .enter-container span {
    font-size: 10px;
  }
  
  .layout-icon{
    height: 20px;
    width: 20px;
  }

  .enter-icon{
    height: 15px;
    width: 15px;
    max-width: unset;
  }
  `;

  document.head.appendChild(modalStyle);

  const modal = document.createElement('div');
  modal.className = 'woAcc-modal';
  modal.tabIndex = 0;
  modal.ariaLabel = 'Skip to main content';
  modal.role = 'navigation';

  const modalContent = document.createElement('div');
  modalContent.tabIndex = -1;
  modalContent.className = 'woAcc-modal-content';
  modalContent.innerHTML = `<button tabindex="-1" aria-label="Skip to main content">
      <div>
        <img src="${staticPath}images/layout-icon.svg" height="20px" width="20px" className="layout-icon">
        <span role="button"> Skip to main content </span>
      </div>
      <div class="enter-container"> 
        <span>
        <img src="${staticPath}images/enter-icon.svg" height="20px" width="20px" className="enter-icon" style="max-width: unset;">
        </span>
        <span>Enter</span>
      </div>
     </button>`;
  modal.appendChild(modalContent);

  modal.onkeyup = (e) => {
    e.stopPropagation();
    if (e.keyCode === 13) {
      const element = document.querySelector('main, [role="main"], h1');
      if (element instanceof HTMLElement) {
        element.scrollIntoView({
          behavior: 'smooth',
        });
        element.tabIndex = -1;
        element.focus();
      }
    }
  };

  // rootElement.insertBefore(modal, rootElement.firstChild);
  document.body.insertBefore(modal, document.body.firstChild);
}

function injectCommonStyles() {
  const animationStyling = document.createElement('style');

  animationStyling.innerHTML = `
  html:focus-within {
    scroll-behavior: auto;
  }
  * > :not(#woAcc-RootEle),*::before,*::after > :not(#woAcc-RootEle) {
    animation-duration: 10000ms !important;
    animation-iteration-count: repeat !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .tabNavigation th:focus,
  .tabNavigation video:focus,
  .tabNavigation audio:focus,
  .tabNavigation ul:focus,
  .tabNavigation li:focus,
  .tabNavigation a:focus,
  .tabNavigation input:focus,
  .tabNavigation select:focus,
  .tabNavigation textarea:focus,
  .tabNavigation img:focus,
  .tabNavigation span:focus,
  .tabNavigation button:focus,
  .tabNavigation nav:focus,
  .tabNavigation form:focus,
  .tabNavigation h1:focus,
  .tabNavigation h2:focus,
  .tabNavigation h3:focus,
  .tabNavigation h4:focus,
  .tabNavigation h5:focus,
  .tabNavigation h6:focus {
    border-color: blue !important;
    outline: 2.5px solid blue !important;
    box-shadow: 0px 0px 10px 8px rgba(0, 56, 255, 0.42) !important;
  }`;

  document.head.appendChild(animationStyling);
}

function injectDiv() {
  const rootEleWO = document.createElement('div');

  rootEleWO.textContent = ' ';
  rootEleWO.id = 'woAccessibilityRootEle';

  rootElement.appendChild(rootEleWO);
  var parent = rootElement || document.body;
  var script = document.createElement('script');
  script.src = `${cdnUrl}/${widgetScript}`;
  script.async = true;
  script.type = 'module';
  script.id = 'woAccessibilityScript';
  // #TODO: Add integrity
  // script.integrity = integrityHashes[widgetScript.slice(1)]; // Remove leading slash from widgetScript to match keys in integrityHashes
  parent.appendChild(script);
}

if (!new RegExp('(bot|crawler)', 'i').test(navigator.userAgent)) {
  var woAccConfig = window._WoAccConfig_config;
  if (
    !(
      navigator.userAgent.match(/mobile/i) &&
      woAccConfig &&
      ('false' === woAccConfig.mobile || false === woAccConfig.mobile)
    )
  ) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        return checkAuth();
      });
    } else {
      checkAuth();
    }
  }
}

function stopAutoPlayAndAppendControls() {
  const audioElements = document.querySelectorAll('audio, video');
  Array.from(audioElements).forEach((element) => {
    element.pause();
    element.removeAttribute('autoplay');
    element.setAttribute('controls', true);
  });
}

const onKeyDown = (e) => {
  if (e.key === 'Tab') {
    if (
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey &&
      !document.body.classList.contains('tabNavigation')
    ) {
      document.body.classList.add('tabNavigation');
    }
  }
};

const onClick = (e) => {
  if (e && e.x !== 0 && e.y !== 0) {
    if (document.body.classList.contains('tabNavigation')) {
      document.body.classList.remove('tabNavigation');
    }
  }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('click', onClick);
