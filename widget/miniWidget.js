import {
  getAccountKey,
  getLocalStorage,
  getTranslations,
  isMobileDevice,
  localStorageKey,
  currentConfig,
  languageOptions,
  translateContent,
} from './constants.js';
import { handleContentStateChange } from './content.js';
import { sendAnalyticsEvents } from './service.js';
import { sendWidgetOpenEvent } from './injector.js';

const root = document.createElement('nano-widget');
root.setAttribute('zIndex', 0);
const shadowRoot = root.attachShadow({ mode: 'closed' });
const miniWidget = document.createElement('mini-widget');

const braozaLogo = `${currentConfig.staticPath}images/braoza-logo.png`;
const braozaLogoContainer = document.createElement('div');
const braozaLogoImage = document.createElement('img');
braozaLogoContainer.classList.add('braoza-logo-container');
braozaLogoImage.classList.add('braoza-logo-image');
braozaLogoImage.src = braozaLogo;
braozaLogoContainer.appendChild(braozaLogoImage);

const closeButtonSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.3002 5.70998C18.2077 5.61728 18.0978 5.54373 17.9768 5.49355C17.8559 5.44337 17.7262 5.41754 17.5952 5.41754C17.4643 5.41754 17.3346 5.44337 17.2136 5.49355C17.0926 5.54373 16.9827 5.61728 16.8902 5.70998L12.0002 10.59L7.11022 5.69998C7.01764 5.6074 6.90773 5.53396 6.78677 5.48385C6.6658 5.43375 6.53615 5.40796 6.40522 5.40796C6.27429 5.40796 6.14464 5.43375 6.02368 5.48385C5.90272 5.53396 5.79281 5.6074 5.70022 5.69998C5.60764 5.79256 5.5342 5.90247 5.4841 6.02344C5.43399 6.1444 5.4082 6.27405 5.4082 6.40498C5.4082 6.53591 5.43399 6.66556 5.4841 6.78652C5.5342 6.90749 5.60764 7.0174 5.70022 7.10998L10.5902 12L5.70022 16.89C5.60764 16.9826 5.5342 17.0925 5.4841 17.2134C5.43399 17.3344 5.4082 17.464 5.4082 17.595C5.4082 17.7259 5.43399 17.8556 5.4841 17.9765C5.5342 18.0975 5.60764 18.2074 5.70022 18.3C5.79281 18.3926 5.90272 18.466 6.02368 18.5161C6.14464 18.5662 6.27429 18.592 6.40522 18.592C6.53615 18.592 6.6658 18.5662 6.78677 18.5161C6.90773 18.466 7.01764 18.3926 7.11022 18.3L12.0002 13.41L16.8902 18.3C16.9828 18.3926 17.0927 18.466 17.2137 18.5161C17.3346 18.5662 17.4643 18.592 17.5952 18.592C17.7262 18.592 17.8558 18.5662 17.9768 18.5161C18.0977 18.466 18.2076 18.3926 18.3002 18.3C18.3928 18.2074 18.4662 18.0975 18.5163 17.9765C18.5665 17.8556 18.5922 17.7259 18.5922 17.595C18.5922 17.464 18.5665 17.3344 18.5163 17.2134C18.4662 17.0925 18.3928 16.9826 18.3002 16.89L13.4102 12L18.3002 7.10998C18.6802 6.72998 18.6802 6.08998 18.3002 5.70998Z" fill="black" fill-opacity="0.5"/>
</svg>
`;

const closeButton = document.createElement('div');
closeButton.classList.add('close-button');
closeButton.innerHTML = closeButtonSvg;
closeButton.tabIndex = 0;

const storageConfig = getLocalStorage();
const widgetConf = window.woAccConfig;
if (widgetConf.language && storageConfig) {
  storageConfig.woAccessibilityLang = widgetConf.language;
  localStorage.setItem(localStorageKey, JSON.stringify(storageConfig));
}
let optionDivWrapper;
let isEventSent = false;
let widgetButton;
const { staticPath, cdnUrl } = currentConfig;

const deviceType = isMobileDevice() === true ? 'mobile' : 'desktop';
const position =
  widgetConf?.buttonLocation[deviceType]?.position || 'bottom-right';

const currentValues = {
  invert:
    storageConfig?.colorAdjustments === 'invertColors'
      ? 'invertColors'
      : 'default',
  contrast:
    storageConfig?.contrast === 'darkContrast' ? 'darkContrast' : 'default',
  linkHighlight: storageConfig?.linkHighlight || 'default',
  enlargeText: storageConfig?.enlargeText || 'default',
  stopAnimation: storageConfig?.stopAnimation || 'default',
  font: storageConfig?.font || 'default',
  bigWhiteCursor: storageConfig?.bigWhiteCursor || 'default',
};

const options = [
  {
    key: 'invert',
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 21.997C6.477 21.997 2 17.52 2 11.997C2 6.474 6.477 1.997 12 1.997C17.523 1.997 22 6.474 22 11.997C22 17.52 17.523 21.997 12 21.997ZM12 19.997C14.1217 19.997 16.1566 19.1541 17.6569 17.6539C19.1571 16.1536 20 14.1187 20 11.997C20 9.87527 19.1571 7.84044 17.6569 6.34015C16.1566 4.83985 14.1217 3.997 12 3.997C9.87827 3.997 7.84344 4.83985 6.34315 6.34015C4.84285 7.84044 4 9.87527 4 11.997C4 14.1187 4.84285 16.1536 6.34315 17.6539C7.84344 19.1541 9.87827 19.997 12 19.997ZM12 17.997V5.997C13.5913 5.997 15.1174 6.62914 16.2426 7.75436C17.3679 8.87958 18 10.4057 18 11.997C18 13.5883 17.3679 15.1144 16.2426 16.2396C15.1174 17.3649 13.5913 17.997 12 17.997Z"
          fill="#00499E"
          class="guidy-fill"
        />
      </svg>`,
    title: 'Invert Colors',
    onClick: (e) => handleOptionClick('invert', e),
  },
  {
    key: 'contrast',
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <g clipPath="url(#clip0_1585_985)">
          <path
            d="M19.524 14.7212H19.532C20.176 14.7212 20.807 14.6622 21.418 14.5492L21.355 14.5592C20.209 18.6812 16.489 21.6572 12.074 21.6572H12.016H12.019C6.676 21.6512 2.346 17.3212 2.341 11.9782C2.35353 9.87602 3.04445 7.83311 4.31093 6.15527C5.57742 4.47743 7.35179 3.25335 9.37 2.66516L9.439 2.64816C9.32971 3.24829 9.27548 3.85716 9.277 4.46716V4.47416C9.282 10.1322 13.867 14.7172 19.524 14.7222V14.7212ZM12.006 0.470162C11.8869 0.309424 11.7283 0.182162 11.5456 0.100698C11.3628 0.0192332 11.1622 -0.013674 10.963 0.005162H10.968C4.813 0.596162 0.034 5.72416 0 11.9762V11.9792C0.008 18.6142 5.385 23.9912 12.019 24.0002H12.08C18.323 24.0002 23.447 19.2142 23.985 13.1112L23.988 13.0662C24.0052 12.8762 23.9757 12.685 23.9019 12.5091C23.8282 12.3332 23.7125 12.178 23.565 12.0572L23.563 12.0552C23.4141 11.9326 23.2371 11.849 23.0479 11.8119C22.8587 11.7747 22.6632 11.7851 22.479 11.8422L22.487 11.8402L21.963 11.9962C21.1771 12.2538 20.355 12.3838 19.528 12.3812H19.521C17.4257 12.3788 15.4169 11.5454 13.9354 10.0638C12.4538 8.58221 11.6204 6.57344 11.618 4.47816V4.46016C11.618 3.43016 11.816 2.44616 12.176 1.54516L12.157 1.59816C12.2305 1.41171 12.2549 1.20948 12.2278 1.0109C12.2006 0.812309 12.1229 0.624037 12.002 0.464162L12.004 0.467162L12.006 0.470162Z"
            fill="#00499E"
            class="guidy-fill"
          />
        </g>
        <defs>
          <clipPath id="clip0_1585_985">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>`,
    title: 'Dark Contrast',
    onClick: (e) => handleOptionClick('contrast', e),
  },
  {
    key: 'linkHighlight',
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M11.6628 4.91249L13.5378 3.03749C14.0253 2.54996 14.6041 2.16323 15.2411 1.89938C15.8781 1.63553 16.5608 1.49973 17.2503 1.49973C17.9397 1.49973 18.6225 1.63553 19.2595 1.89938C19.8964 2.16323 20.4752 2.54996 20.9628 3.03749C21.4503 3.52503 21.837 4.10381 22.1009 4.7408C22.3647 5.37779 22.5005 6.06052 22.5005 6.74999C22.5005 7.43947 22.3647 8.12219 22.1009 8.75918C21.837 9.39618 21.4503 9.97496 20.9628 10.4625L17.2128 14.2125C16.7253 14.7001 16.1465 15.0868 15.5095 15.3507C14.8725 15.6146 14.1898 15.7504 13.5003 15.7504C12.8108 15.7504 12.128 15.6146 11.4911 15.3507C10.8541 15.0868 10.2753 14.7001 9.78777 14.2125C9.5888 13.9993 9.48041 13.7171 9.48545 13.4255C9.49049 13.134 9.60856 12.8557 9.81477 12.6495C10.021 12.4433 10.2992 12.3252 10.5908 12.3202C10.8824 12.3151 11.1645 12.4235 11.3778 12.6225C11.6564 12.9014 11.9873 13.1227 12.3514 13.2737C12.7156 13.4246 13.106 13.5024 13.5003 13.5024C13.8945 13.5024 14.2849 13.4246 14.6491 13.2737C15.0133 13.1227 15.3441 12.9014 15.6228 12.6225L19.3728 8.87249C19.9083 8.30407 20.2013 7.54938 20.1897 6.76851C20.1781 5.98763 19.8627 5.24201 19.3105 4.68978C18.7583 4.13756 18.0126 3.82219 17.2318 3.81056C16.4509 3.79893 15.6962 4.09196 15.1278 4.62749L13.2528 6.50249C13.0395 6.70146 12.7574 6.80985 12.4658 6.80481C12.1742 6.79977 11.896 6.6817 11.6898 6.47549C11.4836 6.26927 11.3655 5.99104 11.3605 5.69945C11.3554 5.40786 11.4638 5.12571 11.6628 4.91249ZM4.62777 19.3725C4.90639 19.6514 5.23725 19.8727 5.60145 20.0237C5.96564 20.1746 6.35602 20.2524 6.75027 20.2524C7.14451 20.2524 7.53489 20.1746 7.89909 20.0237C8.26328 19.8727 8.59415 19.6514 8.87277 19.3725L10.7478 17.4975C10.961 17.2985 11.2431 17.1901 11.5347 17.1952C11.8263 17.2002 12.1045 17.3183 12.3108 17.5245C12.517 17.7307 12.635 18.0089 12.6401 18.3005C12.6451 18.5921 12.5367 18.8743 12.3378 19.0875L10.4628 20.9625C9.97523 21.45 9.39645 21.8368 8.75946 22.1006C8.12247 22.3645 7.43974 22.5003 6.75027 22.5003C6.06079 22.5003 5.37807 22.3645 4.74108 22.1006C4.10409 21.8368 3.5253 21.45 3.03777 20.9625C2.55024 20.475 2.1635 19.8962 1.89965 19.2592C1.6358 18.6222 1.5 17.9395 1.5 17.25C1.5 16.5605 1.6358 15.8778 1.89965 15.2408C2.1635 14.6038 2.55024 14.025 3.03777 13.5375L6.78777 9.78749C7.27528 9.29993 7.85406 8.91317 8.49106 8.6493C9.12805 8.38543 9.81078 8.24961 10.5003 8.24961C11.1898 8.24961 11.8725 8.38543 12.5095 8.6493C13.1465 8.91317 13.7253 9.29993 14.2128 9.78749C14.4117 10.0007 14.5201 10.2829 14.5151 10.5744C14.51 10.866 14.392 11.1443 14.1858 11.3505C13.9795 11.5567 13.7013 11.6748 13.4097 11.6798C13.1181 11.6848 12.836 11.5765 12.6228 11.3775C12.3441 11.0986 12.0133 10.8773 11.6491 10.7263C11.2849 10.5753 10.8945 10.4976 10.5003 10.4976C10.106 10.4976 9.71564 10.5753 9.35145 10.7263C8.98725 10.8773 8.65639 11.0986 8.37777 11.3775L4.62777 15.1275C4.34884 15.4061 4.12756 15.737 3.97659 16.1012C3.82562 16.4654 3.74791 16.8557 3.74791 17.25C3.74791 17.6442 3.82562 18.0346 3.97659 18.3988C4.12756 18.763 4.34884 19.0939 4.62777 19.3725Z"
          fill="#00499E"
          class="guidy-fill"
        />
      </svg>`,
    title: 'Highlight Links',
    onClick: (e) => handleOptionClick('linkHighlight', e),
  },
  {
    key: 'enlargeText',
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M13 18L8 6L3 18M11 14H5M21 18V15M21 15V12M21 15C21 15.7956 20.6839 16.5587 20.1213 17.1213C19.5587 17.6839 18.7956 18 18 18C17.2044 18 16.4413 17.6839 15.8787 17.1213C15.3161 16.5587 15 15.7956 15 15C15 14.2044 15.3161 13.4413 15.8787 12.8787C16.4413 12.3161 17.2044 12 18 12C18.7956 12 19.5587 12.3161 20.1213 12.8787C20.6839 13.4413 21 14.2044 21 15Z"
          stroke="#00499E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          class="guidy-stroke"
        />
      </svg>`,
    title: 'Bigger Text',
    onClick: (e) => handleOptionClick('enlargeText', e),
  },
  {
    key: 'stopAnimation',
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 2H2V14H4V4H14V2H4ZM6 6H18V8H8V18H6V6ZM10 10H22V22H10V10ZM20 20V12H12V20H20Z"
          fill="#00499E"
          class="guidy-fill"
        />
      </svg>`,
    title: 'Pause Animations',
    onClick: (e) => handleOptionClick('stopAnimation', e),
  },
  {
    key: 'font',
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M13 18L8 6L3 18M11 14H5M21 18V15M21 15V12M21 15C21 15.7956 20.6839 16.5587 20.1213 17.1213C19.5587 17.6839 18.7956 18 18 18C17.2044 18 16.4413 17.6839 15.8787 17.1213C15.3161 16.5587 15 15.7956 15 15C15 14.2044 15.3161 13.4413 15.8787 12.8787C16.4413 12.3161 17.2044 12 18 12C18.7956 12 19.5587 12.3161 20.1213 12.8787C20.6839 13.4413 21 14.2044 21 15Z"
          stroke="#00499E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          class="guidy-stroke"
        />
      </svg>`,
    title: 'Legible Fonts',
    onClick: (e) => handleOptionClick('font', e),
  },
  {
    key: 'bigWhiteCursor',
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <g clipPath="url(#clip0_1585_1017)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.27112 0.277716C6.60028 0.18973 6.95091 0.235998 7.24598 0.406356C7.54106 0.576715 7.75644 0.857231 7.84483 1.18629L8.61455 4.05429C8.65833 4.2175 8.66954 4.38774 8.64754 4.55529C8.62553 4.72284 8.57074 4.88441 8.48629 5.03078C8.31574 5.32639 8.03475 5.54214 7.70512 5.63057C7.37549 5.719 7.02424 5.67287 6.72863 5.50232C6.43302 5.33177 6.21726 5.05077 6.12883 4.72114L5.36426 1.85143C5.32044 1.68833 5.30918 1.51819 5.33113 1.35074C5.35307 1.18328 5.4078 1.02179 5.49217 0.87549C5.57654 0.72919 5.68891 0.600945 5.82286 0.498083C5.95681 0.395221 6.10971 0.319757 6.27283 0.276002L6.27112 0.277716ZM0.12369 6.43714C0.0357042 6.76631 0.0819722 7.11694 0.25233 7.41201C0.422689 7.70708 0.703205 7.92247 1.03226 8.01086L3.90026 8.77886C4.06534 8.82934 4.2389 8.84607 4.41058 8.82803C4.58226 8.81 4.74856 8.75758 4.89954 8.67389C5.05053 8.59021 5.18312 8.47697 5.2894 8.34094C5.39569 8.20491 5.47349 8.04887 5.51817 7.88213C5.56285 7.71538 5.57349 7.54135 5.54947 7.3704C5.52544 7.19945 5.46723 7.0351 5.37832 6.88713C5.2894 6.73916 5.1716 6.61061 5.03194 6.50915C4.89228 6.40769 4.73361 6.33539 4.5654 6.29657L1.6974 5.52686C1.36824 5.43887 1.01761 5.48514 0.722538 5.6555C0.427465 5.82586 0.212078 6.10637 0.12369 6.43543V6.43714ZM7.66655 9.80572C7.56601 9.50384 7.55146 9.17995 7.62454 8.87028C7.69762 8.56061 7.85544 8.27739 8.08034 8.05232C8.30523 7.82725 8.58833 7.66921 8.89794 7.59588C9.20755 7.52256 9.53145 7.53684 9.8334 7.63714L22.0391 11.7086C23.6163 12.2349 23.5957 14.472 22.0083 14.9691L18.5351 16.0611L23.1637 20.6897C23.4851 21.0114 23.6656 21.4476 23.6655 21.9023C23.6653 22.3571 23.4845 22.7931 23.1628 23.1146C22.8412 23.436 22.405 23.6165 21.9502 23.6163C21.4955 23.6162 21.0594 23.4354 20.738 23.1137L16.0991 18.4731L14.9985 21.9806C14.5014 23.5663 12.2625 23.5869 11.7363 22.0097L7.66483 9.804L7.66655 9.80572ZM3.54198 15.0086C3.42343 15.1314 3.2816 15.2294 3.12477 15.2969C2.96794 15.3644 2.79925 15.3999 2.62854 15.4015C2.45782 15.403 2.2885 15.3706 2.13046 15.306C1.97243 15.2414 1.82883 15.146 1.70805 15.0254C1.58728 14.9047 1.49174 14.7612 1.42702 14.6032C1.3623 14.4452 1.32969 14.276 1.33109 14.1052C1.33249 13.9345 1.36788 13.7658 1.43519 13.6089C1.5025 13.452 1.60038 13.3101 1.72312 13.1914L3.82483 11.0914C4.06856 10.8643 4.39093 10.7407 4.72401 10.7466C5.0571 10.7524 5.37491 10.8874 5.61047 11.1229C5.84604 11.3585 5.98097 11.6763 5.98685 12.0094C5.99272 12.3425 5.86908 12.6648 5.64198 12.9086L3.54198 15.0086ZM14.6163 3.70972C14.8506 3.46734 14.9803 3.14262 14.9776 2.80551C14.9748 2.4684 14.8397 2.14586 14.6015 1.90736C14.3632 1.66887 14.0408 1.5335 13.7037 1.53041C13.3666 1.52733 13.0417 1.65677 12.7991 1.89086L10.6974 3.99086C10.4633 4.23346 10.3339 4.55829 10.337 4.8954C10.34 5.23251 10.4754 5.55492 10.7139 5.7932C10.9524 6.03147 11.2749 6.16653 11.6121 6.1693C11.9492 6.17207 12.2739 6.04232 12.5163 5.808L14.6163 3.70972Z"
            fill="#00499E"
            class="guidy-fill"
          />
        </g>
        <defs>
          <clipPath id="clip0_1585_1017">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>`,
    title: 'Big Cursor',
    onClick: (e) => handleOptionClick('bigWhiteCursor', e),
  },
];

