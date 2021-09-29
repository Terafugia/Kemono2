import { isLoggedIn } from "@wp/js/account";
import { createComponent } from "@wp/components";

/**
 * TODOs: 
 * - move global nav into separate component.
 * @param {HTMLElement} header 
 * @param {SVGAnimatedBoolean} isLoggedIn 
 */
export function initShell(header) {
  /**
   * @type {{ current?: HTMLLIElement }}
   */
  const selection = {
    current: undefined
  }
  /**
   * @type {HTMLElement}
   */
  const globalNav = header.querySelector(".global-nav");
  const siteLinks = globalNav.querySelector(".global-nav__site");
  const navSwitch = siteLinks.querySelector(".global-nav__switch");
  /**
   * @type {HTMLUListElement}
   */
  const accountNavList = globalNav.querySelector(`.global-nav__item--account .global-nav__list`);
 
  globalNav.addEventListener("click", handleNavClicks(selection));
  window.addEventListener("keydown", (event) => {
    if (selection.current && event.key === "Escape") {
      selection.current.classList.toggle("global-nav__item--open", false);
      selection.current = undefined;
    }
  });

  window.addEventListener("click", (event) => {
    /**
     * @type {HTMLElement}
     */
    if (selection.current && !event.target.closest(".global-nav")) {
      selection.current.classList.toggle("global-nav__item--open", false);
      selection.current = undefined;
    }
  });

  navSwitch.addEventListener("click", (event) => {
    siteLinks.classList.toggle("global-nav__site--open");
  })

  if (isLoggedIn) {
    const items = [
      // GlobalNavigationItem({ link: "/account", text: "Account page" }),
      GlobalNavigationItem({ link: "/favorites", text: "Favorites" }),
      (() => {
        const item = GlobalNavigationItem({ link: "/account/logout", text: "Logout"});
        item.addEventListener("click", (event) => {
          event.preventDefault();
          localStorage.removeItem('logged_in');
          localStorage.removeItem('favs');
          localStorage.removeItem('post_favs');
          location.href = '/account/logout';
        })

        return item;
      })(),
    ];

    accountNavList.append(...items);

  } else {
    const items = [
      GlobalNavigationItem({ link: "/account/login", text: "Login" }),
      GlobalNavigationItem({ link: "/account/register", text: "Register" }),
    ];

    accountNavList.append(...items);
  }
}

/**
 * @param {{ current: HTMLLIElement }} selection
 * @returns {Events.NavClick}
 */
function handleNavClicks(selection) {
  return (event) => {
    if (event.target.classList.contains("global-nav__button")) {
      const item = event.target.parentElement;

      if (selection.current && item !== selection.current) {
        selection.current.classList.remove("global-nav__item--open");
      }

      if (item.classList.contains("global-nav__item--open")) {
        item.classList.toggle("global-nav__item--open", false);
      } else {
        item.classList.toggle("global-nav__item--open", true);
        selection.current = item;
      }
    }
  }
}

/**
 * @type {Component.GlobalNavigation.Item.Callback}
 */
function GlobalNavigationItem({ element, ...props }) {
  const component = element
    ? element
    : initFromScratch(props)
  ;

  return component;
}

/**
 * @type {Component.GlobalNavigation.Item.InitFromScratch}
 */
function initFromScratch({ link, text = link, className }) {
  /**
   * @type {HTMLLIElement}
   */
  const component = createComponent("navigation__item global-nav__item");
  /**
   * @type {HTMLAnchorElement}
   */
  const anchour = component.querySelector(".navigation__link");
  
  if (className) {
    component.classList.add(className);
  }

  anchour.href = link;
  anchour.textContent = text;

  return component;
}
