export function renderAboutPage(container: HTMLElement): void {
  const header = document.createElement('header');
  header.classList.add('about__header');
  container.append(header);

  const title = document.createElement('h1');
  title.classList.add('about__title');
  title.textContent = 'FactoryFlow';
  header.append(title);

  const tagline = document.createElement('p');
  tagline.classList.add('about__tagline');
  tagline.textContent =
    'Production equipment capacity planning for small workshops';
  header.append(tagline);

  const mainElement = document.createElement('main');
  mainElement.classList.add('about__main');
  container.append(mainElement);

  const features = document.createElement('section');
  features.classList.add('about__section');
  mainElement.append(features);

  const featuresTitle = document.createElement('h2');
  featuresTitle.classList.add('about__section-title');
  featuresTitle.textContent = 'Features';
  features.append(featuresTitle);

  const featuresList = document.createElement('ul');
  featuresList.classList.add('about__list');
  features.append(featuresList);

  const featureItemList = [
    'Станки и их статус',
    'Заказы',
    'Операции',
    'Расписание',
    'Простои',
  ];
  for (const item of featureItemList) {
    const featureItem = document.createElement('li');
    featureItem.classList.add('about__item');
    featureItem.textContent = item;
    featuresList.append(featureItem);
  }

  const team = document.createElement('section');
  team.classList.add('about__section');
  mainElement.append(team);

  const teamTitle = document.createElement('h2');
  teamTitle.classList.add('about__section-title');
  teamTitle.textContent = 'Team';
  team.append(teamTitle);

  const teamList = document.createElement('ul');
  teamList.classList.add('about__list');
  team.append(teamList);

  const teamItemList = [
    'Павел — бэкенд: REST API, Prisma, проверка конфликтов расписания',
    'Мансур — фронтенд: страницы, Timeline, API-клиент',
  ];
  for (const item of teamItemList) {
    const teamItem = document.createElement('li');
    teamItem.classList.add('about__item');
    teamItem.textContent = item;
    teamList.append(teamItem);
  }

  const footerElement = document.createElement('footer');
  footerElement.classList.add('about__footer');
  container.append(footerElement);

  const repoLink = document.createElement('a');
  repoLink.href = 'https://github.com/gordienkodev/factoryflow';
  repoLink.target = '_blank';
  repoLink.rel = 'noopener';
  repoLink.classList.add('about__link');
  repoLink.textContent = 'https://github.com/gordienkodev/factoryflow';
  footerElement.append(repoLink);
}
