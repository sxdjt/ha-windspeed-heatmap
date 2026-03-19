# Changelog

All notable changes to this project will be documented in this file.

## [0.7.3] - 2026-03-19

### Added
- `fill_gaps_style` option: `'dimmed'` (default, existing behavior) or `'none'` to render filled cells the same as real data. Tooltip still labels estimated values. (Closes #11)

---

## Heads up: something's changing!

Hey! Thanks for using my card - I build stuff I want to use myself, so it's great when others find it useful too.

### What's changing

The [temperature](https://github.com/sxdjt/ha-temperature-heatmap) and [windspeed](https://github.com/sxdjt/ha-windspeed-heatmap) heatmap cards have always shared most of their code, with just small differences between them. Rather than keep maintaining two nearly-identical cards, I've merged them into one: [weather-heatmap](https://github.com/sxdjt/ha-weather-heatmap-card). Same functionality, less clutter in your dashboard setup. *It will be available on HACS shortly.*

### When

Please migrate to the new card by **4 April 2026**. After that, I won't be maintaining or updating the old temperature and windspeed cards.

### Questions? Issues?

Open an issue! Always happy to chat or help sort things out.

---

## [0.7.2] - 2026-03-08

### Fixed
- Editor dropdown selectors (Data Source, Aggregation Mode, etc.) now correctly update the card configuration when an option is selected
- Auto data source now combines both statistics (for older days beyond history retention) and history (for recent days), so viewing more days than `purge_keep_days` no longer results in blank older cells

## [0.7.1] - 2026-03-03

### Added
- `show_month_year` option (default: true) to hide the month/year label above the grid, removing the element entirely for a more compact layout

## [0.7.0] - 2026-03-01

### Added
- `fill_gaps` option: forward-fills the last known wind speed (and direction if available) into empty buckets within each day column. Filled cells render at reduced opacity with a dashed border and show "(estimated - gap filled)" in the tooltip. Disabled by default.
- `compact_header` option: reduces title font size, header/footer padding, and nav arrow size. Works independently of `compact` (cell sizing) mode.

### Changed
- Simplified to single-file deployment - removed Rollup build system. `windspeed-heatmap-card.js` at the repo root is the only file needed.

## [0.6.2] - 2026-02-27

### Fixed
- Legend labels now positioned at their true value-proportional locations on the gradient bar, with collision detection to prevent crowding
- Legend moved above the min/max/avg footer so statistics always display at the bottom of the card

## [0.6.1] - 2026-02-09

### Fixed
- Fix sticky hover on Android touch devices - cell hover styles now wrapped in `@media (hover: hover)` so they only apply on devices with a true pointer, preventing the cell from rendering on top of the more-info popup after tapping
- VERSION constant synced with package.json (was stuck at 0.5.0)

## [0.6.0] - 2026-02-05

### Added
- Current time bucket now shows in-progress data with asterisk indicator
- Partial buckets display with dashed border and "(in progress)" in tooltip

## [0.5.0] - 2026-01-31

### Added
- Long-term statistics support for viewing history beyond recorder purge_keep_days limit
- `data_source` option: 'auto', 'history', or 'statistics'
- `statistic_type` option: 'max', 'mean', or 'min' for statistics data

## [0.4.0] - 2026-01-30

### Added
- Default Beaufort scale thresholds for multiple units of measurement:
  - mph (miles per hour) - existing
  - km/h (kilometers per hour)
  - m/s (meters per second)
  - knots (kn, kt, kts)
- Auto-detection of appropriate thresholds based on entity's unit_of_measurement
- Unit selector in visual editor (Auto-detect, mph, km/h, m/s, knots)
- Support for nautical unit detection in getStubConfig (kn, kt)

## [0.3.0] - 2026-01-23

### Added
- Visual configuration editor for easy setup
- Color interpolation with multiple methods: RGB, HSL, LAB, Gamma
- `interpolate_colors` option to enable smooth color gradients between thresholds
- `color_interpolation` option to select interpolation method
- `getStubConfig` for better card picker integration
- Request caching to improve performance

## [0.2.2] - 2026-01-15

### Added
- Beaufort scale color reference page
- Optional color legend bar (`show_legend: true`)

### Fixed
- Beaufort wind scale colors link in README

## [0.2.1] - 2026-01-14

### Added
- `rounded_corners` option (default: true) - set to false for flat grid appearance

## [0.2.0] - 2026-01-13

### Added
- Configurable cell sizing with individual properties:
  - `cell_height`: Cell height (10-200 pixels)
  - `cell_width`: Column width (1fr, auto, px, %)
  - `cell_padding`: Padding inside cells (0-20 pixels)
  - `cell_gap`: Gap between cells (0-20 pixels)
  - `cell_font_size`: Font size (6-24 pixels)
- `compact` mode for dense display with preset smaller values
- Responsive scaling on mobile screens (< 600px)

## [0.1.4] - 2026-01-04

### Fixed
- Wind direction arrows now point where wind is blowing TO (not FROM)

## [0.1.3] - 2025-12-30

### Fixed
- Color thresholds read-only error when user provides custom thresholds

## [0.1.2] - 2025-12-27

### Changed
- Default click action changed to open history dialog (more-info)

## [0.1.1] - 2025-12-19

### Added
- 24-hour time format option (`time_format: "24"`)
- Zero-padding for 24-hour time display

## [0.1.0] - 2025-12-19

### Added
- Initial release
- Color-coded heatmap visualization of wind speed history
- Default Beaufort wind scale colors (Force 0-12)
- Optional wind direction display (arrows, cardinal, degrees)
- Configurable time periods (1-30 days) and intervals (1-24 hours)
- Customizable color thresholds
- Navigation between time periods (previous/next/current)
- Min/Max/Avg statistics footer
- 12-hour and 24-hour time format options
- Click actions: tooltip, more-info, none
- Responsive design with dark theme support