function handleResetAll() {
  Object.keys(currentValues).forEach((key) => {
    currentValues[key] = 'default';
    handleContentStateChange(
      key === 'invert' ? 'colorAdjustments' : key,
      'default'
    );
  });
  const options = optionDivWrapper.querySelectorAll('button');
  Array.from(options).forEach((button) => {
    button.classList.remove('active');
  });
}

function handleOptionClick(key, e) {
  let isToggle = false;
  let newValue = 'default';
  if (currentValues[key] === 'default') {
    switch (key) {
      case 'invert':
        if (currentValues['contrast'] !== 'default') {
          currentValues['contrast'] = 'default';
          handleContentStateChange('contrast', 'default');
        }
        isToggle = true;
        newValue = 'invertColors';
        break;
      case 'contrast':
        if (currentValues['invert'] !== 'default') {
          currentValues['invert'] = 'default';
          handleContentStateChange('colorAdjustments', 'default');
        }
        isToggle = true;
        newValue = 'darkContrast';
        break;
      case 'linkHighlight':
        newValue = 'linkHighlight';
        break;
      case 'enlargeText':
        newValue = 'large1';
        break;
      case 'stopAnimation':
        newValue = 'stopAnimation';
        break;
      case 'font':
        newValue = 'readableFont';
        break;
      case 'bigWhiteCursor':
        newValue = 'bigWhiteCursor';
        break;
    }
    currentValues[key] = newValue;
    e.target.classList.add('active');
    sendAnalyticsEvents(
      {
        name: key === 'invert' ? 'colorAdjustments' : key,
        currentActive: newValue,
      },
      getAccountKey(cdnUrl)
    );
  } else {
    currentValues[key] = 'default';
    e.target.classList.remove('active');
  }
  handleContentStateChange(
    key === 'invert' ? 'colorAdjustments' : key,
    newValue
  );
  if (isToggle) {
    let sibling;
    if (key === 'invert') {
      sibling = e.target.nextElementSibling;
    } else {
      sibling = e.target.previousElementSibling;
    }
    sibling.classList.remove('active');
  }
}

