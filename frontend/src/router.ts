import { renderAboutPage } from "./pages/about";

const pageRenderers: Record<string, (container: HTMLElement) => void> = {
  '/about': renderAboutPage,
};

const routes = [
  { path: '/about', title: 'О приложении' },
  { path: '/orders', title: 'Заказы' },
  { path: '/machines', title: 'Станки' },
  { path: '/schedule', title: 'Расписание' },
  { path: '/downtimes', title: 'Простои' },
] as const;

const homePath = '/about';

function createRouteLink(path: string, title: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = path;
  link.dataset.routeLink = '';
  link.textContent = title;
  return link;
}

export function startRouter(app: HTMLElement): void {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  const brand = createRouteLink(homePath, 'FactoryFlow');
  brand.className = 'brand';
  const logo = document.createElement('img');
  logo.src = '/favicon.svg';
  logo.alt = '';
  logo.width = 24;
  logo.height = 24;
  brand.prepend(logo);

  const navigation = document.createElement('nav');
  navigation.className = 'navigation';
  navigation.setAttribute('aria-label', 'Основное меню');
  const navigationLinks = routes.map(({ path, title }) =>
    createRouteLink(path, title),
  );
  navigation.append(...navigationLinks);
  sidebar.append(brand, navigation);

  const page = document.createElement('main');
  page.className = 'page';
  app.replaceChildren(sidebar, page);

  function render(focusHeading = false): void {
    if (window.location.pathname === '/') {
      const { search, hash } = window.location;
      window.history.replaceState(
        window.history.state,
        '',
        `${homePath}${search}${hash}`,
      );
    }

    const path = window.location.pathname.replace(/\/$/, '');
    const route = routes.find((candidate) => candidate.path === path);
    const title = route?.title ?? 'Страница не найдена';
    document.title = `${title} | FactoryFlow`;

    for (const link of navigationLinks) {
      if (link.pathname === route?.path) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    }

    const renderPage = pageRenderers[path];

    if (renderPage) {
      page.replaceChildren();
      renderPage(page);
    } else {
      const heading = document.createElement('h1');
      heading.textContent = title;
      heading.tabIndex = -1;
      page.replaceChildren(heading);

      if (!route) {
        const message = document.createElement('p');
        message.textContent = 'Ошибка 404';
        page.append(message, createRouteLink(homePath, 'Перейти к расписанию'));
      }
    }

    if (focusHeading) {
      const heading = page.querySelector<HTMLHeadingElement>('h1');
      heading?.focus({ preventScroll: true });
    }
  }

  app.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !(event.target instanceof Element)
    ) {
      return;
    }

    const link = event.target.closest<HTMLAnchorElement>('a[data-route-link]');
    if (!link) {
      return;
    }

    event.preventDefault();
    if (link.href === window.location.href) {
      return;
    }

    window.history.pushState(null, '', link.href);
    render(true);
    window.scrollTo(0, 0);
  });

  window.addEventListener('popstate', () => render(true));
  render();
}
