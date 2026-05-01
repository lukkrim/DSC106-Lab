import { fetchJSON, renderProjects, countProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const numberProjects = countProjects(projects);

const titleEl = document.querySelector('.projects-title');
if (titleEl) {
  titleEl.textContent = `${numberProjects} Project${numberProjects === 1 ? '' : 's'}`;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Application state
let query = '';
let selectedYear = null;
let currentProjects = projects;

let searchInput = document.querySelector('.searchBar');


function updateCurrentProjects() {
  let result = projects;
  if (query) {
    result = result.filter((p) => {
      let values = Object.values(p).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }
  if (selectedYear !== null) {
    result = result.filter((p) => p.year === selectedYear);
  }
  currentProjects = result;
}


function getSearchedProjects() {
  if (!query) return projects;
  return projects.filter((p) => {
    let values = Object.values(p).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}


function rerender() {
  let searched = getSearchedProjects();
  if (selectedYear !== null && !searched.some((p) => p.year === selectedYear)) {
    selectedYear = null;
  }
  updateCurrentProjects();
  renderProjects(currentProjects, projectsContainer, 'h2');
  renderPieChart(searched);
}

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  let legend = d3.select('.legend');

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  newArcs.forEach((arc, idx) => {
    let isSelected = newData[idx].label === selectedYear;
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .attr('class', isSelected ? 'selected' : '')
      .on('click', () => {
        let clickedYear = newData[idx].label;
        selectedYear = selectedYear === clickedYear ? null : clickedYear;

        // Update classes in place (no re-render) so the hover state and the
        // path under the cursor are preserved.
        svg
          .selectAll('path')
          .attr('class', (_, i) =>
            newData[i].label === selectedYear ? 'selected' : '',
          );

        legend
          .selectAll('li')
          .attr('class', (_, i) =>
            newData[i].label === selectedYear ? 'selected legend-item' : 'legend-item',
          );

        // Re-render only the project list (not the pie chart)
        updateCurrentProjects();
        renderProjects(currentProjects, projectsContainer, 'h2');
      });
  });

  newData.forEach((d, idx) => {
    let isSelected = d.label === selectedYear;
    legend
      .append('li')
      .attr('class', isSelected ? 'selected legend-item' : 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  rerender();
});

rerender();