function widgetPositionResolver(miniWidget, config) {
  switch (position) {
    case 'top-left':
    case 'top-middle':
      miniWidget.style.left = '0px';
      miniWidget.style.top = '5%';
      break;
    case 'top-right':
      miniWidget.style.right = '0px';
      miniWidget.style.top = '5%';
      break;
    case 'middle-left':
      miniWidget.style.left = '0px';
      miniWidget.style.top = 'calc(50% - 293px)';
      break;
    case 'middle-right':
      miniWidget.style.right = '0px';
      miniWidget.style.top = 'calc(50% - 293px)';
      break;
    case 'bottom-left':
      miniWidget.style.left = '0px';
      miniWidget.style.bottom = '5%';
      break;
    case 'bottom-middle':
    case 'bottom-right':
      miniWidget.style.right = '0px';
      miniWidget.style.bottom = '5%';
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
    miniWidget.style.transform = `translate(${x}px, ${y}px)`;
  }
}

function injectMiniWidgetCss() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = widgetConf?.isWoTestExists
    ? `${cdnUrl}/Css/mini.css`
    : `${staticPath}css/mini.css`;
  shadowRoot.appendChild(link);
}

function appendIcon(widgetButton) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('icon-wrapper');
  const accIconInButton = document.createElement('img');
  Object.assign(accIconInButton.style, {
    transition: 'transform 0.15s ease 0s',
    height: '80%',
    width: '80%',
  });
  accIconInButton.src = iconResolver();
  wrapper.appendChild(accIconInButton);
  widgetButton.appendChild(wrapper);
}

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
  return icons[widgetConf.buttonIcon] ?? icons['icon-chair'];
}

