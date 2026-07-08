import {
  getAccountKey,
  getLocalStorage,
  getTranslations,
  isMobileDevice,
  currentConfig,
} from './constants.js';
import { handleContentStateChange } from './content.js';
import { sendAnalyticsEvents } from './service.js';

const root = document.createElement('nano-widget');
root.setAttribute('zIndex', 0);
const shadowRoot = root.attachShadow({ mode: 'closed' });
const nanoWidget = document.createElement('nano-widget');

const storageConfig = getLocalStorage();

const braozaLogoSVG = `<svg width="97" height="33" viewBox="0 0 97 33" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_882_9139)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M12.172 0.357761C12.3019 0.0815146 12.6942 0.0815166 12.8239 0.357552L15.103 5.20612C15.1833 5.37671 15.1197 5.55199 14.9941 5.64773C14.7932 5.80076 14.5428 5.59623 14.3517 5.43117C14.0333 5.15618 13.4967 4.74708 13.0211 4.64588C12.4373 4.52166 11.8282 4.64791 11.3417 4.99399L10.4728 5.61201C10.4 5.66383 10.3224 5.7168 10.2332 5.72101C9.97951 5.73296 9.7716 5.46415 9.89267 5.20609L12.172 0.357761Z" fill="#1593EF"/>
<mask id="path-2-inside-1_882_9139" fill="white">
<path d="M17.2124 8.98553C17.4922 8.44797 18.1587 8.2348 18.6653 8.56738C20.4036 9.70863 21.7886 11.3263 22.6479 13.2378C23.6579 15.4845 23.8829 18.0061 23.2867 20.3964C22.6905 22.7867 21.3078 24.9065 19.3613 26.4141C17.4149 27.9217 15.018 28.7295 12.5571 28.7071C10.0961 28.6847 7.71436 27.8336 5.79556 26.2908C3.87676 24.7481 2.53268 22.6035 1.9799 20.2028C1.42713 17.8021 1.69785 15.2849 2.74844 13.057C3.64228 11.1614 5.05637 9.56918 6.8151 8.45971C7.32764 8.13638 7.99015 8.36162 8.26013 8.90416C8.52977 9.44604 8.30453 10.0984 7.80079 10.434C6.47847 11.3148 5.41393 12.5432 4.73006 13.9934C3.88958 15.7758 3.67301 17.7895 4.11523 19.7101C4.55745 21.6307 5.63271 23.3463 7.16775 24.5805C8.70279 25.8147 10.6082 26.4956 12.577 26.5135C14.5457 26.5314 16.4632 25.8852 18.0204 24.6791C19.5775 23.473 20.6837 21.7772 21.1607 19.865C21.6377 17.9527 21.4576 15.9354 20.6496 14.1381C19.9922 12.6756 18.9501 11.4281 17.6439 10.5234C17.1463 10.1788 16.933 9.52241 17.2124 8.98553Z"/>
</mask>
<path d="M17.2124 8.98553C17.4922 8.44797 18.1587 8.2348 18.6653 8.56738C20.4036 9.70863 21.7886 11.3263 22.6479 13.2378C23.6579 15.4845 23.8829 18.0061 23.2867 20.3964C22.6905 22.7867 21.3078 24.9065 19.3613 26.4141C17.4149 27.9217 15.018 28.7295 12.5571 28.7071C10.0961 28.6847 7.71436 27.8336 5.79556 26.2908C3.87676 24.7481 2.53268 22.6035 1.9799 20.2028C1.42713 17.8021 1.69785 15.2849 2.74844 13.057C3.64228 11.1614 5.05637 9.56918 6.8151 8.45971C7.32764 8.13638 7.99015 8.36162 8.26013 8.90416C8.52977 9.44604 8.30453 10.0984 7.80079 10.434C6.47847 11.3148 5.41393 12.5432 4.73006 13.9934C3.88958 15.7758 3.67301 17.7895 4.11523 19.7101C4.55745 21.6307 5.63271 23.3463 7.16775 24.5805C8.70279 25.8147 10.6082 26.4956 12.577 26.5135C14.5457 26.5314 16.4632 25.8852 18.0204 24.6791C19.5775 23.473 20.6837 21.7772 21.1607 19.865C21.6377 17.9527 21.4576 15.9354 20.6496 14.1381C19.9922 12.6756 18.9501 11.4281 17.6439 10.5234C17.1463 10.1788 16.933 9.52241 17.2124 8.98553Z" fill="black" stroke="black" stroke-width="4" mask="url(#path-2-inside-1_882_9139)"/>
<rect x="11.3435" y="5.07678" width="2.43084" height="14.5855" rx="1.21542" fill="black"/>
<ellipse cx="12.5578" cy="17.5354" rx="2.43084" ry="2.43091" fill="#1593EF"/>
<path d="M29.1386 23.3538L31.5534 8.8083H37.1216C38.1727 8.8083 39.0202 8.97402 39.6642 9.30546C40.3081 9.63217 40.7556 10.0796 41.0065 10.6478C41.2622 11.216 41.3285 11.8599 41.2054 12.5796C41.1059 13.1667 40.9071 13.671 40.6088 14.0924C40.3152 14.5091 39.9554 14.85 39.5292 15.1151C39.1031 15.3755 38.6462 15.5626 38.1585 15.6762L38.1301 15.8182C38.6414 15.8419 39.1102 15.9982 39.5363 16.287C39.9625 16.5758 40.2844 16.983 40.5022 17.5086C40.72 18.0294 40.7698 18.6568 40.6514 19.3907C40.5235 20.1435 40.2276 20.8206 39.7636 21.4219C39.2996 22.0185 38.6699 22.4896 37.8744 22.8353C37.0837 23.1809 36.1343 23.3538 35.0264 23.3538H29.1386ZM32.1429 21.1521H34.9767C35.9284 21.1521 36.6481 20.9698 37.1358 20.6052C37.6235 20.2359 37.9146 19.7624 38.0093 19.1847C38.0804 18.7539 38.0378 18.3656 37.8815 18.02C37.7253 17.6696 37.4672 17.395 37.1074 17.1961C36.7475 16.9925 36.2977 16.8907 35.7579 16.8907H32.846L32.1429 21.1521ZM33.1727 14.9944H35.7792C36.2338 14.9944 36.6552 14.9115 37.0434 14.7458C37.4364 14.5754 37.7631 14.3362 38.0235 14.0285C38.2887 13.716 38.4521 13.3467 38.5136 12.9205C38.613 12.3571 38.4947 11.8931 38.1585 11.5285C37.8223 11.1639 37.2683 10.9816 36.4966 10.9816H33.8261L33.1727 14.9944ZM42.1695 23.3538L43.9877 12.4447H46.4806L46.1752 14.2629H46.2888C46.5871 13.6331 47.0085 13.1478 47.553 12.8069C48.1023 12.4612 48.6894 12.2884 49.3144 12.2884C49.4612 12.2884 49.6198 12.2955 49.7902 12.3097C49.9607 12.3192 50.1075 12.3358 50.2306 12.3594L49.8329 14.7245C49.724 14.6866 49.5535 14.6535 49.3215 14.6251C49.0942 14.5919 48.8693 14.5754 48.6468 14.5754C48.178 14.5754 47.7424 14.6771 47.34 14.8807C46.9422 15.0796 46.6061 15.3566 46.3314 15.7117C46.0568 16.0668 45.8793 16.4764 45.7988 16.9404L44.7405 23.3538H42.1695ZM53.0342 23.5739C52.3429 23.5739 51.7416 23.4508 51.2302 23.2046C50.7189 22.9537 50.3424 22.5843 50.101 22.0967C49.8642 21.609 49.805 21.0076 49.9234 20.2927C50.0276 19.6771 50.2264 19.1682 50.52 18.7657C50.8183 18.3632 51.1829 18.0413 51.6137 17.7998C52.0494 17.5536 52.5228 17.3689 53.0342 17.2458C53.5503 17.1227 54.0759 17.0327 54.6109 16.9759C55.2643 16.9096 55.7923 16.8481 56.1947 16.7913C56.6019 16.7344 56.9073 16.6492 57.1109 16.5356C57.3145 16.4172 57.4376 16.2373 57.4802 15.9958V15.9532C57.5655 15.4182 57.4802 15.0039 57.2245 14.7103C56.9689 14.4167 56.5427 14.27 55.9461 14.27C55.3211 14.27 54.7956 14.4073 54.3694 14.6819C53.9433 14.9565 53.6332 15.2808 53.439 15.6549L51.1095 15.314C51.403 14.6511 51.8055 14.0971 52.3169 13.6521C52.8282 13.2022 53.4177 12.8661 54.0853 12.6435C54.7577 12.4163 55.475 12.3026 56.2373 12.3026C56.7582 12.3026 57.2672 12.3642 57.7643 12.4873C58.2662 12.6104 58.7089 12.814 59.0924 13.0981C59.4807 13.3774 59.7648 13.7586 59.9447 14.2415C60.1294 14.7245 60.1601 15.3282 60.037 16.0526L58.8226 23.3538H56.351L56.6066 21.8552H56.5214C56.3178 22.1582 56.0527 22.4423 55.726 22.7075C55.3993 22.9679 55.011 23.1786 54.5612 23.3396C54.1114 23.4958 53.6024 23.5739 53.0342 23.5739ZM54.0072 21.6847C54.5233 21.6847 54.9873 21.5829 55.3993 21.3793C55.8112 21.171 56.1497 20.8964 56.4149 20.5555C56.68 20.2146 56.8458 19.8429 56.912 19.4404L57.1251 18.1549C57.0304 18.2212 56.8836 18.2827 56.6848 18.3396C56.4859 18.3964 56.2634 18.4461 56.0172 18.4887C55.7757 18.5313 55.5366 18.5692 55.2998 18.6023C55.0631 18.6355 54.8595 18.6639 54.689 18.6876C54.296 18.7396 53.9362 18.8249 53.6095 18.9432C53.2875 19.0616 53.02 19.2273 52.8069 19.4404C52.5986 19.6487 52.4684 19.9186 52.4163 20.2501C52.3405 20.7188 52.4518 21.0763 52.7501 21.3225C53.0484 21.564 53.4674 21.6847 54.0072 21.6847ZM66.1947 23.5668C65.1199 23.5668 64.225 23.3301 63.5101 22.8566C62.7998 22.3831 62.3003 21.7179 62.0115 20.8609C61.7226 20.0039 61.6706 19.0095 61.8552 17.8779C62.0399 16.7605 62.4092 15.7827 62.9632 14.9447C63.5219 14.1066 64.225 13.4579 65.0726 12.9986C65.9248 12.5346 66.8789 12.3026 67.9348 12.3026C69.0096 12.3026 69.9021 12.5417 70.6123 13.02C71.3226 13.4934 71.8221 14.1587 72.1109 15.0157C72.4045 15.8727 72.4589 16.8718 72.2743 18.0129C72.0943 19.1255 71.7226 20.0986 71.1592 20.9319C70.6005 21.7652 69.8974 22.4139 69.0498 22.8779C68.2023 23.3372 67.2506 23.5668 66.1947 23.5668ZM66.4078 21.5072C67.0044 21.5072 67.5276 21.3462 67.9774 21.0242C68.4319 20.6975 68.8036 20.2595 69.0924 19.7103C69.386 19.1563 69.5896 18.5408 69.7032 17.8637C69.8074 17.2103 69.8098 16.6184 69.7103 16.0881C69.6109 15.5531 69.3978 15.1293 69.0711 14.8168C68.7492 14.4996 68.3017 14.341 67.7288 14.341C67.1322 14.341 66.6043 14.5067 66.145 14.8381C65.6905 15.1648 65.3188 15.6052 65.0299 16.1592C64.7411 16.7084 64.5423 17.3216 64.4333 17.9986C64.3244 18.6521 64.3197 19.2439 64.4191 19.7742C64.5186 20.3045 64.7316 20.7259 65.0583 21.0384C65.3851 21.3509 65.8349 21.5072 66.4078 21.5072ZM73.4408 23.3538L73.7178 21.7202L80.5005 14.6677L80.5289 14.5754H75.0885L75.4508 12.4447H84.0303L83.7462 14.1989L77.2476 21.1307L77.2192 21.2231H82.759L82.411 23.3538H73.4408ZM87.9365 23.5739C87.2453 23.5739 86.6439 23.4508 86.1326 23.2046C85.6212 22.9537 85.2448 22.5843 85.0033 22.0967C84.7666 21.609 84.7074 21.0076 84.8258 20.2927C84.9299 19.6771 85.1288 19.1682 85.4223 18.7657C85.7206 18.3632 86.0852 18.0413 86.5161 17.7998C86.9517 17.5536 87.4252 17.3689 87.9365 17.2458C88.4526 17.1227 88.9782 17.0327 89.5133 16.9759C90.1667 16.9096 90.6946 16.8481 91.0971 16.7913C91.5043 16.7344 91.8097 16.6492 92.0133 16.5356C92.2168 16.4172 92.34 16.2373 92.3826 15.9958V15.9532C92.4678 15.4182 92.3826 15.0039 92.1269 14.7103C91.8712 14.4167 91.4451 14.27 90.8485 14.27C90.2235 14.27 89.6979 14.4073 89.2718 14.6819C88.8456 14.9565 88.5355 15.2808 88.3414 15.6549L86.0118 15.314C86.3054 14.6511 86.7079 14.0971 87.2192 13.6521C87.7306 13.2022 88.3201 12.8661 88.9877 12.6435C89.66 12.4163 90.3774 12.3026 91.1397 12.3026C91.6605 12.3026 92.1695 12.3642 92.6667 12.4873C93.1686 12.6104 93.6113 12.814 93.9948 13.0981C94.383 13.3774 94.6671 13.7586 94.8471 14.2415C95.0317 14.7245 95.0625 15.3282 94.9394 16.0526L93.7249 23.3538H91.2533L91.509 21.8552H91.4238C91.2202 22.1582 90.955 22.4423 90.6283 22.7075C90.3016 22.9679 89.9133 23.1786 89.4635 23.3396C89.0137 23.4958 88.5047 23.5739 87.9365 23.5739ZM88.9096 21.6847C89.4257 21.6847 89.8897 21.5829 90.3016 21.3793C90.7135 21.171 91.0521 20.8964 91.3172 20.5555C91.5824 20.2146 91.7481 19.8429 91.8144 19.4404L92.0275 18.1549C91.9328 18.2212 91.786 18.2827 91.5871 18.3396C91.3883 18.3964 91.1657 18.4461 90.9195 18.4887C90.678 18.5313 90.4389 18.5692 90.2022 18.6023C89.9654 18.6355 89.7618 18.6639 89.5914 18.6876C89.1984 18.7396 88.8385 18.8249 88.5118 18.9432C88.1899 19.0616 87.9223 19.2273 87.7093 19.4404C87.5009 19.6487 87.3707 19.9186 87.3186 20.2501C87.2429 20.7188 87.3542 21.0763 87.6525 21.3225C87.9508 21.564 88.3698 21.6847 88.9096 21.6847Z" fill="black"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M62.2295 6.33223C62.5595 6.12769 62.9783 6.39966 62.9256 6.78395L62.0009 13.5348C61.9629 13.8132 61.7094 13.9615 61.475 13.9263C61.2252 13.8889 61.1388 13.5973 61.0714 13.3539C60.932 12.8509 60.6336 11.9612 60.1663 11.4939C59.6291 10.9567 58.8914 10.6691 58.1323 10.7008L56.7767 10.7575C56.6631 10.7623 56.5436 10.765 56.4454 10.7076C56.1663 10.5445 56.1305 10.1137 56.4385 9.92241L62.2295 6.33223Z" fill="#1593EF"/>
</g>
<defs>
<filter id="filter0_d_882_9139" x="-4.88758e-05" y="0" width="98.3132" height="32.4075" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="0.85"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_882_9139"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_882_9139" result="shape"/>
</filter>
</defs>
</svg>
`;

