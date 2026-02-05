// Main Windspeed Heatmap Card component

import { getDefaultThresholdsForUnit } from './constants.js';
import { createStyleElement } from './styles.js';
import { getColorForSpeed, getContrastTextColor } from './color-utils.js';
import {
  escapeHtml,
  formatHourLabel,
  formatDirection,
  degreesToCardinal,
  normalizeSize,
  getDateKey,
  getHourBucket,
  averageDirection
} from './formatting.js';

/**
 * Windspeed Heatmap Card component.
 * Displays wind speed history as a color-coded heatmap using Beaufort scale colors.
 */
export class WindspeedHeatmapCard extends HTMLElement {
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

    // Initialize Shadow DOM with styles
    this.shadowRoot.appendChild(createStyleElement());
    this._content = document.createElement('ha-card');
    this.shadowRoot.appendChild(this._content);

    // Event delegation for all clicks
    this._content.addEventListener('click', this._handleClick.bind(this));

    // Store cached responses in memory
    this._responseCache = new Map();
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

    // Validate color_interpolation
    const validInterpolations = ['rgb', 'gamma', 'hsl', 'lab'];
    if (config.color_interpolation && !validInterpolations.includes(config.color_interpolation)) {
      throw new Error(`color_interpolation must be one of: ${validInterpolations.join(', ')}`);
    }

    // Validate data_source
    const validDataSources = ['auto', 'history', 'statistics'];
    if (config.data_source && !validDataSources.includes(config.data_source)) {
      throw new Error(`data_source must be one of: ${validDataSources.join(', ')}`);
    }

    // Validate statistic_type
    const validStatisticTypes = ['max', 'mean', 'min'];
    if (config.statistic_type && !validStatisticTypes.includes(config.statistic_type)) {
      throw new Error(`statistic_type must be one of: ${validStatisticTypes.join(', ')}`);
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

    // Track whether user provided custom thresholds
    const hasCustomThresholds = config.color_thresholds && config.color_thresholds.length > 0;

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

      // Track if custom thresholds were provided (for auto-selection on unit detection)
      _hasCustomThresholds: hasCustomThresholds,
      _thresholdsInitialized: !!config.unit,  // True if we know the unit at config time

      // Color thresholds - use defaults if not provided or empty
      // Default thresholds are selected based on the configured unit
      color_thresholds: hasCustomThresholds
        ? config.color_thresholds
        : getDefaultThresholdsForUnit(config.unit).slice(),

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
      show_legend: config.show_legend || false,  // Default false
      interpolate_colors: config.interpolate_colors || false,
      color_interpolation: config.color_interpolation || 'hsl',  // 'gamma', 'hsl', 'lab', 'rgb'

      // Data source options
      data_source: config.data_source || 'auto',  // 'auto', 'history', 'statistics'
      statistic_type: config.statistic_type || 'max',  // 'max', 'mean', 'min' (for statistics data)
    };

    // Sort thresholds by value (ascending) - create mutable copy to avoid "read-only" errors
    this._config.color_thresholds = [...this._config.color_thresholds].sort((a, b) => a.value - b.value);