function getIconSpan(icon) {
  const span = document.createElement('span');
  span.classList.add('icon-span');
  span.innerHTML = icon;
  return span;
}

function getTitleSpan(title) {
  const span = document.createElement('span');
  span.setAttribute('data-translate', title);
  span.innerText = title;
  return span;
}

function creationOptionButton({ key, icon, title, onClick }) {
  const optionButton = document.createElement('button');
  optionButton.setAttribute('aria-label', title);
  optionButton.classList.add('option-btn');
  if (key && currentValues[key] !== 'default') {
    optionButton.classList.add('active');
  }
  const iconSpan = getIconSpan(icon);
  const titleSpan = getTitleSpan(title);
  optionButton.onclick = (e) => onClick(e);
  optionButton.appendChild(iconSpan);
  optionButton.appendChild(titleSpan);
  return optionButton;
}

function createLangSelector() {
  const activeLang = () =>
    storageConfig?.woAccessibilityLang || widgetConf?.language || 'en';
  const svgParser = new DOMParser();

  const wrapper = document.createElement('div');
  wrapper.classList.add('lang-selector-wrapper');

  const btn = document.createElement('button');
  btn.classList.add('lang-btn');
  btn.setAttribute('aria-label', 'Select language');

  const btnInner = document.createElement('span');
  btnInner.classList.add('lang-btn-inner');
  btnInner.textContent = activeLang().slice(0, 2).toUpperCase();
  btn.appendChild(btnInner);

  const dropdown = document.createElement('div');
  dropdown.classList.add('lang-dropdown');

  const searchContainer = document.createElement('div');
  searchContainer.classList.add('lang-search-container');

  const searchWrapper = document.createElement('div');
  searchWrapper.classList.add('lang-search-input-wrapper');

  const searchIconSpan = document.createElement('span');
  searchIconSpan.classList.add('lang-search-icon');
  searchIconSpan.appendChild(
    svgParser.parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6.67908563 12.3581713c3.13647239 0 5.67908567-2.54261328 5.67908567-5.67908567S9.81555802 1 6.67908563 1 1 3.54261324 1 6.67908563s2.54261324 5.67908567 5.67908563 5.67908567ZM15 15l-4.13033661-4.13033661"/></svg>',
      'image/svg+xml'
    ).documentElement
  );

  const searchInput = document.createElement('input');
  searchInput.classList.add('lang-search-input');
  searchInput.type = 'text';
  searchInput.placeholder = getTranslations('Search language');
  searchInput.setAttribute('data-translate', 'Search language');

  searchWrapper.appendChild(searchIconSpan);
  searchWrapper.appendChild(searchInput);
  searchContainer.appendChild(searchWrapper);

  const list = document.createElement('ul');
  list.classList.add('lang-list');

  const checkSvgStr =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">' +
    '<path d="M14.1667 2.5H5.83333C3.99238 2.5 2.5 3.99238 2.5 5.83333V14.1667C2.5 16.0076 3.99238 17.5 5.83333 17.5H14.1667C16.0076 17.5 17.5 16.0076 17.5 14.1667V5.83333C17.5 3.99238 16.0076 2.5 14.1667 2.5Z" stroke="#1593EF" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M7.5 9.9987L9.375 11.6654L12.5 8.33203" stroke="#1593EF" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function renderList(filter) {
    while (list.firstChild) list.removeChild(list.firstChild);
    const current = activeLang();
    const filtered = languageOptions.filter((opt) =>
      opt.label.toLowerCase().includes(filter.toLowerCase())
    );
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.classList.add('lang-empty');
      empty.textContent = 'No language found';
      list.appendChild(empty);
      return;
    }
    filtered.forEach((lang) => {
      const isSelected = lang.value === current;
      const item = document.createElement('li');
      item.classList.add('lang-item');
      if (isSelected) item.classList.add('selected');

      const codeCircle = document.createElement('span');
      codeCircle.classList.add('lang-code-circle');
      if (isSelected) codeCircle.classList.add('selected-code');
      codeCircle.textContent = lang.value.slice(0, 2).toUpperCase();

      const nameSpan = document.createElement('span');
      nameSpan.classList.add('lang-name');
      nameSpan.textContent = lang.label;

      item.appendChild(codeCircle);
      item.appendChild(nameSpan);
      if (isSelected) {
        item.appendChild(
          svgParser.parseFromString(checkSvgStr, 'image/svg+xml').documentElement
        );
      }
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (storageConfig) {
          storageConfig.woAccessibilityLang = lang.value;
          localStorage.setItem(localStorageKey, JSON.stringify(storageConfig));
        }
        btnInner.textContent = lang.value.slice(0, 2).toUpperCase();
        translateContent(miniWidget);
        dropdown.classList.remove('open');
      });
      list.appendChild(item);
    });
  }

  renderList('');
  searchInput.addEventListener('input', () => renderList(searchInput.value));

  dropdown.appendChild(searchContainer);
  dropdown.appendChild(list);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const opening = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open', opening);
    if (opening) {
      searchInput.value = '';
      renderList('');
      searchInput.focus();
    }
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));
  dropdown.addEventListener('click', (e) => e.stopPropagation());

  wrapper.appendChild(btn);
  wrapper.appendChild(dropdown);
  return wrapper;
}

