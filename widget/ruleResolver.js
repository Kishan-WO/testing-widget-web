import {
  currentConfig,
  getAccountKey,
  getActualBackgroundColor,
  isMobileDevice,
  rgbToHex,
  rootElement,
  sendMessageToDashboard,
  waitForSelector,
} from './constants.js';
const { baseAPIUrl, cdnUrl } = currentConfig;

let mutationObservers = [];
const mutationObserverConfig = {
  attributes: true, // Observe attribute changes
  attributeFilter: ['aria-hidden'], // Only observe changes to the 'aria-hidden' attribute
  subtree: true, // Observe all descendants of the target
  childList: false,
};

// Mapper for all the rules and their resolver functions
const resolver = {
  'aria-hidden-focus': resolveAriaHiddenFocusRule,
  'form-field-labels': resolveFormFieldsLabels,
  'submit-and-reset-button-values': resolveSubmitAndResetButtonValues,
  'button-accessible-names': resolveButtonAccessibleName,
  'button-name': resolveButtonAccessibleName,
  'link-purpose-in-context': resolveLinkPurposeInContext,
  'link-name': resolveLinkPurposeInContext,
  'color-contrast': resolveColorContrast,
  'is-valid-by': resolveIsValidBy,
  'p-as-heading': resolvePAsHeading,
  'meta-viewport': resolveMetaViewport,
  'area-alt': resolveAreaAlt,
  'aria-allowed-attr': resolveAriaAllowedAttr,
  'html-has-lang': resolveHtmlHasLang,
  'html-lang-valid': resolveHtmlLangValid,
  'has-multiple-h1': resolveHasMultipleH1,
  'duplicate-id-aria': resolveDuplicateIdAria,
  'input-validation': resolveInputValidation,
  'section-headings': resolveSectionHeadings,
};

/**
 * Common resolver for all the rules data received from dashboard.
 * Called from injector.js
 */
