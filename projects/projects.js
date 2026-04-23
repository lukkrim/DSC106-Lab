import { fetchJSON, renderProjects, countProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const numberProjects = countProjects(projects);

const titleEl = document.querySelector('.projects-title');
if (titleEl) {
  titleEl.textContent = `${numberProjects} Project${numberProjects === 1 ? '' : 's'}`;
}
renderProjects(projects, projectsContainer, 'h2');