// Entry point: registers custom elements and card metadata

import { VERSION } from './constants.js';
import { WindspeedHeatmapCard } from './windspeed-heatmap-card.js';
import { WindspeedHeatmapCardEditor } from './editor.js';

// Register custom elements
customElements.define('windspeed-heatmap-card-editor', WindspeedHeatmapCardEditor);
customElements.define('windspeed-heatmap-card', WindspeedHeatmapCard);

// Register with Home Assistant custom cards
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'windspeed-heatmap-card',
  name: 'Windspeed Heatmap Card',
  description: 'Display wind speed history as a color-coded heatmap using Beaufort scale colors'
});

// Console banner
console.info(
  '%c WINDSPEED-HEATMAP-CARD %c v' + VERSION + ' ',
  'color: lightblue; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);