function appendOptionsDiv() {
  optionDivWrapper = document.createElement('div');
  optionDivWrapper.classList.add('options-div-wrapper');

  if (isLeftPositionedWidget()) {
    optionDivWrapper.style.right = '100%';
  } else {
    optionDivWrapper.style.left = '100%';
  }

  const contentParent = document.createElement('div');
  contentParent.classList.add('content-div-wrapper');

  // header
  const header = document.createElement('div');
  header.appendChild(braozaLogoContainer);
  const headerRight = document.createElement('div');
  headerRight.classList.add('header-right');
  headerRight.appendChild(createLangSelector());
  headerRight.appendChild(closeButton);
  closeButton.onclick = () => handleWidgetButtonClick(widgetButton);
  header.appendChild(headerRight);
  header.style.background = widgetConf.buttonColor.value;
  header.classList.add('header');
  contentParent.appendChild(header);

  // Options Div
  const optionsDiv = document.createElement('div');
  optionsDiv.classList.add('options-div');
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const optionElement = creationOptionButton(option);
    optionsDiv.appendChild(optionElement);
  }
  contentParent.appendChild(optionsDiv);
  miniWidget.appendChild(optionDivWrapper);

  // Footer
  createFooter(contentParent);

  optionDivWrapper.appendChild(contentParent);
}

