# Windspeed Heatmap Card

A custom Home Assistant Lovelace card that displays wind speed data as a color-coded heatmap, showing hourly patterns across multiple days.

## Features

- Color-coded heatmap visualization of wind speed history
- Configurable time periods and intervals
- Optional wind direction display (arrows, cardinal directions, or degrees)
- Customizable color thresholds based on wind speed
- Min/Max/Avg statistics
- Responsive design with dark theme support
- Auto-refresh with configurable intervals

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
| `direction_entity` | string | `null` | Wind direction sensor entity ID (optional) |
| `title` | string | `"Wind Speed History"` | Card title |
| `days` | number | `7` | Number of days to display (1-30) |
| `time_interval` | number | `2` | Hours per row: 1, 2, 3, 4, 6, 8, 12, or 24 |
| `time_format` | string | `"24"` | Time format: "12" or "24" |
| `unit` | string | auto-detect | Unit of measurement (e.g., "mph", "km/h", "m/s") |
| `show_direction` | boolean | `true` | Show wind direction in cells |
| `direction_format` | string | `"arrow"` | Direction format: "arrow", "cardinal", or "degrees" |
| `show_entity_name` | boolean | `false` | Show entity friendly name in footer |
| `refresh_interval` | number | `300` | Data refresh interval in seconds |
| `click_action` | string | `"tooltip"` | Cell click action: "tooltip", "more-info", or "none" |
| `color_thresholds` | array | See below | Color mapping for wind speeds |

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/YOUR-USERNAME/ha-windspeed-heatmap).
