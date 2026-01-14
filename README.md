# Windspeed Heatmap Card

A custom Home Assistant Lovelace card that displays wind speed data as a color-coded heatmap, showing hourly patterns across multiple days.

![GitHub Release](https://img.shields.io/github/v/release/sxdjt/ha-windspeed-heatmap?style=for-the-badge)
[![AI Assisted](https://img.shields.io/badge/AI-Claude%20Code-AAAAAA.svg?style=for-the-badge)](https://claude.ai/code)
![GitHub License](https://img.shields.io/github/license/sxdjt/ha-windspeed-heatmap?style=for-the-badge)

## Features

- Color-coded heatmap visualization of wind speed history
- Configurable time periods and intervals
- Configurable card sizing: compact mode, specify cell height/width, etc.
- Optional wind direction display (arrows, cardinal directions, or degrees)
- Customizable color thresholds based on wind speed
- Min/Max/Avg statistics
- Responsive design with dark theme support
- Auto-refresh with configurable intervals
- **Pairs well with the [Temperature heatmap card](https://github.com/sxdjt/ha-temperature-heatmap)**

<img width="508" height="750" alt="windspeed-heatmap" src="https://github.com/user-attachments/assets/5606f57c-9239-4154-b025-73ccc47a8c19" />

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=ha-windspeed-heatmap)

## Configuration

### Minimal Configuration

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
```

### Full Configuration

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
direction_entity: sensor.wind_direction
title: "Patio Wind History"
days: 7
time_interval: 2
time_format: "24"
unit: mph
show_direction: true
direction_format: arrow
show_entity_name: true
refresh_interval: 300
click_action: tooltip
color_thresholds:
  - value: 0
    color: "#e8f5e9"
  - value: 5
    color: "#81c784"
  - value: 10
    color: "#fff59d"
  - value: 15
    color: "#ffb74d"
  - value: 20
    color: "#e57373"
  - value: 30
    color: "#d32f2f"
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **Required** | Wind speed sensor entity ID |
| `cell_font_size` | number/string | `11` | Cell font size (6-24 pixels) |
| `cell_gap` | number/string | `2` | Gap between cells (0-20 pixels) |
| `cell_height` | number/string | `36` | Cell height (10-200 pixels) |
| `cell_padding` | number/string | `2` | Padding inside cells (0-20 pixels) |
| `cell_width` | number/string | `"1fr"` | Column width (1fr, auto, 60px, 25%, etc.) |
| `click_action` | string | `"tooltip"` | Cell click action: "tooltip", "more-info", or "none" |
| `color_thresholds` | array | See below | Color mapping for wind speeds |
| `compact` | boolean | `false` | Enable compact mode (overrides cell sizing properties) |
| `days` | number | `7` | Number of days to display (1-30) |
| `direction_entity` | string | `null` | Wind direction sensor entity ID (optional) |
| `direction_format` | string | `"arrow"` | Direction format: "arrow", "cardinal", or "degrees" |
| `refresh_interval` | number | `300` | Data refresh interval in seconds |
| `show_direction` | boolean | `true` | Show wind direction in cells |
| `show_entity_name` | boolean | `false` | Show entity friendly name in footer |
| `time_format` | string | `"24"` | Time format: "12" or "24" |
| `time_interval` | number | `2` | Hours per row: 1, 2, 3, 4, 6, 8, 12, or 24 |
| `title` | string | `"Wind Speed History"` | Card title |
| `unit` | string | auto-detect | Unit of measurement (e.g., "mph", "km/h", "m/s") |

### Default Color Thresholds

The default color scale is based on the Beaufort wind scale (for MPH):

```yaml
color_thresholds:
  - value: 0     # Calm (0-5 mph)
    color: "#e8f5e9"
  - value: 5     # Light breeze (5-10 mph)
    color: "#81c784"
  - value: 10    # Moderate breeze (10-15 mph)
    color: "#fff59d"
  - value: 15    # Fresh breeze (15-20 mph)
    color: "#ffb74d"
  - value: 20    # Strong breeze (20-30 mph)
    color: "#e57373"
  - value: 30    # Gale force (30+ mph)
    color: "#d32f2f"
```

You can customize these thresholds to match your local wind conditions and preferred color scheme.


## Wind Direction Formats

### Arrow Format (default)

Displays directional arrows: ↑ ↗ → ↘ ↓ ↙ ← ↖

```yaml
direction_format: arrow
```

### Cardinal Format

Displays cardinal directions: N, NE, E, SE, S, SW, W, NW

```yaml
direction_format: cardinal
```

### Degrees Format

Displays numeric degrees: 0°, 45°, 90°, etc.

```yaml
direction_format: degrees
```

## Cell Sizing Customization

Control the visual density of the heatmap with individual sizing properties or compact mode.

### Individual Properties

Customize cell dimensions with specific size values:

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
cell_height: 40           # Cell height in pixels (default: 36)
cell_width: "1fr"         # Column width - 1fr (default), auto, 60px, 25%, etc.
cell_padding: 3           # Padding inside cells (default: 2)
cell_gap: 3               # Gap between cells (default: 2)
cell_font_size: 12        # Wind speed font size (default: 11)
```

#### Size Value Formats

- Numbers automatically convert to pixels: `cell_height: 40` becomes "40px"
- Strings pass through as-is: `cell_width: "1fr"`, `cell_width: "25%"`
- Valid ranges:
  - `cell_height`: 10-200 pixels
  - `cell_padding`: 0-20 pixels
  - `cell_gap`: 0-20 pixels
  - `cell_font_size`: 6-24 pixels

### Compact Mode

For a denser display with smaller cells:

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
compact: true             # Overrides individual sizing properties
```

Compact preset values:
- Cell height: 24px (vs 36px default)
- Cell padding: 1px (vs 2px default)
- Cell gap: 1px (vs 2px default)
- Font size: 9px (vs 11px default)

### Responsive Behavior

On mobile screens (width < 600px), cell sizes automatically scale down by approximately 17%:
- Default 36px height becomes 30px
- Custom 40px height becomes 33px
- Compact 24px height becomes 20px

Note: Wind direction display is automatically hidden on mobile screens.

### Width Considerations

**Responsive (recommended):**
```yaml
cell_width: "1fr"         # Auto-sizes to fill width (default)
cell_width: "25%"         # Percentage-based responsive sizing
```

**Fixed width:**
```yaml
cell_width: 60            # Fixed 60px width per column
```

Note: Fixed widths may cause horizontal scrolling on narrow screens, especially with many days displayed.

### Example Configurations

**Larger cells for better readability:**
```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
cell_height: 50
cell_padding: 4
cell_font_size: 14
days: 5
```

**Very compact display for dashboards:**
```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
compact: true
days: 14
```

**Fixed width columns (may cause horizontal scroll):**
```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
cell_width: 60
days: 30
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/YOUR-USERNAME/ha-windspeed-heatmap).