function createFooter(parent) {
  const footer = document.createElement('div');
  footer.classList.add('footer');
  footer.style.background = widgetConf.buttonColor.value;

  const resetBtn = document.createElement('button');
  resetBtn.classList.add('footer-reset-btn');
  resetBtn.setAttribute('aria-label', 'Reset All');
  resetBtn.onclick = () => handleResetAll();

  const svgParser = new DOMParser();
  const svgDoc = svgParser.parseFromString(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">' +
    '<g clip-path="url(#fc)">' +
    '<path d="M23.154 14.4C23.2656 14.3998 23.376 14.4218 23.4791 14.4645C23.5821 14.5073 23.6756 14.57 23.7543 14.6491C23.8329 14.7282 23.8952 14.8221 23.9373 14.9254C23.9795 15.0287 24.0008 15.1393 24 15.2508V19.0956C24.0008 19.2066 23.9797 19.3167 23.9379 19.4196C23.8961 19.5225 23.8344 19.6161 23.7564 19.6952C23.6784 19.7742 23.5856 19.837 23.4832 19.8801C23.3809 19.9233 23.2711 19.9458 23.16 19.9464C23.049 19.9458 22.9391 19.9233 22.8368 19.8801C22.7345 19.837 22.6416 19.7742 22.5636 19.6952C22.4856 19.6161 22.4239 19.5225 22.3821 19.4196C22.3403 19.3167 22.3192 19.2066 22.32 19.0956V17.7456C20.1348 21.4128 16.0788 24 11.7084 24C6.41642 24 1.98122 20.7348 0.0576213 15.702C-0.0231455 15.4923 -0.0180571 15.2593 0.0717844 15.0533C0.161626 14.8473 0.328988 14.685 0.537621 14.6016C0.969621 14.4324 1.45682 14.6496 1.62482 15.0876C3.30482 19.482 7.13042 22.2996 11.7084 22.2996C15.7536 22.2996 19.5324 19.6812 21.2928 16.1148L19.5276 16.1268C19.4166 16.127 19.3066 16.1052 19.204 16.0628C19.1013 16.0205 19.0081 15.9583 18.9295 15.8798C18.8509 15.8013 18.7886 15.7081 18.746 15.6056C18.7035 15.503 18.6816 15.393 18.6816 15.282C18.6787 15.0578 18.765 14.8417 18.9213 14.681C19.0777 14.5204 19.2915 14.4284 19.5156 14.4252L23.154 14.4ZM12.294 0C17.5836 0 22.02 3.2652 23.9436 8.298C24.0244 8.50769 24.0193 8.74075 23.9295 8.94671C23.8396 9.15267 23.6723 9.31495 23.4636 9.3984C23.3604 9.43866 23.2502 9.458 23.1394 9.45531C23.0287 9.45263 22.9195 9.42796 22.8184 9.38274C22.7172 9.33752 22.6261 9.27266 22.5502 9.19192C22.4743 9.11118 22.4153 9.01616 22.3764 8.9124C20.6964 4.518 16.8708 1.7004 12.2928 1.7004C8.24762 1.7004 4.46882 4.3188 2.70842 7.8852L4.47362 7.8732C4.58466 7.87304 4.69465 7.89478 4.79728 7.93716C4.89992 7.97955 4.99319 8.04175 5.07176 8.12021C5.15034 8.19867 5.21267 8.29186 5.2552 8.39443C5.29773 8.49701 5.31962 8.60696 5.31962 8.718C5.32251 8.94217 5.23629 9.15833 5.07992 9.31898C4.92354 9.47963 4.70979 9.57164 4.48562 9.5748L0.846021 9.6C0.734473 9.60016 0.623997 9.57823 0.520969 9.53547C0.417942 9.49271 0.324402 9.42997 0.245749 9.35087C0.167096 9.27177 0.104886 9.17788 0.0627107 9.07461C0.0205353 8.97134 -0.000771049 8.86075 2.13152e-05 8.7492V4.9044C2.13152e-05 4.434 0.375621 4.0536 0.840021 4.0536C1.30322 4.0536 1.68002 4.434 1.68002 4.9044V6.2544C3.86522 2.5872 7.92122 0 12.2916 0" fill="white"/>' +
    '</g><defs><clipPath id="fc"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>',
    'image/svg+xml'
  );
  const resetIcon = document.createElement('span');
  resetIcon.classList.add('footer-reset-icon');
  resetIcon.appendChild(svgDoc.documentElement);

  const resetText = document.createElement('span');
  resetText.setAttribute('data-translate', 'Reset All');
  resetText.innerText = 'Reset All';

  resetBtn.appendChild(resetIcon);
  resetBtn.appendChild(resetText);
  footer.appendChild(resetBtn);
  parent.appendChild(footer);
}

