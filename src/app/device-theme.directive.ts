import {
  computed,
  Directive,
  effect,
  HostBinding,
  input,
  Signal,
} from '@angular/core';
import {
  argbFromHex,
  Hct,
  hexFromArgb,
  SchemeNeutral,
  SchemeVibrant,
} from '@material/material-color-utilities';
import { DeviceWithState } from '../lib/websocket-client';

/**
 * Interface defining the structure for storing generated theme colors.
 * Each key represents a color role (primary, secondary, etc.),
 * and the value is an array of objects containing the hex color code
 * and its corresponding tone value.
 */
interface colorsFromPaletteConfig {
  primary: { hex: string; tone: number }[];
  secondary: { hex: string; tone: number }[];
  tertiary: { hex: string; tone: number }[];
  neutral: { hex: string; tone: number }[];
  'neutral-variant': { hex: string; tone: number }[]; // Use quotes for kebab-case key
  error: { hex: string; tone: number }[];
}

interface ThemeInputState {
  hexColor: string;
  isDeviceOnline: boolean;
}

/**
 * Applies a dynamic Material Design theme to the host element based on the
 * state of a WLED device.
 *
 * It listens for changes in the device's state (specifically the first segment's
 * primary color) and generates a color scheme using `@material/material-color-utilities`.
 * The generated colors are then applied as CSS custom properties (variables)
 * to the host element, allowing CSS rules to adapt to the device's color.
 *
 * If the device is offline, a neutral theme is applied. If no color is available
 * from the device state, a default white color is used to generate the theme.
 */
@Directive({
  selector: '[appDeviceTheme]',
})
export class DeviceThemeDirective {
  /**
   * Required input property holding the device object along with its reactive
   * state. The directive reacts to changes within this object's stateInfo
   * signal.
   */
  deviceWithState = input.required<DeviceWithState>({});

  /**
   * HostBinding to apply the generated CSS custom properties (variables)
   * directly to the host element's style attribute.
   * Example: `--primary-10:#RRGGBB; --p-secondary-10:#RRGGBB; ...`
   */
  @HostBinding('attr.style')
  cssThemeVariables = '';

  /**
   * HostBinding to add a base CSS class to the host element so that the custom
   * styles can apply.
   */
  @HostBinding('class')
  elementClass = 'device-theme';

  /**
   * A computed signal that derives the essential state needed for theme generation
   * from the `deviceWithState` input. It extracts the primary hex color from the
   * first segment and the device's online status.
   *
   * This signal uses a custom equality function (`themeInputStateEquals`) to ensure
   * that the downstream `effect` only runs when either the calculated `hexColor`
   * or the `isDeviceOnline` status actually changes, optimizing performance by
   * preventing unnecessary theme recalculations.
   */
  private themeInputState: Signal<ThemeInputState> = computed(
    () => {
      const stateInfo = this.deviceWithState().stateInfo();
      const isDeviceOnline = this.deviceWithState().isWebsocketConnected();

      // Extract the color array from the first segment of the device state.
      const colors = stateInfo?.state?.segment?.[0]?.colors;
      let hexColor = '#ffffff'; // Default to white

      // Colors can sometime have 4 values: RGB(W), white being optional. We
      // ignore the white value to calculate the theme color.
      if (colors && colors.length > 0 && colors[0].length >= 3) {
        // Ensure values are within valid range (0-255) before converting
        const r = Math.max(0, Math.min(255, colors[0][0]));
        const g = Math.max(0, Math.min(255, colors[0][1]));
        const b = Math.max(0, Math.min(255, colors[0][2]));
        hexColor = this.rgbToHex(r, g, b);
      }

      return { hexColor, isDeviceOnline };
    },
    // Pass the options object with the custom equality function
    { equal: this.themeInputStateEquals } // <-- Add this option
  );

  constructor() {
    // Use an effect to reactively update the theme whenever the device state changes.
    effect(() => {
      // Read the computed state
      const { hexColor, isDeviceOnline } = this.themeInputState();
      // Generate the theme based on the derived state
      this.themeFromSelectedColor(hexColor, isDeviceOnline);
    });
  }