export async function resolveRules() {
  try {
    const body = document.body;
    body.setAttribute('guidy-rules-resolved', 'resolving');
    const accountKey = getAccountKey(cdnUrl);
    const response = await fetch(
      `${baseAPIUrl}/widget/rules?code=${accountKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Site: window.location.href,
          IsMobile: isMobileDevice(),
        },
      }
    );
    if (response.ok) {
      const rules = (await response.json()) || {};
      rules.forEach((rule) => {
        const ruleResolver = resolver[rule?.id];
        ruleResolver?.(rule?.selectors);
      });
      body.setAttribute('guidy-rules-resolved', 'true');
    }
  } catch (error) {
    console.log('Error in resolving rules:', error);
    document.body.setAttribute('guidy-rules-resolved', 'true');
  }
}

const validator = {
  'duplicate-id-aria': validateDuplicateIdAria,
};

async function validateDuplicateIdAria(data) {
  let isValid = true;
  let message = '';
  const selector = data?.target;
  const element = await waitForSelector(selector);
  const userInputId = data?.userInput?.id;
  if (element) {
    const currentId = element.id;
    if (currentId === userInputId) {
      isValid = false;
      message = 'The id cannot be same as before!';
    } else if (document.querySelectorAll(`[id="${userInputId}"]`).length) {
      isValid = false;
      message = 'The id already exists!';
    }
  }
  sendMessageToDashboard('validateRuleResponse', {
    isValid,
    message,
    ruleId: 'duplicate-id-aria',
    target: selector,
  });
}

/**
 * This function handles the message received from the dashboard
 * @param {Event} event - message Event
 */
export function handleDashboardMessage(event) {
  window.isDashboardEmbedded = true;
  switch (event?.data?.eventName) {
    case 'validateRule': {
      const payload = event?.data?.payload;
      const { ruleId, ...data } = payload;
      const validate = validator[ruleId];
      validate(data);
      break;
    }
    case 'color-contrast': {
      handleColorContrastOverview(...handleElementOverviewVisibility(event));
      break;
    }
    case 'rule-initialData': {
      sendInitialDataForAllElements(event);
      break;
    }
    case 'preview-element': {
      const selector = event?.data?.payload?.selector;
      if (selector) {
        const element = document.querySelector(selector);
        handleElementOverviewVisibility(event, element, true);
        break;
      }
      const uniqueId = event?.data?.payload?.uniqueId;
      const element = document.querySelector(
        `[data-guidy-h1-id="${uniqueId}"]`
      );
      handleElementOverviewVisibility(event, element);
      break;
    }
    case 'form-field-labels': {
      handleFormFieldLabelsOverview(...handleElementOverviewVisibility(event));
      break;
    }
    case 'submit-and-reset-button-values': {
      handleSubmitAndResetButtonValuesOverview(
        ...handleElementOverviewVisibility(event)
      );
      break;
    }
    case 'button-accessible-names':
    case 'button-name': {
      handleButtonNameOverview(...handleElementOverviewVisibility(event));
      break;
    }
    case 'link-purpose-in-context':
    case 'link-name': {
      handleLinkPurposeInContextOverview(
        ...handleElementOverviewVisibility(event)
      );
      break;
    }
    case 'aria-hidden-focus': {
      handleElementOverviewVisibility(event);
      break;
    }
    case 'is-valid-by': {
      handleIsValidByOverview(...handleElementOverviewVisibility(event));
      break;
    }
    case 'p-as-heading': {
      handlePAsHeadingOverview(...handleElementOverviewVisibility(event));
      break;
    }
    case 'meta-viewport': {
      handleMetaViewportOverview(event);
      break;
    }
    case 'area-alt': {
      handleAreaAltOverview(...handleElementOverviewVisibility(event));
      break;
    }
    case 'aria-allowed-attr': {
      handleAriaAllowedAttrOverview(...handleElementOverviewVisibility(event));
      break;
    }
    case 'has-multiple-h1': {
      const uniqueId = event?.data?.payload?.uniqueId;
      const element = document.querySelector(
        `[data-guidy-h1-id="${uniqueId}"]`
      );

      if (element) {
        const newTagName =
          event?.data?.payload?.newTag || element.tagName.toLowerCase();
        const newElement = document.createElement(newTagName);

        [...element.attributes].forEach((attr) => {
          newElement.setAttribute(attr.name, attr.value);
        });

        // Copy computed styles from the original element to the new element
        const computedStyles = window.getComputedStyle(element);
        for (let i = 0; i < computedStyles.length; i++) {
          const property = computedStyles[i];
          newElement.style.setProperty(
            property,
            computedStyles.getPropertyValue(property),
            computedStyles.getPropertyPriority(property)
          );
        }

        while (element.firstChild) {
          newElement.appendChild(element.firstChild);
        }

        element.parentNode.replaceChild(newElement, element);
        window.currentWatchingGuidyElement = newElement;
      }
      break;
    }
    case 'duplicate-id-aria': {
      handleElementOverviewVisibility(event);
      break;
    }
    case 'input-validation': {
      handleElementOverviewVisibility(event, undefined, true);
      break;
    }
    case 'input-validation2': {
      handleInputValidationOverview(event);
      break;
    }
    case 'section-headings': {
      handleSectionHeadingsOverview(...handleElementOverviewVisibility(event));
      break;
    }

    default:
      break;
  }
}

function handleElementOverviewVisibility(event, element, outline = false) {
  // Remove the outline from the previously highlighted element
  if (!element) {
    const target = event?.data?.payload?.target;
    element =
      document.querySelector(target) ||
      document.querySelector(target.replace(/\.active/g, ''));
  }

  // If element has 0 width or height, find the nearest parent with dimensions
  while (
    element &&
    (element.offsetWidth === 0 || element.offsetHeight === 0) &&
    element.parentElement
  ) {
    element = element.parentElement;
  }
  console.log('scrolling ::::', { element });
  element?.scrollIntoView?.({
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  });
  // Cancel any existing animation
  if (window.currentGuidyAnimation) {
    window.currentGuidyAnimation.cancel();
    window.currentGuidyAnimation = null;
  }

  const blinkHighlight = (target) => {
    const animation = target.animate(
      [
        { outlineColor: '#FECD00', offset: 0 },
        { outlineColor: 'transparent', offset: 0.5 },
        { outlineColor: '#FECD00', offset: 1 },
      ],
      {
        duration: 600,
        iterations: 3, // 3 full blinks
      }
    );

    window.currentGuidyAnimation = animation;

    animation.onfinish = () => {
      window.currentGuidyAnimation = null;
    };
  };

  // Helper to get or create shadow host and highlighter
  const getShadowHighlighter = () => {
    let host = document.getElementById('guidy-highlighter-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'guidy-highlighter-host';
      host.style.position = 'fixed'; // Fixed to cover viewport and escape some stacking contexts
      host.style.top = '0';
      host.style.left = '0';
      host.style.width = '100%';
      host.style.height = '100%';
      host.style.pointerEvents = 'none'; // Ensure host doesn't block clicks
      host.style.zIndex = '2147483647'; // Max valid 32-bit integer
      host.attachShadow({ mode: 'open' });
    }
    // Always append to body to ensure it's the last element (on top of everything else)
    document.body.appendChild(host);

    let highlighter = host.shadowRoot.getElementById('guidy-highlighter');
    if (!highlighter) {
      highlighter = document.createElement('div');
      highlighter.id = 'guidy-highlighter';
      highlighter.style.position = 'fixed';
      highlighter.style.pointerEvents = 'none'; // Crucial: allow clicks through
      highlighter.style.zIndex = '2147483647'; // Max valid 32-bit integer
      host.shadowRoot.appendChild(highlighter);
    }
    return { host, highlighter };
  };

  if (outline && element) {
    console.log('scrolling2 ::::', { element });
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
    if (window.currentWatchingGuidyElement) {
      window.currentWatchingGuidyElement.style.outline = 'none';
      window.currentWatchingGuidyElement.style.outlineOffset = '0px';
    }
    element.style.outline = '3px solid #FECD00';
    element.style.outlineOffset = '15px';
    window.currentWatchingGuidyElement = element;

    blinkHighlight(element);

    return [event, element];
  }

  const { host, highlighter } = getShadowHighlighter();

  // Clean up previous state if needed (though we reuse the element now)
  document.removeEventListener('scroll', handleScrollOverviewElement, true);
  document.addEventListener('scroll', handleScrollOverviewElement, true);

  if (element) {
    window.currentWatchingGuidyElement = element;
    console.log('scrolling3 ::::', { element });

    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });

    // Start a requestAnimationFrame loop to keep the highlighter in sync during smooth scroll
    if (window.guidySyncRaf) {
      cancelAnimationFrame(window.guidySyncRaf);
    }

    const startSyncTime = performance.now();
    const syncHighlighter = (currentTime) => {
      handleScrollOverviewElement();
      // Sync for 2.5 seconds to cover most smooth scroll durations
      if (currentTime - startSyncTime < 2500) {
        window.guidySyncRaf = requestAnimationFrame(syncHighlighter);
      } else {
        window.guidySyncRaf = null;
      }
    };
    window.guidySyncRaf = requestAnimationFrame(syncHighlighter);

    const positions = element.getBoundingClientRect();

    highlighter.style.top = `${positions.top}px`;
    highlighter.style.left = `${positions.left}px`;
    highlighter.style.width = `${positions.width}px`;
    highlighter.style.height = `${positions.height}px`;
    highlighter.style.outline = '3px solid #FECD00';
    highlighter.style.outlineOffset = '15px';

    blinkHighlight(highlighter);
  } else {
    // If no element, maybe hide the highlighter?
    // For now keeping consistent with previous logic which just didn't add it if !element
    if (highlighter) highlighter.style.outline = 'none';
  }
  return [event, element];
}

function handleScrollOverviewElement() {
  const element = window.currentWatchingGuidyElement;
  if (element) {
    const positions = element.getBoundingClientRect();
    const host = document.getElementById('guidy-highlighter-host');
    const markerDiv = host?.shadowRoot?.getElementById('guidy-highlighter');
    if (markerDiv) {
      markerDiv.style.top = `${positions.top}px`;
      markerDiv.style.left = `${positions.left}px`;
      markerDiv.style.width = `${positions.width}px`;
      markerDiv.style.height = `${positions.height}px`;
    }
  }
}
//#region aria-hidden-focus
/**
 * This function resolves and manages the all given elements under the aria-hidden-focus rule.
 * @param {Array} selectors received from dashboard
 */
function resolveAriaHiddenFocusRule(selectors) {
  const selector = selectors
    .filter((selector) => selector.fix)
    .map((selector) => selector.target)
    .join(', ');
  const elements = document.querySelectorAll(selector);
  observeAttributeChanges(elements);
  elements.forEach((element) => {
    fixAriaHiddenElement(element);
  });
}

/** Fixes the aria-hidden-focus rule for given element recursively */
function fixAriaHiddenElement(element, isChild = false) {
  try {
    const guidyMutationObserverId = element?.guidyMutationObserverId;
    mutationObservers[guidyMutationObserverId]?.disconnect?.();
    if (element.guidyIgnoreMutation) return;
    element.guidyIgnoreMutation = true;
    const children = element.children;
    element.guidyAttrValues = [];
    if (element) {
      if (isChild) {
        if (element.ariaHidden)
          element.guidyAttrValues.push({
            attribute: 'aria-hidden',
            value: element.ariaHidden,
          });
        element.removeAttribute('aria-hidden');
      }
      if (element.tabIndex == 0) {
        element.guidyAttrValues.push({
          attribute: 'tabIndex',
          value: element.tabIndex,
        });
        element.tabIndex = -1;
      }
      element.guidyIgnoreMutation = false;
      mutationObservers[guidyMutationObserverId]?.takeRecords?.();
      mutationObservers[guidyMutationObserverId]?.observe?.(
        document.body,
        mutationObserverConfig
      );
    }
    if (children.length) {
      [...children].forEach((child) => {
        fixAriaHiddenElement(child, true);
      });
    }
  } finally {
    element.guidyIgnoreMutation = false;
  }
}

/** reverts the changes for the given element recursively */
function revertAriaFixes(element) {
  try {
    const guidyMutationObserverId = element?.guidyMutationObserverId;
    mutationObservers[guidyMutationObserverId]?.disconnect?.();
    if (element.guidyIgnoreMutation) return;
    element.guidyIgnoreMutation = true;
    const children = element.children;
    if (element && element.guidyAttrValues?.length) {
      const oldAttr = element.guidyAttrValues ?? [];
      oldAttr.forEach((attr) => {
        if (attr) element.setAttribute(attr.attribute, attr.value);
      });
      element.guidyAttrValues = [];
    }
    mutationObservers[guidyMutationObserverId]?.takeRecords?.();
    mutationObservers[guidyMutationObserverId]?.observe?.(
      document.body,
      mutationObserverConfig
    );

    if (children.length) {
      [...children].forEach((child) => {
        revertAriaFixes(child, true);
      });
    }
  } finally {
    element.guidyIgnoreMutation = false;
  }
}

/** Observes the changes in the DOM for attributes that have changed for aria-hidden */
const observeAttributeChanges = (elements) => {
  elements.forEach((element) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (!mutation.target.guidyIgnoreMutation) {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'aria-hidden' &&
            mutation.target.ariaHidden === 'true'
          ) {
            fixAriaHiddenElement(mutation.target);
          } else if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'aria-hidden' &&
            (mutation.target.ariaHidden === 'false' ||
              !mutation.target.ariaHidden)
          ) {
            revertAriaFixes(mutation.target);
          }
        }
      });
    });
    element.guidyMutationObserverId = mutationObservers.length;
    mutationObservers.push(observer);
    // Start observing the entire document
    observer.observe(element, mutationObserverConfig);
  });
};

//#endregion

//#region form-field-labels
/**
 * This function resolves the given elements for form-field-labels rule.
 * @param {Array} selectors Received from dashboard
 */
function resolveFormFieldsLabels(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      element.setAttribute(
        'aria-label',
        selector.userInput?.['aria-label'] || element.getAttribute('name')
      );
    }
  });
}
//#endregion

//#region submit-and-reset-button-values
/**
 * Resolver function for submit-and-reset-button-values rule.
 * @param {Array} selectors - list of selectors from dashboard
 */
function resolveSubmitAndResetButtonValues(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      element.setAttribute(
        'value',
        selector.userInput?.['value'] ||
          element.getAttribute('name') ||
          element.getAttribute('type')
      );
    }
  });
}

function handleFormFieldLabelsOverview(event, element) {
  if (element) {
    element.setAttribute(
      'aria-label',
      event?.data?.payload?.userInput?.['aria-label'] || ''
    );
  }
}

function handleSubmitAndResetButtonValuesOverview(event, element) {
  if (element) {
    element.setAttribute(
      'value',
      event?.data?.payload?.userInput?.['value'] || ''
    );
  }
}
//#endregion

//#region button-accessible-name
/**
 * Resolver for button-accessible-name rule.
 * @param {Array} selectors - list of selectors from dashboard
 */
function resolveButtonAccessibleName(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      element.setAttribute(
        'aria-label',
        selector.userInput?.['aria-label'] || ''
      );
    }
  });
}

function handleButtonNameOverview(event, element) {
  if (element) {
    element.setAttribute(
      'aria-label',
      event?.data?.payload?.userInput?.['aria-label'] || ''
    );
  }
}
//#endregion

//#region link-purpose-in-context & link-name
function resolveLinkPurposeInContext(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);
  filterSelectors.forEach(async (selector) => {
    let element = document.querySelector(selector.target);
    if (!element) {
      element = await waitForSelector(selector.target);
    }
    if (element) {
      element.setAttribute(
        'aria-label',
        selector.userInput?.['aria-label'] || ''
      );
    }
  });
}

function handleLinkPurposeInContextOverview(event, element) {
  if (element) {
    element.setAttribute(
      'aria-label',
      event?.data?.payload?.userInput?.['aria-label'] || ''
    );
  }
}

//#endregion

//#region color-contrast
function resolveColorContrast(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      element.style.setProperty(
        'background-color',
        selector?.userInput?.backgroundColor,
        'important'
      );
      element.style.setProperty(
        'color',
        selector?.userInput?.color,
        'important'
      );
      element.style.setProperty(
        'font-size',
        selector?.userInput?.fontSize,
        'important'
      );
    }
  });
}

function handleColorContrastOverview(event, element) {
  if (element) {
    element.style.setProperty(
      'background-color',
      event?.data?.payload?.userInput?.backgroundColor,
      'important'
    );
    element.style.setProperty(
      'color',
      event?.data?.payload?.userInput?.color,
      'important'
    );
    element.style.setProperty(
      'font-size',
      event?.data?.payload?.userInput?.fontSize,
      'important'
    );
  }
}
//#endregion

//#region is-valid-by
function resolveIsValidBy(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);
  filterSelectors.forEach((selector) => {
    const fieldName = selector.userInput?.['aria-label']
      ? 'aria-label'
      : 'aria-description';
    const element = document.querySelector(selector.target);
    if (element) {
      element.removeAttribute(
        fieldName === 'aria-label' ? 'aria-labelledby' : 'aria-describedby'
      );
      element.setAttribute(fieldName, selector.userInput?.[fieldName] || '');
    }
  });
}

function handleIsValidByOverview(event, element) {
  if (
    element &&
    (event?.data?.payload?.userInput?.['aria-label'] ||
      event?.data?.payload?.userInput?.['aria-description'])
  ) {
    const fieldName = event?.data?.payload?.userInput?.['aria-label']
      ? 'aria-label'
      : 'aria-description';

    // element.removeAttribute(
    //   fieldName === 'aria-label' ? 'aria-labelledby' : 'aria-describedby'
    // );

    element.setAttribute(
      fieldName,
      event?.data?.payload?.userInput?.[fieldName] || ''
    );
  }
}

//#endregion

//#region p-as-heading
function handlePAsHeadingOverview(event, element) {
  if (element) {
    const newTagName =
      event?.data?.payload?.userInput?.htmlTag || element.tagName.toLowerCase();
    const newElement = document.createElement(newTagName);
    [...element.attributes].forEach((attr) => {
      newElement.setAttribute(attr.name, attr.value);
    });
    while (element.firstChild) {
      newElement.appendChild(element.firstChild);
    }
    element.parentNode.replaceChild(newElement, element);
    window.currentWatchingGuidyElement = newElement;
  }
}

function resolvePAsHeading(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);

  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    const newTagName = selector?.userInput?.htmlTag;
    const newElement = document.createElement(newTagName);

    if (element) {
      [...element.attributes].forEach((attr) => {
        newElement.setAttribute(attr.name, attr.value);
      });
      while (element.firstChild) {
        newElement.appendChild(element.firstChild);
      }
      element.parentNode.replaceChild(newElement, element);
    }
  });
}

//#endregion

//#region meta-viewport

function handleMetaViewportOverview(event) {
  const selector = event?.data?.payload?.target;
  const element = document.querySelector(selector);
  if (element) {
    const maximumScale = event?.data?.payload?.userInput?.maximumScale;
    let content = element.getAttribute('content');
    if (maximumScale) {
      content = content.replace(
        /maximum-scale=[^,;]+(?=,|;|$)/i,
        `maximum-scale=${maximumScale}`
      );
    }
    content = content.replace(
      /user-scalable=[^,;]+(?=,|;|$)/i,
      `user-scalable=yes`
    );
    element.setAttribute('content', content);
  }
}

function resolveMetaViewport(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      const maximumScale = selector?.userInput?.maximumScale;
      let content = element.getAttribute('content');
      if (maximumScale) {
        content = content.replace(
          /maximum-scale=[^,;]+(?=,|;|$)/i,
          `maximum-scale=${maximumScale}`
        );
      }
      content = content.replace(
        /user-scalable=[^,;]+(?=,|;|$)/i,
        `user-scalable=yes`
      );
      element.setAttribute('content', content);
    }
  });
}
//#endregion

//#region  area-alt

function handleAreaAltOverview(event, element) {
  if (element) {
    element.setAttribute('alt', event?.data?.payload?.userInput?.alt || '');
  }
}

function resolveAreaAlt(selectors) {
  const filterSelectors = selectors.filter((selector) => selector.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      element.setAttribute('alt', selector?.userInput?.alt || '');
    }
  });
}

//#endregion

//#region aria-allowed-attr
function handleAriaAllowedAttrOverview(event, element) {
  // const attr = event?.data?.payload?.userInput?.attr;
  // if (element && attr.length) {
  //   attr.forEach((attribute) => {
  //     element.removeAttribute(attribute);
  //   });
  // }
}

function resolveAriaAllowedAttr(selectors) {
  const filterSelectors = selectors.filter((s) => s.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      const rmAttributes = selector?.userInput || [];
      rmAttributes.forEach((attr) => {
        element.removeAttribute(attr);
      });
    }
  });
}
//#endregion

//#region html-has-lang
function resolveHtmlHasLang(selectors) {
  const filterSelectors = selectors.filter((s) => s.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      element.setAttribute('lang', selector?.userInput?.lang || '');
    }
  });
}
//#endregion

//#region html-lang-valid
function resolveHtmlLangValid(selectors) {
  const filterSelectors = selectors.filter((s) => s.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      element.setAttribute('lang', selector?.userInput?.lang || '');
    }
  });
}
//#endregion

//#region has-multiple-h1
function resolveHasMultipleH1(selectors) {
  const userInput = selectors?.[0]?.userInput;
  window.GuidyRuleFixeData = {};
  for (const [key, value] of Object.entries(userInput)) {
    const element = document.querySelector(key);
    if (element && value !== 'h1') {
      const newTagName = value || element.tagName.toLowerCase();
      const newElement = document.createElement(newTagName);

      [...element.attributes].forEach((attr) => {
        newElement.setAttribute(attr.name, attr.value);
      });

      while (element.firstChild) {
        newElement.appendChild(element.firstChild);
      }

      window.GuidyRuleFixeData[key] = newElement;

      element.parentNode.replaceChild(newElement, element);
    }
  }
}
//#endregion

//#region duplicate-id-aria
function resolveDuplicateIdAria(selectors = []) {
  const filterSelectors = selectors.filter((s) => s.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      element.setAttribute(
        'id',
        selector?.userInput?.id || element.getAttribute('id')
      );
    }
  });
}
//#endregion

//#region input-validation
function handleInputValidationOverview(event, element) {
  const payload = event.data.payload;
  console.log({ payload }, 'this is payload:::');
  const form = document.querySelector(payload.formSelector);
  if (form) {
    form.setAttribute('data-guidy-validate', true);
    const userInput = payload?.userInput;
    Object.keys(userInput).forEach((key) => {
      if (userInput[key] && userInput[key].length) {
        const element = document.querySelector(key);
        console.log(
          { form, element, userInput: userInput[key] },
          'thiis salsdjlkasjdljalshfoi ashkjn:::'
        );
        if (element) {
          applyValidations(form, element, userInput[key]);
        }
      }
    });
  }
}

function applyValidations(formEl, inputEl, validations) {
  const validators = {
    required: (val) => val.trim().length > 0 || 'This field is required',
    'min characters (3)': (val) =>
      val.trim().length >= 3 || 'Minimum 3 characters required',
    'max characters (20)': (val) =>
      val.trim().length <= 20 || 'Maximum 20 characters allowed',
    'only alphabets': (val) =>
      /^[A-Za-z]+$/.test(val) || 'Only alphabets allowed',
    'only numbers': (val) => /^[0-9]+$/.test(val) || 'Only numbers allowed',
    'only alphabets and numbers': (val) =>
      /^[A-Za-z0-9]+$/.test(val) || 'Only alphabets and numbers allowed',
    password: (val) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val) ||
      'Password must include upper, lower, number (8+ chars)',
    'no future dates': (val) => {
      if (!val) return true;
      const d = new Date(val);
      return d <= new Date() || 'Date cannot be in the future';
    },
    'min age (18)': (val) => {
      if (!val) return true;
      const age = new Date().getFullYear() - new Date(val).getFullYear();
      return age >= 18 || 'Must be at least 18 years old';
    },
    'max age (100)': (val) => {
      if (!val) return true;
      const age = new Date().getFullYear() - new Date(val).getFullYear();
      return age <= 100 || 'Age cannot exceed 100 years';
    },
  };

  // Create an error message element

  let errorEl = null;

  if (inputEl.nextElementSibling?.classList.contains('error-guidy')) {
    errorEl = inputEl.nextElementSibling;
  } else {
    errorEl = document.createElement('span');
    errorEl.classList.add('error-guidy');
    errorEl.style.color = 'red';
    errorEl.style.fontSize = '0.9em';
    errorEl.style.display = 'block';
    inputEl.insertAdjacentElement('afterend', errorEl);
  }

  // Main validation logic
  const validate = () => {
    let message = '';
    for (const rule of validations) {
      const result = validators[rule] ? validators[rule](inputEl.value) : true;
      if (result !== true) {
        message = result;
        break;
      }
    }
    const isValid = !message;
    inputEl.setAttribute('aria-invalid', !isValid);
    errorEl.textContent = message;
    return isValid;
  };

  // Run validation live
  inputEl.addEventListener('input', validate);
  inputEl.addEventListener('blur', validate);

  // Block form submission globally (even if other handlers exist)
  const blockIfInvalid = (event) => {
    if (!validate()) {
      event.stopImmediatePropagation(); // stops other handlers too
      event.preventDefault();
      return false;
    }
  };

  // Attach capturing phase listener so it runs first
  formEl.addEventListener('submit', blockIfInvalid, true);
}

function resolveInputValidation(selectors = []) {
  const filterSelectors = selectors.filter((s) => s.fix);
  filterSelectors.forEach((selector) => {
    const form = document.querySelector(selector.target);
    if (form) {
      form.setAttribute('data-guidy-validate', true);
      const userInput = selector?.userInput[selector.target];
      Object.keys(userInput).forEach((key) => {
        if (userInput[key] && userInput[key].length) {
          const element = document.querySelector(key);
          console.log({ element, key });
          if (element) {
            applyValidations(form, element, userInput[key]);
          }
        }
      });
    }
  });
}

//#endregion

function handleSectionHeadingsOverview(event, element) {
  const userInput = event?.data?.payload?.userInput;
  if (element) {
    const oldTag = window.sectionHeadingGuidyPreview;
    if (oldTag) {
      oldTag.remove();
    }
    const tagName = userInput?.tag;
    const content = userInput?.content;
    const attributes = userInput?.attributes;
    if (tagName && content) {
      const newElement = document.createElement(tagName);
      const firstKindOfElem = document.querySelector(tagName);
      const classList = firstKindOfElem?.classList || [];
      newElement.style.textAlign = 'center';
      classList.forEach((cls) => {
        newElement.classList.add(cls);
      });
      window.sectionHeadingGuidyPreview = newElement;
      newElement.textContent = content;
      if (attributes?.length) {
        attributes.forEach((attr) => {
          if (attr.attribute && attr.value) {
            newElement.setAttribute(attr.attribute, attr.value);
          }
        });
      }
      element.prepend(newElement);
      newElement.scrollIntoView?.({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }
}

function resolveSectionHeadings(selectors = []) {
  const filterSelectors = selectors.filter((s) => s.fix);
  filterSelectors.forEach((selector) => {
    const element = document.querySelector(selector.target);
    if (element) {
      const userInput = selector?.userInput[selector.target];
      const tagName = userInput?.tag;
      const content = userInput?.content;
      const attributes = userInput?.attributes;
      if (tagName && content) {
        const newElement = document.createElement(tagName);
        const firstKindOfElem = document.querySelector(tagName);
        const classList = firstKindOfElem?.classList || [];
        newElement.style.textAlign = 'center';
        classList.forEach((cls) => {
          newElement.classList.add(cls);
        });
        newElement.textContent = content;
        if (attributes?.length) {
          attributes.forEach((attr) => {
            if (attr.attribute && attr.value) {
              newElement.setAttribute(attr.attribute, attr.value);
            }
          });
        }
        element.prepend(newElement);
      }
    }
  });
}
/**
 * Function to send the initial data for all the elements given in the selectors
 * @param {Event} event
 */
async function sendInitialDataForAllElements(event) {
  const selectors = event?.data?.payload?.selectors;
  const ruleId = event?.data?.payload?.ruleId;
  const isVisualMode = event?.data?.payload?.isVisualMode;
  const language =
    document.querySelector('html').getAttribute('lang') ||
    navigator.language ||
    'en';
  console.log('ruleId:::::::::::::::::::::::::', ruleId);
  switch (ruleId) {
    case 'color-contrast': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          let element = document.querySelector(selector.target);
          if (!element) {
            element = await waitForSelector(selector.target);
            if (!element) {
              return {
                textColor: '#000000',
                backgroundColor: '#FFFFFF',
                fontSize: '16px',
              };
            }
          }
          const actualBackgroundColor = getActualBackgroundColor(element);
          const styles = window.getComputedStyle(element);
          return {
            textColor: rgbToHex(styles.color),
            backgroundColor: actualBackgroundColor,
            fontSize: styles.fontSize,
          };
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'aria-hidden-focus': {
      break;
    }
    case 'form-field-labels': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          let element = document.querySelector(selector.target);
          if (!element) {
            element = await waitForSelector(selector.target);
            if (!element) {
              return {
                'aria-label': null,
              };
            }
          }
          return {
            'aria-label':
              element?.getAttribute('placeholder') ??
              element?.getAttribute('name'),
            lang:
              document.querySelector('html').getAttribute('lang') ||
              navigator.language ||
              'en',
          };
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'submit-and-reset-button-values': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          let element = document.querySelector(selector.target);
          if (!element) {
            element = await waitForSelector(selector.target);
            if (!element) {
              return {
                value: null,
              };
            }
          }
          return {
            value:
              element?.getAttribute('name') ??
              element?.getAttribute('type') ??
              element?.getAttribute('value'),
            lang:
              document.querySelector('html').getAttribute('lang') ||
              navigator.language ||
              'en',
          };
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'link-purpose-in-context':
    case 'link-name': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          let element = document.querySelector(selector.target);
          if (!element) {
            element = await waitForSelector(selector.target);
            if (!element) {
              return {
                'aria-label': null,
              };
            }
          }
          return {
            'aria-label': element?.getAttribute('name') ?? null,
            lang:
              document.querySelector('html').getAttribute('lang') ||
              navigator.language ||
              'en',
          };
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'button-name':
    case 'button-accessible-name': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          let element = document.querySelector(selector.target);
          if (!element) {
            element = await waitForSelector(selector.target);
            if (!element) {
              return {
                'aria-label': null,
              };
            }
          }
          return {
            'aria-label': element?.getAttribute('name') ?? null,
            lang:
              document.querySelector('html').getAttribute('lang') ||
              navigator.language ||
              'en',
          };
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'is-valid-by': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          let fieldName = '';
          let element = document.querySelector(selector.target);
          if (!element) {
            element = await waitForSelector(selector.target);
          }
          if (element) {
            if (
              element.getAttribute('aria-labelledby') &&
              element.getAttribute('aria-describedby')
            ) {
              const isAriaLabelledByValid = document.getElementById(
                element.getAttribute('aria-labelledby')
              );
              const isAriaDescribedByValid = document.getElementById(
                element.getAttribute('aria-describedby')
              );
              if (!isAriaLabelledByValid && !isAriaDescribedByValid) {
                fieldName = 'aria-label';
              } else if (!isAriaLabelledByValid) {
                fieldName = 'aria-label';
              } else if (!isAriaDescribedByValid) {
                fieldName = 'aria-description';
              }
            } else if (element.getAttribute('aria-labelledby')) {
              fieldName = 'aria-label';
            } else if (element.getAttribute('aria-describedby')) {
              fieldName = 'aria-description';
            }
          }
          return {
            fieldName,
            lang: language,
          };
        })
      );

      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'p-as-heading': {
      const initialData = await Promise.all(
        selectors.map(async () => {
          return {};
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'meta-viewport': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          const document = await waitForSelector(selector.target);
          return {
            content: document?.getAttribute('content') || '',
            lang: language,
          };
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'area-alt': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          return getAttributesObject(await waitForSelector(selector.target));
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'aria-allowed-attr': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          return getAttributesObject(await waitForSelector(selector.target));
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'html-has-lang':
    case 'html-lang-valid': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          const document = await waitForSelector(selector.target);
          return {
            bodyText: document?.innerText || '',
          };
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'has-multiple-h1': {
      if (isVisualMode === 'true') {
        await waitForSelector('body[guidy-rules-resolved="true"]');
        let resolvedData = [];
        const userInput = selectors?.[0]?.userInput;
        if (userInput) {
          resolvedData = await Promise.all(
            Object.keys(userInput).map(async (key) => {
              const element =
                window.GuidyRuleFixeData[key] || document.querySelector(key);
              if (element) {
                const uniqueId = await generateID(element.textContent);
                element.setAttribute('data-guidy-h1-id', uniqueId);
                return {
                  textContent: element.textContent,
                  outerHTML: element.outerHTML,
                  lang: language,
                  uniqueId,
                  selector: key,
                  tagName: element.tagName.toLowerCase(),
                };
              }
            })
          );
        }
        sendMessageToDashboard('initialData', [resolvedData]);
        break;
      }
      const h1Elements = document.querySelectorAll('h1');
      const filteredH1Elements = [...h1Elements].filter((h1) =>
        canElementEverBeVisible(h1)
      );
      const initialData = await Promise.all(
        filteredH1Elements.map(async (h1Element) => {
          const selector = stableShadowAwareSelector(h1Element);
          const uniqueId = await generateID(h1Element.textContent);
          h1Element.setAttribute('data-guidy-h1-id', uniqueId);
          return {
            textContent: h1Element.textContent,
            outerHTML: h1Element.outerHTML,
            lang: language,
            uniqueId,
            selector,
          };
        })
      );
      sendMessageToDashboard('initialData', [initialData]);
      break;
    }
    case 'duplicate-id-aria': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          const element = document.querySelector(selector.target);
          if (element) {
            const uniqueId = await generateID(element.textContent);
            element.setAttribute('data-guidy-h1-id', uniqueId);
            return {
              elementId: element.id,
              outerHTML: element.outerHTML,
              lang: language,
            };
          }
        })
      );

      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'input-validation': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          const element = document.querySelector(selector.target);
          if (element) {
            const inputs = element.querySelectorAll('input, textarea, select');
            const inputData = Array.from(inputs)
              .filter(
                (input) =>
                  ![
                    'button',
                    'submit',
                    'reset',
                    'image',
                    'file',
                    'hidden',
                  ].includes(input.type)
              )
              .map((input) => {
                return {
                  type: input.type || input.tagName.toLowerCase(),
                  placeholder: input.placeholder || null,
                  id: input.id || null,
                  name: input.name || null,
                  selector: stableShadowAwareSelector(input),
                  formSelector: selector.target,
                };
              });
            return inputData;
          }
        })
      );
      console.log({ initialData }, ':::::::::::::::::::::::::::::::::::::::::');
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    case 'section-headings': {
      const initialData = await Promise.all(
        selectors.map(async (selector) => {
          const target = selector.target;
          const sectionElement = await waitForSelector(target);
          if (sectionElement) {
            return {
              textContent: sectionElement.textContent,
              outerHTML: sectionElement.outerHTML,
              lang: language,
            };
          }
        })
      );
      sendMessageToDashboard('initialData', initialData);
      break;
    }
    default:
      break;
  }
}

function getAttributesObject(element) {
  if (!element) {
    return {};
  }
  const attrs = element.attributes;
  const obj = {};

  for (let attr of attrs) {
    obj[attr.name] = attr.value;
  }

  return obj;
}

async function generateID(e) {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000);
  const uniqueKey = timestamp.toString(36) + randomNum.toString(36);

  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(e + uniqueKey)
  );
  return Array.from(new Uint8Array(hash))
    .map((e) => e.toString(16))
    .join('')
    .slice(20);
}

function esc(str) {
  return CSS.escape(str);
}

function stableUniqueSelector(el) {
  if (!el || el.nodeType !== 1) return '';

  const root = (el.getRootNode && el.getRootNode()) || document;

  // 1. Unique ID wins immediately
  if (el.id) {
    const idSel = `#${esc(el.id)}`;
    if (root.querySelectorAll(idSel).length === 1) {
      return idSel;
    }
  }

  // 2. Base tag
  let sel = el.tagName.toLowerCase();

  // 3. Sort classes alphabetically for deterministic output
  if (el.classList && el.classList.length) {
    const classes = Array.from(el.classList)
      .sort()
      .map((c) => `.${esc(c)}`)
      .join('');
    sel += classes;
  }

  // 4. Add nth-child if necessary
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const sameTagSiblings = siblings.filter((s) => s.tagName === el.tagName);
    if (sameTagSiblings.length > 1) {
      sel += `:nth-child(${siblings.indexOf(el) + 1})`;
    }
  }

  // 5. Check uniqueness and prepend parents until unique
  let testSel = sel;
  let currentParent = el.parentElement;

  while (root.querySelectorAll(testSel).length !== 1 && currentParent) {
    let parentSel = currentParent.tagName.toLowerCase();

    // Prefer ID if unique
    if (currentParent.id) {
      const pid = `#${esc(currentParent.id)}`;
      if (root.querySelectorAll(pid).length === 1) {
        parentSel = pid;
      } else {
        // fallback to tag + classes
        parentSel = currentParent.tagName.toLowerCase();
        if (currentParent.classList && currentParent.classList.length) {
          parentSel += Array.from(currentParent.classList)
            .sort()
            .map((cls) => `.${esc(cls)}`)
            .join('');
        }
      }
    } else if (currentParent.classList && currentParent.classList.length) {
      parentSel += Array.from(currentParent.classList)
        .sort()
        .map((cls) => `.${esc(cls)}`)
        .join('');
    }

    testSel = `${parentSel} > ${testSel}`;
    currentParent = currentParent.parentElement;
  }

  return testSel;
}

function stableShadowAwareSelector(el) {
  if (!el || el.nodeType !== 1) return '';

  let node = el;
  let root = node.getRootNode();
  const stack = [];

  while (root && root.nodeType === 11) {
    // shadow root fragment
    stack.unshift(node);
    node = root.host;
    root = node.getRootNode();
  }
  stack.unshift(node);

  const selectors = stack.map((n) => stableUniqueSelector(n));
  // Return array for shadow boundaries or single string if only one
  return selectors.length === 1 ? selectors[0] : selectors;
}

function canElementEverBeVisible(el) {
  if (!el) return false;
  if (!(el instanceof Element)) return true;
  const style = window.getComputedStyle(el);

  if (style.display === 'none') return false;

  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;

  const vh = window.innerHeight;
  const vw = window.innerWidth;

  const inViewport =
    rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw;

  // Fixed elements can ONLY be visible if currently in viewport
  if (style.position === 'fixed') {
    return inViewport;
  }

  const doc = document.documentElement;

  const intersectsPage =
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < doc.scrollHeight &&
    rect.left < doc.scrollWidth;

  return intersectsPage;
}
