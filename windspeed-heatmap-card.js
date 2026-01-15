/* Last modified: 15-Jan-2026 14:42 */

// Register with Home Assistant custom cards
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'windspeed-heatmap-card',
  name: 'Windspeed Heatmap Card',
  description: 'Display wind speed history as a color-coded heatmap using Beaufort scale colors'
});

console.info(
  '%c WINDSPEED-HEATMAP-CARD %c v0.3.0 ',
  'color: lightblue; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);

// Default color thresholds based on Beaufort scale (MPH)
const DEFAULT_THRESHOLDS = [
  { value: 0,  color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm (< 1 mph)
  { value: 1,  color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air (1-3 mph)
  { value: 4,  color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze (4-7 mph)
  { value: 8,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze (8-12 mph)
  { value: 13, color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze (13-18 mph)
  { value: 19, color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze (19-24 mph)
  { value: 25, color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze (25-31 mph)
  { value: 32, color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale (32-38 mph)
  { value: 39, color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale (39-46 mph)
  { value: 47, color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale (47-54 mph)
  { value: 55, color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm (55-63 mph)
  { value: 64, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm (64-72 mph)
  { value: 73, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force (>= 73 mph)
];

class WindspeedHeatmapCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Configuration and state
    this._config = {};
    this._hass = null;

    // Data caching
    this._historyData = null;
    this._processedData = null;
    this._lastFetch = 0;

    // Navigation state
    this._viewOffset = 0;  // Days offset from current (0=today, -7=week ago)

    // UI state
    this._isLoading = false;
    this._error = null;
    this._interval = null;

    // Initialize Shadow DOM
    this._initializeStyles();
    this._content = document.createElement('ha-card');
    this.shadowRoot.appendChild(this._content);

    // Event delegation for all clicks
    this._content.addEventListener('click', this._handleClick.bind(this));
  }

  // Home Assistant required method: set card configuration
  setConfig(config) {
    // Validate required fields
    if (!config.entity) {
      throw new Error("'entity' is required (wind speed sensor)");
    }

    // Validate time_interval
    const validIntervals = [1, 2, 3, 4, 6, 8, 12, 24];
    if (config.time_interval && !validIntervals.includes(config.time_interval)) {
      throw new Error(`time_interval must be one of: ${validIntervals.join(', ')}`);
    }

    // Validate days
    if (config.days && (config.days < 1 || config.days > 30)) {
      throw new Error('days must be between 1 and 30');
    }

    // Validate cell sizing options
    if (config.cell_height !== undefined) {
      const height = typeof config.cell_height === 'number' ? config.cell_height : parseFloat(config.cell_height);
      if (isNaN(height) || height < 10 || height > 200) {
        throw new Error('cell_height must be between 10 and 200 pixels');
      }
    }

    if (config.cell_padding !== undefined) {
      const padding = typeof config.cell_padding === 'number' ? config.cell_padding : parseFloat(config.cell_padding);
      if (isNaN(padding) || padding < 0 || padding > 20) {
        throw new Error('cell_padding must be between 0 and 20 pixels');
      }
    }

    if (config.cell_gap !== undefined) {
      const gap = typeof config.cell_gap === 'number' ? config.cell_gap : parseFloat(config.cell_gap);
      if (isNaN(gap) || gap < 0 || gap > 20) {
        throw new Error('cell_gap must be between 0 and 20 pixels');
      }
    }

    if (config.cell_font_size !== undefined) {
      const fontSize = typeof config.cell_font_size === 'number' ? config.cell_font_size : parseFloat(config.cell_font_size);
      if (isNaN(fontSize) || fontSize < 6 || fontSize > 24) {
        throw new Error('cell_font_size must be between 6 and 24 pixels');
      }
    }

    if (config.cell_width !== undefined && typeof config.cell_width !== 'string') {
      const width = parseFloat(config.cell_width);
      if (isNaN(width) || width < 10 || width > 500) {
        throw new Error('cell_width as number must be between 10 and 500 pixels');
      }
    }

    // Build configuration with defaults
    this._config = {
      // Required
      entity: config.entity,

      // Optional entities
      direction_entity: config.direction_entity || null,

      // Display options
      title: config.title || 'Wind Speed History',
      days: config.days || 7,
      time_interval: config.time_interval || 2,
      time_format: config.time_format || '24',  // '12' or '24'

      // Units
      unit: config.unit || null,

      // Color thresholds
      color_thresholds: config.color_thresholds || DEFAULT_THRESHOLDS.slice(),

      // Direction display
      show_direction: config.show_direction !== false,
      direction_format: config.direction_format || 'arrow',  // 'arrow', 'degrees', 'cardinal'

      // Refresh
      refresh_interval: config.refresh_interval || 300,  // Seconds (5 min default)

      // Interaction
      click_action: config.click_action || 'more-info',  // 'none', 'more-info', 'tooltip'

      // Display options
      show_entity_name: config.show_entity_name || false,

      // Cell sizing options
      cell_height: config.cell_height !== undefined ? config.cell_height : 36,
      cell_width: config.cell_width !== undefined ? config.cell_width : '1fr',
      cell_padding: config.cell_padding !== undefined ? config.cell_padding : 2,
      cell_gap: config.cell_gap !== undefined ? config.cell_gap : 2,
      cell_font_size: config.cell_font_size !== undefined ? config.cell_font_size : 11,
      compact: config.compact || false,

      // Visual options
      rounded_corners: config.rounded_corners !== false,  // Default true
      show_legend: config.show_legend || false  // Default false
    };

    // Sort thresholds by value (ascending) - create mutable copy to avoid "read-only" errors
    this._config.color_thresholds = [...this._config.color_thresholds].sort((a, b) => a.value - b.value);

    // Set up refresh interval
    if (this._hass) {
      this._clearAndSetInterval();
    }
  }

  // Home Assistant required method: receive hass object updates
  set hass(hass) {
    this._hass = hass;

    if (!this._config || !this.isConnected) return;

    // Only fetch if viewing current data and data is stale
    if (this._viewOffset === 0 && this._isDataStale()) {
      this._fetchHistoryData();
    }
  }

  // Home Assistant required method: return card height hint
  getCardSize() {
    // Calculate based on number of rows (time slots) and dynamic cell height
    const rows = this._processedData ? this._processedData.rows.length : 12;
    const sizing = this._getEffectiveSizing();
    const cellHeightPx = parseFloat(sizing.cellHeight) || 36;

    // Each row = cellHeight, plus header ~60px, plus footer ~40px, divided by 50px per card unit
    return Math.ceil((rows * cellHeightPx + 100) / 50);
  }

  // Lifecycle: component connected to DOM
  connectedCallback() {
    if (this._config && this._hass) {
      this._clearAndSetInterval();
    }
  }

  // Lifecycle: component disconnected from DOM
  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  // Initialize and inject CSS styles into Shadow DOM
  _initializeStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Main container */
      ha-card {
        display: block;
        padding: 0;
        overflow: hidden;
      }

      /* Card header with title and navigation */
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid var(--divider-color);
        flex-wrap: wrap;
        gap: 8px;
      }

      .title {
        font-size: 20px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      /* Navigation controls */
      .nav-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .nav-btn {
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        border: none;
        border-radius: 4px;
        width: 32px;
        height: 32px;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s ease;
      }

      .nav-btn:hover:not(:disabled) {
        opacity: 0.8;
      }

      .nav-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .nav-btn:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .nav-btn-current {
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s ease;
      }

      .nav-btn-current:hover {
        opacity: 0.8;
      }

      .nav-btn-current:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .nav-btn-current.hidden {
        visibility: hidden;
        pointer-events: none;
      }

      .date-range {
        font-size: 14px;
        color: var(--secondary-text-color);
        min-width: 120px;
        text-align: center;
      }

      /* Heatmap grid container */
      .heatmap-grid {
        padding: 16px;
      }

      .month-header {
        text-align: center;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-bottom: 12px;
      }

      /* Grid wrapper with time labels and data grid */
      .grid-wrapper {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px;
        align-items: start;
      }

      /* Time labels column */
      .time-labels {
        display: flex;
        flex-direction: column;
        gap: var(--cell-gap, 2px);
        padding-top: 28px;  /* Align with data grid (after date headers) */
      }

      .time-label {
        height: var(--cell-height, 36px);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
        font-size: var(--cell-font-size, 11px);
        color: var(--secondary-text-color);
        font-weight: 500;
      }

      /* Data grid container */
      .data-grid-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      /* Date headers row */
      .date-headers {
        display: grid;
        grid-template-columns: repeat(var(--days-count, 7), 1fr);
        gap: 2px;
        margin-bottom: 4px;
      }

      .date-header {
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        color: var(--primary-text-color);
        padding: 4px;
      }

      /* Data cells grid */
      .data-grid {
        display: grid;
        grid-template-columns: repeat(var(--days-count, 7), var(--cell-width, 1fr));
        grid-auto-rows: var(--cell-height, 36px);
        gap: var(--cell-gap, 2px);
      }

      /* Individual cells */
      .cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: var(--cell-border-radius, 4px);
        cursor: pointer;
        transition: transform 0.1s ease, box-shadow 0.1s ease;
        position: relative;
        font-size: var(--cell-font-size, 11px);
        padding: var(--cell-padding, 2px);
        box-sizing: border-box;
      }

      .cell:hover:not(.no-data) {
        transform: scale(1.08);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 10;
      }

      .cell:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .cell.no-data {
        background-color: var(--disabled-color, #f0f0f0);
        cursor: default;
        opacity: 0.4;
      }

      .cell.no-data:hover {
        transform: none;
        box-shadow: none;
      }

      .speed {
        font-weight: bold;
        line-height: 1.1;
      }

      .direction {
        font-size: 10px;
        line-height: 1;
        margin-top: 2px;
      }

      /* Footer with statistics */
      .footer {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid var(--divider-color);
        background: var(--card-background-color);
        font-size: 13px;
        color: var(--secondary-text-color);
      }

      .footer-stats {
        display: flex;
        justify-content: space-around;
        align-items: center;
      }

      .footer-stats span {
        font-weight: 500;
      }

      .entity-name {
        text-align: center;
        font-size: 11px;
        color: var(--secondary-text-color);
        opacity: 0.8;
      }

      /* Loading state */
      .loading {
        text-align: center;
        padding: 32px;
        color: var(--secondary-text-color);
      }

      .loading-spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 3px solid var(--divider-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Error message */
      .error-message {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        margin: 16px;
        background: rgba(244, 67, 54, 0.1);
        color: var(--error-color, #f44336);
        border-radius: 4px;
        border-left: 4px solid var(--error-color, #f44336);
      }

      .error-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .error-text {
        flex: 1;
      }

      .error-details {
        font-size: 11px;
        margin-top: 4px;
        opacity: 0.8;
      }

      /* Tooltip */
      .tooltip {
        position: absolute;
        z-index: 1000;
        background: var(--card-background-color, white);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
        padding: 8px 12px;
        font-size: 12px;
        pointer-events: none;
        max-width: 250px;
        line-height: 1.4;
      }

      .tooltip div {
        margin: 2px 0;
      }

      .tooltip strong {
        color: var(--primary-text-color);
      }

      /* Legend bar */
      .legend {
        padding: 8px 16px 12px;
        border-top: 1px solid var(--divider-color);
      }

      .legend-bar {
        height: 12px;
        border-radius: 3px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      }

      .legend-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        font-size: 9px;
        color: var(--secondary-text-color);
      }

      .legend-labels span {
        flex: 1;
        text-align: center;
      }

      .legend-labels span:first-child {
        text-align: left;
      }

      .legend-labels span:last-child {
        text-align: right;
      }

      /* Responsive adjustments */
      @media (max-width: 600px) {
        .data-grid {
          grid-auto-rows: calc(var(--cell-height, 36px) * 0.83);
        }

        .time-label {
          height: calc(var(--cell-height, 36px) * 0.83);
          font-size: calc(var(--cell-font-size, 11px) * 0.91);
        }

        .cell {
          font-size: calc(var(--cell-font-size, 11px) * 0.91);
        }

        .direction {
          display: none;
        }

        .date-header {
          font-size: 11px;
        }
      }

      @media (max-width: 400px) {
        .card-header {
          flex-direction: column;
          align-items: stretch;
        }

        .nav-controls {
          justify-content: center;
        }
      }

      /* Accessibility: High contrast mode support */
      @media (prefers-contrast: high) {
        .cell:not(.no-data) {
          border: 1px solid currentColor;
        }
      }

      /* Accessibility: Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .cell,
        .nav-btn,
        .loading-spinner {
          transition: none;
          animation: none;
        }
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  // Set up or refresh the data fetch interval
  _clearAndSetInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }

    // Fetch immediately
    this._fetchHistoryData();

    // Set up periodic refresh (only when viewing current data)
    const intervalMs = this._config.refresh_interval * 1000;
    this._interval = setInterval(() => {
      if (this._viewOffset === 0) {
        this._fetchHistoryData();
      }
    }, intervalMs);
  }

  // Check if cached data is stale
  _isDataStale() {
    if (!this._historyData || !this._lastFetch) return true;

    const age = Date.now() - this._lastFetch;
    const maxAge = this._config.refresh_interval * 1000;

    return age > maxAge;
  }

  // Fetch historical data from Home Assistant
  async _fetchHistoryData() {
    if (this._isLoading) {
      console.log('Windspeed Heatmap: Already loading, skipping duplicate fetch');
      return;
    }

    this._isLoading = true;
    this._error = null;
    this._render();  // Show loading state

    console.log('Windspeed Heatmap: Starting data fetch...');

    try {
      // Calculate date range in LOCAL timezone, excluding current incomplete interval
      const now = new Date();

      let endTime;

      if (this._viewOffset === 0) {
        // Current view: use last complete interval
        const currentHour = now.getHours();
        const intervalHours = this._config.time_interval;
        const lastCompleteHour = Math.floor(currentHour / intervalHours) * intervalHours;
        endTime = new Date(now);
        endTime.setHours(lastCompleteHour, 0, 0, 0);
      } else {
        // Historical view: use end of the target day
        endTime = new Date(now);
        endTime.setDate(endTime.getDate() + this._viewOffset);
        endTime.setHours(23, 59, 59, 999);  // End of day
      }

      // Calculate start time (N days before end time)
      const startTime = new Date(endTime);
      startTime.setDate(startTime.getDate() - this._config.days + 1);
      startTime.setHours(0, 0, 0, 0);  // Start of first day at midnight

      console.log(`Windspeed Heatmap: Fetching from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`);
      console.log(`Windspeed Heatmap: Current time: ${now.toLocaleString()}, Last complete interval: ${endTime.toLocaleString()}`);

      // Convert local times to ISO strings (the API returns data in UTC, so we send UTC times)
      const startTimeISO = startTime.toISOString();
      const endTimeISO = endTime.toISOString();

      console.log(`Windspeed Heatmap: API times - Start: ${startTimeISO}, End: ${endTimeISO}`);

      // Build API URLs - fetch both in parallel for better performance
      // Note: Not using significant_changes_only as it can be slow in some HA setups
      const speedUrl = `history/period/${startTimeISO}?` +
        `filter_entity_id=${this._config.entity}&` +
        `end_time=${endTimeISO}&` +
        `minimal_response&no_attributes`;

      const fetchPromises = [this._hass.callApi('GET', speedUrl)];

      // Add direction fetch if configured
      if (this._config.direction_entity && this._config.show_direction) {
        const directionUrl = `history/period/${startTimeISO}?` +
          `filter_entity_id=${this._config.direction_entity}&` +
          `end_time=${endTimeISO}&` +
          `minimal_response&no_attributes`;
        fetchPromises.push(this._hass.callApi('GET', directionUrl));
      }

      // Fetch with timeout to prevent hanging
      const fetchWithTimeout = (promise, timeoutMs = 30000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout after 30 seconds')), timeoutMs)
          )
        ]);
      };

      // Fetch in parallel with timeout
      const startFetch = Date.now();
      const results = await fetchWithTimeout(Promise.all(fetchPromises));
      const fetchDuration = ((Date.now() - startFetch) / 1000).toFixed(1);

      console.log(`Windspeed Heatmap: Received ${results[0]?.[0]?.length || 0} speed points, ${results[1]?.[0]?.length || 0} direction points in ${fetchDuration}s`);

      this._historyData = {
        speed: results[0]?.[0] || [],
        direction: results[1] ? (results[1][0] || []) : [],
        startTime,
        endTime
      };

      this._lastFetch = Date.now();

      // Process and render data
      const startProcess = Date.now();
      this._processData();
      const processDuration = ((Date.now() - startProcess) / 1000).toFixed(2);
      console.log(`Windspeed Heatmap: Processed data in ${processDuration}s`);

      // Clear loading state BEFORE final render
      this._isLoading = false;

      console.log('Windspeed Heatmap: Starting render...');
      this._render();
      console.log('Windspeed Heatmap: Render complete');

    } catch (error) {
      console.error('Windspeed Heatmap: Fetch error:', error);
      this._isLoading = false;
      this._error = {
        message: 'Failed to fetch wind speed history',
        details: error.message
      };
      this._render();
    }
  }

  // Process raw history data into grid structure
  _processData() {
    if (!this._historyData) {
      this._processedData = null;
      return;
    }

    const { speed, direction, startTime } = this._historyData;
    const intervalHours = this._config.time_interval;
    const rowsPerDay = 24 / intervalHours;

    // Build grid with bucketed data
    // Key format: "YYYY-MM-DD_HH" -> { maxSpeed, directions[] }
    const grid = {};

    // Process speed data into time buckets - track MAX speed per bucket
    speed.forEach(point => {
      const timestamp = new Date(point.last_changed || point.last_updated);
      const dateKey = this._getDateKey(timestamp);
      const hourKey = this._getHourBucket(timestamp.getHours(), intervalHours);
      const key = `${dateKey}_${hourKey}`;

      if (!grid[key]) {
        grid[key] = { maxSpeed: null, directions: [] };
      }

      const value = parseFloat(point.state);
      if (!isNaN(value)) {
        // Track maximum speed for this bucket
        if (grid[key].maxSpeed === null || value > grid[key].maxSpeed) {
          grid[key].maxSpeed = value;
        }
      }
    });

    // Process direction data into same buckets - still average directions
    if (direction && direction.length > 0) {
      direction.forEach(point => {
        const timestamp = new Date(point.last_changed || point.last_updated);
        const dateKey = this._getDateKey(timestamp);
        const hourKey = this._getHourBucket(timestamp.getHours(), intervalHours);
        const key = `${dateKey}_${hourKey}`;

        if (grid[key]) {
          const value = parseFloat(point.state);
          if (!isNaN(value)) {
            grid[key].directions.push(value);
          }
        }
      });
    }

    // Calculate average direction for each bucket (direction averaging still makes sense)
    Object.keys(grid).forEach(key => {
      const bucket = grid[key];

      // Average direction (circular mean for angles)
      bucket.avgDirection = bucket.directions.length > 0
        ? this._averageDirection(bucket.directions)
        : null;
    });

    // Build row/column structure for grid
    const dates = [];
    for (let d = 0; d < this._config.days; d++) {
      const date = new Date(startTime);
      date.setDate(date.getDate() + d);
      dates.push(date);
    }

    const rows = [];
    let allSpeeds = [];

    // Create rows for each time slot
    for (let h = 0; h < rowsPerDay; h++) {
      const hour = h * intervalHours;
      const row = {
        hour,
        label: this._formatHourLabel(hour),
        cells: dates.map(date => {
          const dateKey = this._getDateKey(date);
          const key = `${dateKey}_${hour}`;
          const bucket = grid[key];

          const cell = {
            date,
            speed: bucket?.maxSpeed ?? null,
            direction: bucket?.avgDirection ?? null,
            hasData: bucket && bucket.maxSpeed !== null
          };

          if (cell.speed !== null) {
            allSpeeds.push(cell.speed);
          }

          return cell;
        })
      };
      rows.push(row);
    }

    // Calculate statistics
    const stats = {
      min: allSpeeds.length > 0 ? Math.min(...allSpeeds) : 0,
      max: allSpeeds.length > 0 ? Math.max(...allSpeeds) : 0,
      avg: allSpeeds.length > 0
        ? allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length
        : 0
    };

    this._processedData = { rows, dates, stats };
  }

  // Get date key in format YYYY-MM-DD using LOCAL timezone
  _getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Bucket hour into interval (e.g., hour 7 with 2-hour interval -> 6)
  _getHourBucket(hour, intervalHours) {
    return Math.floor(hour / intervalHours) * intervalHours;
  }

  // Calculate circular mean for wind direction angles
  _averageDirection(directions) {
    if (directions.length === 0) return null;

    // Convert to radians, calculate vector average, convert back
    let sumSin = 0;
    let sumCos = 0;

    directions.forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      sumSin += Math.sin(rad);
      sumCos += Math.cos(rad);
    });

    const avgRad = Math.atan2(sumSin / directions.length, sumCos / directions.length);
    let avgDeg = (avgRad * 180) / Math.PI;

    // Normalize to 0-360 range
    if (avgDeg < 0) avgDeg += 360;

    return Math.round(avgDeg);
  }

  // Format hour as "12a", "3p", etc. (12-hour) or "00", "15", etc. (24-hour)
  _formatHourLabel(hour) {
    if (this._config.time_format === '24') {
      return String(hour).padStart(2, '0');
    }
    // 12-hour format
    const h = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    const suffix = hour < 12 ? 'a' : 'p';
    return `${h}${suffix}`;
  }

  // Main render method
  _render() {
    if (!this._config || !this._hass) return;

    this._content.innerHTML = `
      <div class="card-header">
        <span class="title">${this._escapeHtml(this._config.title)}</span>
        ${this._renderNavControls()}
      </div>

      ${this._error ? this._renderError() : ''}
      ${this._isLoading ? this._renderLoading() : ''}
      ${this._processedData && !this._error ? this._renderGrid() : ''}
      ${this._processedData && !this._error ? this._renderFooter() : ''}
      ${this._processedData && !this._error && this._config.show_legend ? this._renderLegend() : ''}
    `;

    // Set CSS variables for grid layout and cell sizing
    if (this._processedData) {
      this._content.style.setProperty('--days-count', this._config.days);

      const sizing = this._getEffectiveSizing();
      this._content.style.setProperty('--cell-height', sizing.cellHeight);
      this._content.style.setProperty('--cell-width', sizing.cellWidth);
      this._content.style.setProperty('--cell-padding', sizing.cellPadding);
      this._content.style.setProperty('--cell-gap', sizing.cellGap);
      this._content.style.setProperty('--cell-font-size', sizing.cellFontSize);
      this._content.style.setProperty('--cell-border-radius', this._config.rounded_corners ? '4px' : '0');
    }
  }

  // Render navigation controls
  _renderNavControls() {
    const canGoForward = this._viewOffset < 0;
    const showCurrentButton = this._viewOffset < 0;
    const dateRange = this._getDateRangeLabel();

    return `
      <div class="nav-controls">
        <button class="nav-btn" data-direction="back" aria-label="Previous period">←</button>
        <span class="date-range">${dateRange}</span>
        <button class="nav-btn" data-direction="forward"
                ${canGoForward ? '' : 'disabled'}
                aria-label="Next period">→</button>
        <button class="nav-btn-current ${showCurrentButton ? '' : 'hidden'}"
                data-direction="current"
                aria-label="Jump to current"
                ${showCurrentButton ? '' : 'aria-hidden="true"'}>Current</button>
      </div>
    `;
  }

  // Get date range label for display
  _getDateRangeLabel() {
    if (!this._processedData) return '';

    const { dates } = this._processedData;
    const start = dates[0];
    const end = dates[dates.length - 1];

    const formatOpts = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString(undefined, formatOpts);
    const endStr = end.toLocaleDateString(undefined, formatOpts);

    return `${startStr} - ${endStr}`;
  }

  // Render loading state
  _renderLoading() {
    return `
      <div class="loading">
        <div class="loading-spinner"></div>
        <div style="margin-top: 8px;">Loading wind data...</div>
      </div>
    `;
  }

  // Render error state
  _renderError() {
    return `
      <div class="error-message">
        <div class="error-icon">!</div>
        <div class="error-text">
          <strong>${this._escapeHtml(this._error.message)}</strong>
          <div class="error-details">${this._escapeHtml(this._error.details)}</div>
        </div>
      </div>
    `;
  }

  // Render heatmap grid
  _renderGrid() {
    const { rows, dates } = this._processedData;

    // Month header
    const monthName = dates[0].toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });

    // Date headers
    const dateHeaders = dates.map(date => {
      const day = date.getDate();
      return `<div class="date-header">${day}</div>`;
    }).join('');

    // Time labels (separate column)
    const timeLabels = rows.map(row =>
      `<div class="time-label">${row.label}</div>`
    ).join('');

    // Data cells
    const dataCells = rows.map(row =>
      row.cells.map(cell => this._renderCell(cell)).join('')
    ).join('');

    return `
      <div class="heatmap-grid">
        <div class="month-header">${monthName}</div>
        <div class="grid-wrapper">
          <div class="time-labels">
            ${timeLabels}
          </div>
          <div class="data-grid-container">
            <div class="date-headers">
              ${dateHeaders}
            </div>
            <div class="data-grid">
              ${dataCells}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render individual cell
  _renderCell(cell) {
    if (!cell.hasData) {
      return `<div class="cell no-data"><span class="speed">-</span></div>`;
    }

    const bgColor = this._getColorForSpeed(cell.speed);
    const textColor = this._getContrastTextColor(bgColor);
    const directionStr = this._config.show_direction
      ? this._formatDirection(cell.direction, this._config.direction_format)
      : '';

    return `
      <div class="cell"
           style="background-color: ${bgColor}; color: ${textColor}"
           data-speed="${cell.speed}"
           data-direction="${cell.direction || ''}"
           data-date="${cell.date.toISOString()}"
           tabindex="0"
           role="button"
           aria-label="Wind speed ${cell.speed.toFixed(1)}">
        <span class="speed">${cell.speed.toFixed(1)}</span>
        ${directionStr ? `<span class="direction">${directionStr}</span>` : ''}
      </div>
    `;
  }

  // Render footer with statistics
  _renderFooter() {
    const { stats } = this._processedData;
    const unit = this._getUnit();

    let entityName = '';
    if (this._config.show_entity_name) {
      const stateObj = this._hass?.states[this._config.entity];
      const friendlyName = stateObj?.attributes?.friendly_name || this._config.entity;
      entityName = `<div class="entity-name">${this._escapeHtml(friendlyName)}</div>`;
    }

    return `
      <div class="footer">
        <div class="footer-stats">
          <span>Min: ${stats.min.toFixed(1)} ${unit}</span>
          <span>Max: ${stats.max.toFixed(1)} ${unit}</span>
          <span>Avg: ${stats.avg.toFixed(1)} ${unit}</span>
        </div>
        ${entityName}
      </div>
    `;
  }

  // Render legend bar with gradient
  _renderLegend() {
    const thresholds = this._config.color_thresholds;
    const unit = this._getUnit();

    // Build gradient stops from thresholds
    // Calculate percentage positions based on value range
    const maxValue = thresholds[thresholds.length - 1].value;
    const gradientStops = thresholds.map((t, i) => {
      // Use logarithmic-ish scaling for better visual distribution
      // since wind speeds cluster at lower values
      const percent = Math.min((t.value / Math.max(maxValue, 75)) * 100, 100);
      return `${t.color} ${percent.toFixed(0)}%`;
    }).join(', ');

    // Select a few key labels to show (don't crowd it)
    // Show: 0, ~mid-low, ~mid, ~mid-high, max
    const labelIndices = [0, 3, 6, 9, thresholds.length - 1];
    const labels = labelIndices
      .filter(i => i < thresholds.length)
      .map(i => thresholds[i].value)
      .filter((v, i, arr) => arr.indexOf(v) === i);  // Remove duplicates

    // Format last label with + sign
    const labelHtml = labels.map((v, i) => {
      const isLast = i === labels.length - 1;
      return `<span>${v}${isLast ? '+' : ''}</span>`;
    }).join('');

    return `
      <div class="legend">
        <div class="legend-bar" style="background: linear-gradient(to right, ${gradientStops});"></div>
        <div class="legend-labels">
          ${labelHtml}
        </div>
      </div>
    `;
  }

  // Get color for wind speed value based on thresholds
  _getColorForSpeed(speed) {
    if (speed === null || speed === undefined) {
      return 'var(--disabled-color, #f0f0f0)';
    }

    const thresholds = this._config.color_thresholds;
    let color = thresholds[0].color;

    // Find highest threshold that speed meets or exceeds
    for (let i = 0; i < thresholds.length; i++) {
      if (speed >= thresholds[i].value) {
        color = thresholds[i].color;
      } else {
        break;
      }
    }

    return color;
  }

  // Get contrasting text color (black or white) for background color
  _getContrastTextColor(backgroundColor) {
    // Handle CSS variables
    if (backgroundColor.startsWith('var(')) {
      return 'var(--primary-text-color)';
    }

    // Handle rgba() format
    if (backgroundColor.startsWith('rgba(')) {
      const match = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
      }
    }

    // Handle rgb() format
    if (backgroundColor.startsWith('rgb(')) {
      const match = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
      }
    }

    // Handle hex format
    const hex = backgroundColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      // Calculate relative luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Return black for light backgrounds, white for dark backgrounds
      return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    // Fallback
    return 'var(--primary-text-color)';
  }

  // Format wind direction for display
  _formatDirection(degrees, format) {
    if (degrees === null || degrees === undefined) return '';

    switch (format) {
      case 'arrow':
        return this._degreesToArrow(degrees);
      case 'cardinal':
        return this._degreesToCardinal(degrees);
      case 'degrees':
        return `${Math.round(degrees)}deg`;
      default:
        return '';
    }
  }

  // Convert degrees to arrow character
  _degreesToArrow(degrees) {
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    // Add 180 degrees to point arrow where wind is blowing TO (not FROM)
    const adjustedDegrees = (degrees + 180) % 360;
    const index = Math.round(adjustedDegrees / 45) % 8;
    return arrows[index];
  }

  // Convert degrees to cardinal direction
  _degreesToCardinal(degrees) {
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return cardinals[index];
  }

  // Get unit of measurement for wind speed
  _getUnit() {
    // Try config first
    if (this._config.unit) {
      return this._config.unit;
    }

    // Auto-detect from entity attributes
    const stateObj = this._hass?.states[this._config.entity];
    if (stateObj?.attributes?.unit_of_measurement) {
      return stateObj.attributes.unit_of_measurement;
    }

    // Default fallback
    return 'mph';
  }

  // Handle all click events (event delegation)
  _handleClick(e) {
    // Navigation buttons (both regular nav-btn and nav-btn-current)
    const navBtn = e.target.closest('.nav-btn, .nav-btn-current');
    if (navBtn && !navBtn.disabled) {
      const direction = navBtn.dataset.direction;
      this._handleNavigation(direction);
      return;
    }

    // Cell clicks
    const cell = e.target.closest('.cell');
    if (cell && !cell.classList.contains('no-data')) {
      this._handleCellClick(cell);
    }
  }

  // Handle navigation button clicks
  _handleNavigation(direction) {
    if (direction === 'back') {
      // Go back one period
      this._viewOffset -= this._config.days;
    } else if (direction === 'forward') {
      // Go forward one period
      this._viewOffset += this._config.days;
      // Don't allow going into the future
      if (this._viewOffset > 0) {
        this._viewOffset = 0;
      }
    } else if (direction === 'current') {
      // Jump to current view
      this._viewOffset = 0;
    }

    // Fetch new data for the offset period
    this._fetchHistoryData();
  }

  // Handle cell click events
  _handleCellClick(cellElement) {
    const action = this._config.click_action;

    switch (action) {
      case 'more-info':
        this._showMoreInfo();
        break;
      case 'tooltip':
        this._showTooltip(cellElement);
        break;
      default:
        // No action
        break;
    }
  }

  // Show Home Assistant more-info dialog
  _showMoreInfo() {
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._config.entity }
    }));
  }

  // Show tooltip with cell details
  _showTooltip(cellElement) {
    const speed = parseFloat(cellElement.dataset.speed);
    const direction = cellElement.dataset.direction;
    const date = new Date(cellElement.dataset.date);

    // Remove any existing tooltip
    const existing = this.shadowRoot.querySelector('.tooltip');
    if (existing) {
      existing.remove();
    }

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';

    const dateStr = date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric'
    });

    const unit = this._getUnit();
    const dirText = direction
      ? ` ${this._degreesToCardinal(direction)} (${Math.round(direction)}deg)`
      : '';

    tooltip.innerHTML = `
      <div><strong>${dateStr}</strong></div>
      <div>Speed: ${speed.toFixed(1)} ${unit}${dirText}</div>
    `;

    // Position tooltip near the cell
    const rect = cellElement.getBoundingClientRect();
    const parentRect = this._content.getBoundingClientRect();
    tooltip.style.left = `${rect.left - parentRect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom - parentRect.top + 4}px`;
    tooltip.style.transform = 'translateX(-50%)';

    this._content.appendChild(tooltip);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (tooltip.parentElement) {
        tooltip.remove();
      }
    }, 3000);
  }

  // Escape HTML to prevent XSS
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Normalize size values: numbers -> "Npx", strings -> pass through
  _normalizeSize(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    if (typeof value === 'number') {
      return `${value}px`;
    }
    return String(value);
  }

  // Get effective sizing configuration (handles compact mode override)
  _getEffectiveSizing() {
    // If compact mode is enabled, use preset values
    if (this._config.compact) {
      return {
        cellHeight: '24px',
        cellWidth: '1fr',
        cellPadding: '1px',
        cellGap: '1px',
        cellFontSize: '9px',
      };
    }

    // Otherwise use configured or default values
    return {
      cellHeight: this._normalizeSize(this._config.cell_height, '36px'),
      cellWidth: this._normalizeSize(this._config.cell_width, '1fr'),
      cellPadding: this._normalizeSize(this._config.cell_padding, '2px'),
      cellGap: this._normalizeSize(this._config.cell_gap, '2px'),
      cellFontSize: this._normalizeSize(this._config.cell_font_size, '11px'),
    };
  }
}

// Register custom element
customElements.define('windspeed-heatmap-card', WindspeedHeatmapCard);