  /**
   * Generates a Material Design color theme based on a source color and the
   * device's online status.
   *
   * Uses `@material/material-color-utilities` to create palettes and schemes.
   *
   * @param color The base hex color string (e.g., '#FF0000') to generate the
   *    theme from.
   * @param isDeviceOnline Boolean indicating if the device is currently
   *    connected. A vibrant scheme is used if online, a neutral one if offline.
   */
  themeFromSelectedColor(color: string, isDeviceOnline: boolean): void {
    // Define the specific tones we want to extract from the generated palettes.
    const tones = [
      0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 99, 100, 4, 6, 12, 17,
      22, 24, 87, 92, 94, 96,
    ];

    // Choose the appropriate Material scheme based on online status.
    const schemeStyle = isDeviceOnline ? SchemeVibrant : SchemeNeutral;

    // Create the color scheme from the base color HCT representation.
    // `true` indicates dark mode (though it might not be strictly used here, it
    // affects palette generation). `0.0` is the contrast level.
    const scheme = new schemeStyle(Hct.fromInt(argbFromHex(color)), true, 0.0);

    // Group the generated palettes by their role.
    const palettes = {
      primary: scheme.primaryPalette,
      secondary: scheme.secondaryPalette,
      tertiary: scheme.tertiaryPalette,
      neutral: scheme.neutralPalette,
      'neutral-variant': scheme.neutralVariantPalette, // Use quotes for kebab-case key
      error: scheme.errorPalette,
    };

    // Map each palette to the desired list of tones, converting each tone to
    // its hex representation.
    const colors = Object.entries(palettes).reduce(
      (acc, [paletteName, tonalPalette]) => {
        const hexColors = tones.map(tone => ({
          tone,
          hex: hexFromArgb(tonalPalette.tone(tone)),
        }));

        return { ...acc, [paletteName]: hexColors };
      },
      {} as colorsFromPaletteConfig
    );

    // Create the CSS custom properties string from the generated colors.
    // 'p' is used as a prefix for non-primary colors (e.g., --p-secondary-10).
    this.createCustomProperties(colors);
  }

  /**
   * Creates a string of CSS custom properties (variables) from the generated
   * theme colors.
   *
   * @param colorsFromPaletteConfig The object containing color roles and their
   *    corresponding hex/tone values.
   */
  createCustomProperties(colorsFromPaletteConfig: colorsFromPaletteConfig) {
    const themePrefix = 'device';
    let styleString = '';

    // Iterate through each color role (primary, secondary, etc.)
    for (const [key, palette] of Object.entries(colorsFromPaletteConfig)) {
      // Iterate through each tone within the palette
      palette.forEach(({ hex, tone }: { hex: string; tone: number }) => {
        styleString += `--${themePrefix}-${key}-${tone}:${hex};`;
      });
    }

    // Update the host binding variable, which will apply the styles to the
    // element.
    this.cssThemeVariables = styleString;
  }

  /**
   * Converts a single RGB color component (0-255) to its two-digit hex
   * representation.
   *
   * @param c The color component value.
   * @returns The two-digit hex string (e.g., '0F', 'FF').
   */
  private componentToHex(c: number) {
    const hex = c.toString(16);
    // Ensure two digits (e.g., 'A' becomes '0A')
    return hex.length == 1 ? '0' + hex : hex;
  }

  /**
   * Converts RGB color values to a hex color string.
   * @param r Red component (0-255).
   * @param g Green component (0-255).
   * @param b Blue component (0-255).
   * @returns The hex color string (e.g., '#FF00AA').
   */
  private rgbToHex(r: number, g: number, b: number) {
    return (
      '#' +
      this.componentToHex(r) +
      this.componentToHex(g) +
      this.componentToHex(b)
    );
  }

  /**
   * Equality function for the `themeInputState` computed signal.
   * Optimizes theme updates by comparing only the values. Prevents the effect
   * from running if these specific values haven't changed.
   *
   * @param a Previous `ThemeInputState`.
   * @param b Current `ThemeInputState`.
   * @returns `true` if `hexColor` and `isDeviceOnline` are identical.
   */
  private themeInputStateEquals(
    a: ThemeInputState,
    b: ThemeInputState
  ): boolean {
    // Return true if both color and online status are the same
    return a.hexColor === b.hexColor && a.isDeviceOnline === b.isDeviceOnline;
  }
}