    // Set up refresh interval
    if (this._hass) {
      this._clearAndSetInterval();
    }
  }

  // Returns the visual config editor element
  static getConfigElement() {
    return document.createElement('windspeed-heatmap-card-editor');
  }

  // Returns a minimal configuration that will result in a working card
  static getStubConfig(hass) {
    // Find the first wind speed sensor
    const windSensors = Object.keys(hass.states)
      .filter(entityId => {
        if (!entityId.startsWith('sensor.')) return false;
        const entity = hass.states[entityId];
        const deviceClass = entity?.attributes?.device_class;
        const unit = entity?.attributes?.unit_of_measurement?.toLowerCase() || '';
        // Check for wind speed by device class or unit
        return deviceClass === 'wind_speed' ||
               unit.includes('mph') ||
               unit.includes('km/h') ||
               unit.includes('m/s') ||
               unit.includes('knot') ||
               unit.includes('kn') ||
               unit.includes('kt');
      });

    // Detect unit from the found sensor to select appropriate thresholds
    let detectedUnit = null;
    if (windSensors.length > 0) {
      const entity = hass.states[windSensors[0]];
      detectedUnit = entity?.attributes?.unit_of_measurement;
    }

    return {
      entity: windSensors.length > 0 ? windSensors[0] : '',
      title: 'Wind Speed History',
      days: 7,
      time_interval: 2,
      color_thresholds: getDefaultThresholdsForUnit(detectedUnit).slice()
    };
  }

  // Home Assistant required method: receive hass object updates
  set hass(hass) {
    this._hass = hass;

    if (!this._config || !this.isConnected) return;

    // Auto-select appropriate thresholds based on detected unit (first time only)
    if (!this._config._hasCustomThresholds && !this._config._thresholdsInitialized) {
      const detectedUnit = this._getUnit();
      if (detectedUnit) {
        this._config.color_thresholds = getDefaultThresholdsForUnit(detectedUnit).slice();
        this._config._thresholdsInitialized = true;
        console.log(`Windspeed Heatmap: Auto-selected ${detectedUnit} thresholds`);
      }
    }

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

  async fetchWithCache(url, timeoutMs = 30000, ttlMs = 5 * 60 * 1000) {
    const now = Date.now();
    // Include viewOffset in cache key to prevent stale data when navigating
    const cacheKey = `${url}_offset${this._viewOffset}`;

    // Check if the cache has a valid entry
    const cached = this._responseCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      console.log('Windspeed Heatmap: Using cached data for:', cacheKey);
      return cached.data;
    }

    // Fetch with timeout
    const fetchPromise = this._hass.callApi('GET', url);

    const data = await Promise.race([
      fetchPromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);

    // Store in cache
    this._responseCache.set(cacheKey, { data, expiry: now + ttlMs });
    return data;
  }

  // Determine which data source to use based on config and availability
  _getDataSource() {
    const source = this._config.data_source;

    if (source === 'history') return 'history';
    if (source === 'statistics') return 'statistics';

    // Auto mode: prefer statistics for historical data (viewOffset < 0)
    // or when explicitly looking at older data
    // Statistics are hourly aggregates - good for longer time ranges
    if (this._viewOffset < 0) {
      return 'statistics';
    }

    // For current view, use history for more granular data
    return 'history';
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

    const dataSource = this._getDataSource();
    console.log(`Windspeed Heatmap: Starting data fetch using ${dataSource}...`);

    try {
      // Calculate date range in LOCAL timezone, including current partial interval
      const now = new Date();

      let endTime;

      // Calculate the current partial bucket key (only used when viewing current time)
      let partialBucketKey = null;

      if (this._viewOffset === 0) {
        // Current view: use current time to include partial bucket data
        endTime = new Date(now);

        // Calculate which bucket is currently in progress
        const intervalHours = this._config.time_interval;
        const currentDateKey = getDateKey(now);
        const currentHourBucket = getHourBucket(now.getHours(), intervalHours);
        partialBucketKey = `${currentDateKey}_${currentHourBucket}`;
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
      if (partialBucketKey) {
        console.log(`Windspeed Heatmap: Current partial bucket: ${partialBucketKey}`);
      }

      if (dataSource === 'statistics') {
        await this._fetchStatisticsData(startTime, endTime, partialBucketKey);
      } else {
        await this._fetchHistoryApiData(startTime, endTime, partialBucketKey);
      }

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

  // Fetch data using the history/period REST API (short-term states)
  async _fetchHistoryApiData(startTime, endTime, partialBucketKey = null) {
    const startTimeISO = startTime.toISOString();
    const endTimeISO = endTime.toISOString();

    console.log(`Windspeed Heatmap: Using history API - Start: ${startTimeISO}, End: ${endTimeISO}`);

    // Build API URLs - fetch both in parallel for better performance
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
      endTime,
      partialBucketKey,
      dataSource: 'history'
    };
  }

  // Fetch data using the recorder/statistics_during_period WebSocket API (long-term statistics)
  async _fetchStatisticsData(startTime, endTime, partialBucketKey = null) {
    const startTimeISO = startTime.toISOString();
    const endTimeISO = endTime.toISOString();

    console.log(`Windspeed Heatmap: Using statistics API - Start: ${startTimeISO}, End: ${endTimeISO}`);

    // Build list of statistic IDs to fetch
    const statisticIds = [this._config.entity];
    if (this._config.direction_entity && this._config.show_direction) {
      statisticIds.push(this._config.direction_entity);
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

    const startFetch = Date.now();

    // Call the WebSocket API for statistics
    // The API returns hourly aggregated data (mean, min, max) from the statistics table
    const statsResult = await fetchWithTimeout(
      this._hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: startTimeISO,
        end_time: endTimeISO,
        statistic_ids: statisticIds,
        period: 'hour',  // Hourly aggregates
      })
    );

    const fetchDuration = ((Date.now() - startFetch) / 1000).toFixed(1);

    // Convert statistics format to history format for processing
    // Statistics API returns: { "sensor.entity": [{ start, end, mean, min, max, sum, state }, ...] }
    const speedStats = statsResult[this._config.entity] || [];
    const directionStats = this._config.direction_entity
      ? (statsResult[this._config.direction_entity] || [])
      : [];

    console.log(`Windspeed Heatmap: Received ${speedStats.length} speed stats, ${directionStats.length} direction stats in ${fetchDuration}s`);

    // Convert statistics to a format compatible with our processing
    // Each stat has: start (ISO string), mean, min, max
    const statisticType = this._config.statistic_type;  // 'max', 'mean', or 'min'

    const speedData = speedStats.map(stat => ({
      last_changed: stat.start,
      state: String(stat[statisticType] ?? stat.mean ?? ''),
    })).filter(point => point.state !== '' && point.state !== 'null');

    // For direction, use mean (circular average would be ideal but mean is reasonable)
    const directionData = directionStats.map(stat => ({
      last_changed: stat.start,
      state: String(stat.mean ?? ''),
    })).filter(point => point.state !== '' && point.state !== 'null');

    this._historyData = {
      speed: speedData,
      direction: directionData,
      startTime,
      endTime,
      partialBucketKey,
      dataSource: 'statistics'
    };
  }

  // Process raw history data into grid structure
  _processData() {
    if (!this._historyData) {
      this._processedData = null;
      return;
    }

    const { speed, direction, startTime, partialBucketKey } = this._historyData;
    const intervalHours = this._config.time_interval;
    const rowsPerDay = 24 / intervalHours;

    // Build grid with bucketed data
    // Key format: "YYYY-MM-DD_HH" -> { maxSpeed, directions[] }
    const grid = {};

    // Process speed data into time buckets - track MAX speed per bucket
    speed.forEach(point => {
      const timestamp = new Date(point.last_changed || point.last_updated);
      const dateKey = getDateKey(timestamp);
      const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
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
        const dateKey = getDateKey(timestamp);
        const hourKey = getHourBucket(timestamp.getHours(), intervalHours);
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
        ? averageDirection(bucket.directions)
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
        label: formatHourLabel(hour, this._config.time_format),
        cells: dates.map(date => {
          const dateKey = getDateKey(date);
          const key = `${dateKey}_${hour}`;
          const bucket = grid[key];

          const cell = {
            date,
            speed: bucket?.maxSpeed ?? null,
            direction: bucket?.avgDirection ?? null,
            hasData: bucket && bucket.maxSpeed !== null,
            isPartial: partialBucketKey && key === partialBucketKey
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

  // Main render method
  _render() {
    if (!this._config || !this._hass) return;

    this._content.innerHTML = `
      <div class="card-header">
        <span class="title">${escapeHtml(this._config.title)}</span>
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
        <button class="nav-btn" data-direction="back" aria-label="Previous period">&#8592;</button>
        <span class="date-range">${dateRange}</span>
        <button class="nav-btn" data-direction="forward"
                ${canGoForward ? '' : 'disabled'}
                aria-label="Next period">&#8594;</button>
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
          <strong>${escapeHtml(this._error.message)}</strong>
          <div class="error-details">${escapeHtml(this._error.details)}</div>
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

    const bgColor = getColorForSpeed(
      cell.speed,
      this._config.color_thresholds,
      this._config.interpolate_colors,
      this._config.color_interpolation
    );
    const textColor = getContrastTextColor(bgColor);
    const directionStr = this._config.show_direction
      ? formatDirection(cell.direction, this._config.direction_format)
      : '';

    // Add asterisk indicator for partial (in-progress) buckets
    const partialIndicator = cell.isPartial ? '*' : '';
    const partialLabel = cell.isPartial ? ' (in progress)' : '';

    return `
      <div class="cell${cell.isPartial ? ' partial' : ''}"
           style="background-color: ${bgColor}; color: ${textColor}"
           data-speed="${cell.speed}"
           data-direction="${cell.direction || ''}"
           data-date="${cell.date.toISOString()}"
           data-partial="${cell.isPartial ? 'true' : 'false'}"
           tabindex="0"
           role="button"
           aria-label="Wind speed ${cell.speed.toFixed(1)}${partialLabel}">
        <span class="speed">${cell.speed.toFixed(1)}${partialIndicator}</span>
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
      entityName = `<div class="entity-name">${escapeHtml(friendlyName)}</div>`;
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

    // Build gradient stops from thresholds
    // Calculate percentage positions based on value range
    const maxValue = thresholds[thresholds.length - 1].value;
    const gradientStops = thresholds.map((t) => {
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
    const isPartial = cellElement.dataset.partial === 'true';

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
      ? ` ${degreesToCardinal(direction)} (${Math.round(direction)}deg)`
      : '';
    const partialNote = isPartial ? '<div><em>(in progress)</em></div>' : '';

    tooltip.innerHTML = `
      <div><strong>${dateStr}</strong></div>
      <div>Speed: ${speed.toFixed(1)} ${unit}${dirText}</div>
      ${partialNote}
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
      cellHeight: normalizeSize(this._config.cell_height, '36px'),
      cellWidth: normalizeSize(this._config.cell_width, '1fr'),
      cellPadding: normalizeSize(this._config.cell_padding, '2px'),
      cellGap: normalizeSize(this._config.cell_gap, '2px'),
      cellFontSize: normalizeSize(this._config.cell_font_size, '11px'),
    };
  }
}
