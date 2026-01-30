# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