function alignButtonVertically(widgetButton) {
  switch (position) {
    case 'top-left':
    case 'top-middle':
    case 'top-right':
    case 'middle-left':
    case 'middle-right':
      widgetButton.style.top = '80px';
      break;

    case 'bottom-left':
    case 'bottom-middle':
    case 'bottom-right':
      widgetButton.style.bottom = '72px';
      break;
  }
}

function insertWidgetAndMenu() {
  // Appending Widget Button
  widgetButton = document.createElement('button');
  widgetButton.classList.add('widget-button');
  widgetButton.setAttribute('id', 'widget-button');
  widgetButton.style.background = widgetConf.buttonColor.value;
  appendIcon(widgetButton);
  widgetButton.onclick = () => handleWidgetButtonClick(widgetButton);
  if (isLeftPositionedWidget()) {
    widgetButton.classList.add('border-radius-right');
    widgetButton.style.left = '0px';
  } else {
    widgetButton.classList.add('border-radius-left');
    widgetButton.style.right = '0px';
  }
  alignButtonVertically(widgetButton);
  miniWidget.append(widgetButton);

  // Appending Options Div
  appendOptionsDiv();
}

function handleWidgetButtonClick(widgetButton) {
  if (!isEventSent) {
    sendWidgetOpenEvent();
    isEventSent = true;
  }
  const isOpen = optionDivWrapper.classList.contains('open');
  if (isLeftPositionedWidget()) {
    if (isOpen) {
      widgetButton.style.left = '0px';
      optionDivWrapper.style.right = '100%';
      optionDivWrapper.classList.remove('open');
    } else {
      widgetButton.style.left = '320px';
      optionDivWrapper.style.right = '0%';
      optionDivWrapper.classList.add('open');
    }
  } else {
    if (isOpen) {
      widgetButton.style.right = '0px';
      optionDivWrapper.style.left = '100%';
      optionDivWrapper.classList.remove('open');
    } else {
      widgetButton.style.right = '320px';
      optionDivWrapper.style.left = '0%';
      optionDivWrapper.classList.add('open');
    }
  }
  if (isOpen) {
    optionDivWrapper.addEventListener(
      'transitionend',
      () => {
        root.style.height = '0';
        root.style.width = '0';
        miniWidget.style.height = '0';
        miniWidget.style.width = '0';
      },
      { once: true }
    );
  } else {
    root.style.height = 'auto';
    root.style.width = 'auto';
    miniWidget.style.height = 'auto';
    miniWidget.style.width = 'auto';
  }
}

function isLeftPositionedWidget() {
  if (
    position === 'top-left' ||
    position === 'top-middle' ||
    position === 'bottom-left' ||
    position === 'middle-left'
  ) {
    return true;
  }
  return false;
}

const addShortCut = (e) => {
  if (e.ctrlKey && e.code === 'KeyU') {
    e.preventDefault();
    e.stopPropagation();
    widgetButton.click();
  }
};

export function loadWidget() {
  Object.assign(root.style, {
    position: 'fixed',
    display: 'flex',
    'justify-content': 'flex-end',
    'text-align': 'center',
    'align-items': 'center',
    zIndex: '10000000',
    height: '0',
    width: '0',
  });
  miniWidget.style.height = '0';
  miniWidget.style.width = '0';
  widgetPositionResolver(root, widgetConf);
  injectMiniWidgetCss();
  insertWidgetAndMenu();
  shadowRoot.appendChild(miniWidget);
  document.body.insertBefore(root, document.body.firstChild);
  for (const option of options) {
    getTranslations(option.title, miniWidget);
  }
  getTranslations('Reset All', miniWidget);
  getTranslations('Search language', miniWidget);

  window.addEventListener('keydown', addShortCut);
}
