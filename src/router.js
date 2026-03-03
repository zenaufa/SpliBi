// SpliBi - Router Module
// Lightweight hash-based SPA router

import { getSetting } from './db.js';

export class Router {
  constructor() {
    this.routes = {};
    this.currentPage = null;
    this.mainContent = null;
    this.pageTitle = null;
    this.backBtn = null;
    this.bottomNav = null;
    this.topBar = null;
  }

  init() {
    this.mainContent = document.getElementById('mainContent');
    this.pageTitle = document.getElementById('pageTitle');
    this.backBtn = document.getElementById('backBtn');
    this.bottomNav = document.getElementById('bottomNav');
    this.topBar = document.getElementById('topBar');

    window.addEventListener('hashchange', () => this.handleRoute());
    this.backBtn.addEventListener('click', () => window.history.back());

    // Initial route
    this.handleRoute();
  }

  register(path, { title, render, hideNav = false, showBack = false, hideTopBar = false }) {
    this.routes[path] = { title, render, hideNav, showBack, hideTopBar };
  }

  navigate(path) {
    window.location.hash = path;
  }

  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    // Parse path and params
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');

    // Onboarding check: redirect first-time users
    if (path !== '/onboarding') {
      const onboardingComplete = await getSetting('onboardingComplete', false);
      if (!onboardingComplete) {
        this.navigate('/onboarding');
        return;
      }
    }

    // Find matching route
    let route = this.routes[path];
    let routeParams = {};

    if (!route) {
      // Check for dynamic routes like /split/:id
      for (const [pattern, routeConfig] of Object.entries(this.routes)) {
        const regex = this.pathToRegex(pattern);
        const match = path.match(regex);
        if (match) {
          route = routeConfig;
          const keys = this.extractParams(pattern);
          keys.forEach((key, i) => {
            routeParams[key] = match[i + 1];
          });
          break;
        }
      }
    }

    if (!route) {
      this.navigate('/');
      return;
    }

    // Update UI
    this.pageTitle.textContent = route.title;

    if (route.showBack) {
      this.backBtn.classList.remove('hidden');
    } else {
      this.backBtn.classList.add('hidden');
    }

    if (route.hideNav) {
      this.bottomNav.classList.add('hidden');
    } else {
      this.bottomNav.classList.remove('hidden');
    }

    if (route.hideTopBar) {
      this.topBar.classList.add('hidden');
      this.mainContent.style.marginTop = '0';
    } else {
      this.topBar.classList.remove('hidden');
      this.mainContent.style.marginTop = '';
    }

    // Update active nav item
    this.updateActiveNav(path);

    // Render page
    this.mainContent.innerHTML = '';
    const pageEl = document.createElement('div');
    pageEl.className = 'page';
    this.mainContent.appendChild(pageEl);

    if (typeof route.render === 'function') {
      await route.render(pageEl, { ...routeParams, ...Object.fromEntries(params) });
    }

    // Scroll to top
    this.mainContent.scrollTop = 0;
  }

  updateActiveNav(path) {
    const navItems = this.bottomNav.querySelectorAll('.nav-item');
    const pageMap = {
      '/': 'home',
      '/history': 'history',
      '/add': 'add',
      '/groups': 'groups',
      '/settings': 'settings'
    };

    const activePage = pageMap[path] || '';

    navItems.forEach(item => {
      if (item.dataset.page === activePage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  pathToRegex(path) {
    const pattern = path.replace(/:[^/]+/g, '([^/]+)');
    return new RegExp(`^${pattern}$`);
  }

  extractParams(path) {
    const matches = path.match(/:([^/]+)/g) || [];
    return matches.map(m => m.slice(1));
  }
}

export const router = new Router();
