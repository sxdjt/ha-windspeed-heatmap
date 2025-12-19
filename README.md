# Windspeed Heatmap Card

A custom Home Assistant Lovelace card that displays wind speed data as a color-coded heatmap, showing hourly patterns across multiple days.

## Features

- Color-coded heatmap visualization of wind speed history
- Configurable time periods (1-30 days)
- Configurable time intervals (1, 2, 3, 4, 6, 8, 12, or 24 hours per row)
- Optional wind direction display (arrows, cardinal directions, or degrees)
- Navigation controls to browse historical data
- Interactive cells with tooltips or more-info dialog
- Customizable color thresholds based on wind speed
- Min/Max/Avg statistics
- Responsive design with dark theme support
- Auto-refresh with configurable intervals

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend" section
3. Click the menu (three dots) in the top right
4. Select "Custom repositories"
5. Add this repository URL: `https://github.com/YOUR-USERNAME/ha-windspeed-heatmap`
6. Category: "Lovelace"
7. Click "Add"
8. Find "Windspeed Heatmap Card" in HACS and install it
9. Restart Home Assistant

### Manual Installation

1. Download `windspeed-heatmap-card.js` from the latest release
2. Copy it to your `config/www` directory (create if it doesn't exist)
3. Add the resource to your Lovelace dashboard:
   - Go to Settings → Dashboards → Resources (three-dot menu)
   - Click "Add Resource"
   - URL: `/local/windspeed-heatmap-card.js`
   - Resource type: "JavaScript Module"
4. Click "Create"
5. Restart Home Assistant
6. Refresh your browser cache (Ctrl+Shift+R / Cmd+Shift+R)

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

## Examples

### Compact 24-Hour View

Shows the last 24 hours with 1-hour intervals:

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
direction_entity: sensor.wind_direction
days: 1
time_interval: 1
title: "Last 24 Hours"
```

### Weekly Overview

Shows 7 days with 3-hour intervals:

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
days: 7
time_interval: 3
title: "Weekly Wind Pattern"
```

### Two-Week Comparison

Shows 14 days with 6-hour intervals:

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
days: 14
time_interval: 6
title: "Two-Week History"
show_direction: false
```

### Custom Color Scale (Metric)

For metric users (km/h):

```yaml
type: custom:windspeed-heatmap-card
entity: sensor.wind_speed
unit: km/h
color_thresholds:
  - value: 0
    color: "#e3f2fd"
  - value: 10
    color: "#90caf9"
  - value: 20
    color: "#ffeb3b"
  - value: 30
    color: "#ff9800"
  - value: 40
    color: "#f44336"
```

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

## Click Actions

### Tooltip (default)

Shows a floating tooltip with detailed information when clicking a cell:

```yaml
click_action: tooltip
```

### More Info

Opens the Home Assistant more-info dialog for the wind speed entity:

```yaml
click_action: more-info
```

### None

Disables cell click interactions:

```yaml
click_action: none
```

## Tips and Best Practices

1. **Choose appropriate time intervals**: For short periods (1-3 days), use 1-2 hour intervals. For longer periods (7-14 days), use 3-6 hour intervals to keep the grid readable.

2. **Wind direction entity**: If your weather integration provides a wind direction sensor, include it for better wind pattern analysis.

3. **Custom thresholds**: Adjust color thresholds based on your local climate. Coastal areas may want different scales than inland regions.

4. **Refresh interval**: Balance between data freshness and API load. For current-day monitoring, 5 minutes (300s) is reasonable. For historical analysis, 15-30 minutes is sufficient.

5. **Mobile viewing**: On smaller screens, wind direction arrows are hidden automatically to maintain readability.

## Troubleshooting

### Card not appearing

- Check browser console (F12) for errors
- Verify the resource is loaded: Settings → Dashboards → Resources
- Ensure entity ID is correct and exists
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### No data showing

- Verify your wind speed sensor has historical data
- Check entity ID in Developer Tools → States
- Ensure entity records regular updates (check history in HA)
- Check browser console for API errors

### Colors not showing correctly

- Verify your thresholds are in ascending order by value
- Use valid hex color codes (e.g., #ffffff)
- Check color contrast for readability

### Navigation buttons not working

- Ensure you have sufficient historical data
- Check browser console for fetch errors
- Verify Home Assistant history database is configured

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Created for the Home Assistant community.

## Support

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/YOUR-USERNAME/ha-windspeed-heatmap).
