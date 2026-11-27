import './style.css';
import { startRouter } from './router';

const appElement = document.querySelector<HTMLDivElement>('[data-js-app]')!;
startRouter(appElement);