let widgetConf = window.woAccConfig;
if (widgetConf.language && storageConfig) {
  storageConfig.woAccessibilityLang = widgetConf.language;
  localStorage.setItem('WoAccConfig', JSON.stringify(storageConfig));
}

const deviceType = isMobileDevice() === true ? 'mobile' : 'desktop';
const position =
  widgetConf?.buttonLocation[deviceType]?.position || 'bottom-right';
console.log({ position });

let infoDiv;
let footerText = 'Accessibility by ';
const { staticPath, cdnUrl } = currentConfig;

const currentValues = {
  contrast: storageConfig?.contrast || 'default',
  enlargeText: storageConfig?.enlargeText || 'default',
  bigWhiteCursor: storageConfig?.bigWhiteCursor || 'default',
};

const options = [
  {
    key: 'contrast',
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
    toolTip: 'Dark Contrast',
    onClick: (e, btn) => {
      handleOptionClick('contrast', e, btn);
    },
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
    toolTip: 'Bigger Text',
    onClick: (e, btn) => {
      handleOptionClick('enlargeText', e, btn);
    },
  },
  {
    key: 'bigWhiteCursor',
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="24"
        viewBox="0 0 30 24"
        fill="none"
      >
        <g clipPath="url(#clip0_1585_927)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.27063 0.277712C9.59979 0.189726 9.95042 0.235994 10.2455 0.406353C10.5406 0.576711 10.756 0.857228 10.8443 1.18628L11.6141 4.05428C11.6578 4.2175 11.6691 4.38774 11.647 4.55528C11.625 4.72283 11.5703 4.8844 11.4858 5.03078C11.3153 5.32639 11.0343 5.54214 10.7046 5.63057C10.375 5.719 10.0237 5.67286 9.72814 5.50231C9.43253 5.33176 9.21678 5.05077 9.12834 4.72114L8.36377 1.85143C8.31995 1.68832 8.30869 1.51819 8.33064 1.35073C8.35259 1.18328 8.40731 1.02179 8.49168 0.875486C8.57606 0.729186 8.68843 0.600942 8.82237 0.49808C8.95632 0.395218 9.10922 0.319753 9.27234 0.275998L9.27063 0.277712ZM3.1232 6.43714C3.03522 6.7663 3.08148 7.11693 3.25184 7.41201C3.4222 7.70708 3.70272 7.92247 4.03177 8.01085L6.89977 8.77885C7.06485 8.82934 7.23841 8.84606 7.41009 8.82803C7.58178 8.80999 7.74807 8.75757 7.89906 8.67389C8.05004 8.5902 8.18263 8.47697 8.28891 8.34094C8.3952 8.20491 8.473 8.04887 8.51768 7.88212C8.56236 7.71538 8.573 7.54134 8.54898 7.3704C8.52495 7.19945 8.46674 7.03509 8.37783 6.88713C8.28892 6.73916 8.17111 6.61061 8.03145 6.50915C7.89179 6.40769 7.73312 6.33539 7.56492 6.29657L4.69692 5.52685C4.36775 5.43887 4.01712 5.48514 3.72205 5.6555C3.42698 5.82585 3.21159 6.10637 3.1232 6.43543V6.43714ZM10.6661 9.80571C10.5655 9.50384 10.551 9.17994 10.6241 8.87028C10.6971 8.56061 10.855 8.27739 11.0798 8.05232C11.3047 7.82724 11.5878 7.6692 11.8974 7.59588C12.2071 7.52255 12.531 7.53684 12.8329 7.63714L25.0386 11.7086C26.6158 12.2349 26.5952 14.472 25.0078 14.9691L21.5346 16.0611L26.1632 20.6897C26.4846 21.0114 26.6651 21.4476 26.665 21.9023C26.6648 22.3571 26.484 22.7931 26.1623 23.1146C25.8407 23.436 25.4045 23.6165 24.9497 23.6163C24.495 23.6162 24.0589 23.4354 23.7375 23.1137L19.0986 18.4731L17.9981 21.9806C17.5009 23.5663 15.2621 23.5869 14.7358 22.0097L10.6643 9.804L10.6661 9.80571ZM6.54149 15.0086C6.42294 15.1314 6.28112 15.2294 6.12429 15.2969C5.96746 15.3644 5.79876 15.3999 5.62805 15.4015C5.45733 15.403 5.28802 15.3706 5.12998 15.306C4.97194 15.2414 4.82834 15.146 4.70756 15.0254C4.58679 14.9047 4.49125 14.7612 4.42653 14.6032C4.36181 14.4452 4.3292 14.276 4.3306 14.1052C4.332 13.9345 4.36739 13.7658 4.4347 13.6089C4.50201 13.452 4.59989 13.3101 4.72263 13.1914L6.82434 11.0914C7.06807 10.8643 7.39044 10.7407 7.72353 10.7466C8.05661 10.7524 8.37442 10.8874 8.60998 11.1229C8.84555 11.3585 8.98048 11.6763 8.98636 12.0094C8.99224 12.3425 8.8686 12.6648 8.64149 12.9086L6.54149 15.0086ZM17.6158 3.70971C17.8501 3.46733 17.9798 3.14262 17.9771 2.80551C17.9743 2.46839 17.8392 2.14586 17.601 1.90736C17.3627 1.66887 17.0403 1.5335 16.7032 1.53041C16.3661 1.52732 16.0412 1.65676 15.7986 1.89085L13.6969 3.99085C13.4628 4.23345 13.3334 4.55829 13.3365 4.8954C13.3396 5.23251 13.4749 5.55492 13.7134 5.79319C13.9519 6.03146 14.2745 6.16653 14.6116 6.1693C14.9487 6.17207 15.2734 6.04232 15.5158 5.808L17.6158 3.70971Z"
            fill="#00499E"
            class="guidy-fill"
          />
        </g>
        <defs>
          <clipPath id="clip0_1585_927">
            <rect
              width="24"
              height="24"
              fill="white"
              transform="translate(3)"
            />
          </clipPath>
        </defs>
      </svg>`,
    toolTip: 'Big Cursor',
    onClick: (e, btn) => {
      handleOptionClick('bigWhiteCursor', e, btn);
    },
  },
  {
    icon: `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <mask
          id="mask0_1585_1042"
          style="mask-type:luminance"
          maskUnits="userSpaceOnUse"
          x="1"
          y="1"
          width="22"
          height="22"
        >
          <path
            d="M12 22C13.3135 22.0016 14.6143 21.7437 15.8278 21.2411C17.0412 20.7384 18.1434 20.0009 19.071 19.071C20.0009 18.1434 20.7384 17.0412 21.2411 15.8278C21.7437 14.6143 22.0016 13.3135 22 12C22.0016 10.6866 21.7437 9.38572 21.2411 8.17225C20.7384 6.95878 20.0009 5.85659 19.071 4.92901C18.1434 3.99909 17.0412 3.26162 15.8278 2.75897C14.6143 2.25631 13.3135 1.99839 12 2.00001C10.6866 1.99839 9.38572 2.25631 8.17225 2.75897C6.95878 3.26162 5.85659 3.99909 4.92901 4.92901C3.99909 5.85659 3.26162 6.95878 2.75897 8.17225C2.25631 9.38572 1.99839 10.6866 2.00001 12C1.99839 13.3135 2.25631 14.6143 2.75897 15.8278C3.26162 17.0412 3.99909 18.1434 4.92901 19.071C5.85659 20.0009 6.95878 20.7384 8.17225 21.2411C9.38572 21.7437 10.6866 22.0016 12 22Z"
            fill="white"
            stroke="white"
            strokeWidth="1.66667"
            strokeLinejoin="round"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 5.5C12.3315 5.5 12.6495 5.6317 12.8839 5.86612C13.1183 6.10054 13.25 6.41848 13.25 6.75C13.25 7.08152 13.1183 7.39946 12.8839 7.63388C12.6495 7.8683 12.3315 8 12 8C11.6685 8 11.3505 7.8683 11.1161 7.63388C10.8817 7.39946 10.75 7.08152 10.75 6.75C10.75 6.41848 10.8817 6.10054 11.1161 5.86612C11.3505 5.6317 11.6685 5.5 12 5.5Z"
            fill="black"
          />
          <path
            d="M12.25 17V10H11.25M10.5 17H14"
            stroke="black"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
        <g mask="url(#mask0_1585_1042)">
          <path d="M0 0H24V24H0V0Z" fill="white" />
        </g>
      </svg>`,
    onClick: () => {
      handleInfoDiv();
    },
    extraStyles: {
      background:
        widgetConf.buttonColor.value ||
        'linear-gradient(270deg, #00499E 0%, #1593EF 100%)',
    },
  },
];

function handleOptionClick(key, e, btn) {
  let newValue = 'default';

  if (currentValues[key] === 'default') {
    switch (key) {
      case 'contrast':
        newValue = 'darkContrast';
        break;
      case 'bigWhiteCursor':
        newValue = 'bigWhiteCursor';
        break;
      case 'enlargeText':
        newValue = 'large1';
        break;
    }
    currentValues[key] = newValue;
    btn.classList.add('active');
    btn.style.background =
      widgetConf.buttonColor.value ||
      'linear-gradient(270deg, #00499E 0%, #1593EF 100%)';
    sendAnalyticsEvents(
      { name: key, currentActive: newValue },
      getAccountKey(cdnUrl)
    );
  } else {
    btn.classList.remove('active');
    btn.style.background = '';
    currentValues[key] = 'default';
  }
  handleContentStateChange(key, newValue);
}

function handleInfoDiv() {
  if (infoDiv.classList.contains('open')) {
    infoDiv.style.width = '0px';
    infoDiv.style.opacity = '0';
    infoDiv.classList.remove('open');
  } else {
    infoDiv.style.width = '180px';
    infoDiv.style.opacity = '1';
    infoDiv.classList.add('open');
  }
}

function injectNanoWidgetCss() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = widgetConf?.isWoTestExists
    ? `${cdnUrl}/Css/nano.css`
    : `${staticPath}css/nano.css`;
  shadowRoot.appendChild(link);

  const colorStyle = document.createElement('style');
  const userColor = widgetConf.buttonColor?.value || '#00499E';
  // if it's a gradient, extract the first color for SVG use
  const solidColor = userColor.startsWith('linear-gradient')
    ? extractFirstColor(userColor)
    : userColor;
  colorStyle.innerHTML = `:host { --guidy-brand-color: ${solidColor}; }`;
  shadowRoot.appendChild(colorStyle);
}

function extractFirstColor(gradient) {
  const match = gradient.match(/#[0-9a-fA-F]{3,6}|rgb[a]?\([^)]+\)/);
  return match ? match[0] : '#00499E';
}

function getIconSpan(icon) {
  const span = document.createElement('span');
  span.classList.add('icon-span');
  span.innerHTML = icon;
  return span;
}

function getToolTipDiv(tooltip) {
  const span = document.createElement('div');
  span.classList.add('tooltip-div');
  if (!isLeftPositionedWidget()) {
    console.log('this will show left');
    span.classList.add('tooltip-left');
  }
  span.setAttribute('data-translate', tooltip);
  span.innerText = tooltip;
  return span;
}

function creationOptionButton({
  key,
  icon,
  toolTip = undefined,
  onClick,
  extraStyles,
}) {
  const optionButton = document.createElement('button');
  optionButton.setAttribute('aria-label', toolTip);
  optionButton.classList.add('option-btn');
  if (extraStyles) {
    Object.entries(extraStyles).map(([key, value]) => {
      optionButton.style[key] = value;
    });
  }
  if (key && currentValues[key] !== 'default') {
    optionButton.classList.add('active');
    optionButton.style.background =
      widgetConf.buttonColor.value ||
      'linear-gradient(270deg, #00499E 0%, #1593EF 100%)';
  }
  const iconSpan = getIconSpan(icon);
  optionButton.appendChild(iconSpan);
  if (toolTip) {
    const toolTipDiv = getToolTipDiv(toolTip);
    optionButton.appendChild(toolTipDiv);
    optionButton.onmouseenter = () => toolTipDiv.classList.add('open');
    optionButton.onmouseleave = () => toolTipDiv.classList.remove('open');
  }
  optionButton.onclick = (e) => onClick(e, optionButton);
  return optionButton;
}

function appendOptions() {
  const optionsDiv = document.createElement('div');
  optionsDiv.classList.add('options-div');
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const optionElement = creationOptionButton(option);
    optionsDiv.appendChild(optionElement);
  }
  nanoWidget.appendChild(optionsDiv);
}

function guidyIconDiv() {
  const div = document.createElement('div');
  div.innerHTML = braozaLogoSVG;
  div.classList.add('guidy-icon-div');
  return div;
}

function appendInfoDiv() {
  infoDiv = document.createElement('div');
  infoDiv.classList.add('info-div-wrapper');
  const mainDiv = document.createElement('div');
  mainDiv.classList.add('info-div');
  mainDiv.appendChild(guidyIconDiv());
  const text = document.createElement('div');
  text.setAttribute('data-translate', footerText);
  text.innerText += footerText;
  text.appendChild(document.createElement('br'));
  const guidyLink = document.createElement('a');
  guidyLink.href = 'https://www.staging.braoza.com/';
  guidyLink.innerText = 'Braoza.com';
  guidyLink.target = '_blank';
  mainDiv.appendChild(text);
  mainDiv.appendChild(guidyLink);
  infoDiv.appendChild(mainDiv);
  nanoWidget.appendChild(infoDiv);
}

function widgetPositionResolver(nanoWidget, config) {
  switch (position) {
    case 'top-left':
    case 'top-middle':
      nanoWidget.style.left = '0px';
      nanoWidget.style.top = '10%';
      break;
    case 'top-right':
      nanoWidget.style.top = '10%';
      nanoWidget.style.right = '0px';
      break;
    case 'middle-left':
      nanoWidget.style.left = '0px';
      nanoWidget.style.top = 'calc(50% - 100px)';
      break;
    case 'middle-right':
      nanoWidget.style.right = '0px';
      nanoWidget.style.top = 'calc(50% - 100px)';
      break;
    case 'bottom-left':
      nanoWidget.style.left = '0px';
      nanoWidget.style.bottom = '10%';
      break;
    case 'bottom-middle':
    case 'bottom-right':
      nanoWidget.style.right = '0px';
      nanoWidget.style.bottom = '10%';
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
    nanoWidget.style.transform = `translate(${x}px, ${y}px)`;
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

function appendOptionsAndInfoDiv() {
  if (isLeftPositionedWidget()) {
    root.style.justifyContent = 'start';
    nanoWidget.style.borderTopRightRadius = '20px';
    nanoWidget.style.borderBottomRightRadius = '20px';
    appendInfoDiv();
    appendOptions();
  } else {
    root.style.justifyContent = 'end';
    nanoWidget.style.borderTopLeftRadius = '20px';
    nanoWidget.style.borderBottomLeftRadius = '20px';
    appendOptions();
    appendInfoDiv();
  }
}

export function loadWidget() {
  Object.assign(root.style, {
    height: '200px',
    position: 'fixed',
    display: 'flex',
    'align-items': 'center',
    'text-align': 'center',
    zIndex: '10000000',
  });
  widgetPositionResolver(root, widgetConf);
  nanoWidget.classList.add('nano-widget');
  injectNanoWidgetCss();
  appendOptionsAndInfoDiv();
  shadowRoot.appendChild(nanoWidget);
  document.body.insertBefore(root, document.body.firstChild);
  getTranslations(footerText, nanoWidget);
}
