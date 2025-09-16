import { forwardRef, memo } from "react";

export type AppIconProps = Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> & {
  /**
   * Width/height of the icon. Accepts number (px) or any CSS size string.
   * If not provided, defaults to 20 (matching many uses in Showcase).
   */
  size?: number | string;
  /**
   * Accessible title for screen readers. When provided, a <title> element is rendered.
   * If you prefer using aria-label/aria-labelledby, you can omit this.
   */
  title?: string;
};

/**
 * AppIcon
 * A shared SVG icon used in the Showcase pages. This replaces duplicated inline SVGs.
 *
 * - Inherits currentColor so you can style via parent className (e.g., text-white/40).
 * - Keep markup and viewBox identical to the original inline SVGs to avoid visual changes.
 */
export const AppIcon = memo(
  forwardRef<SVGSVGElement, AppIconProps>(function AppIcon(
    { size = 20, title = "App Icon", className, ...props },
    ref,
  ) {
    const dim = typeof size === "number" ? `${size}` : size;
    // If consumer passes aria-label/labelledby, prefer that over title for a11y.
    // Otherwise, provide a <title> with the given title text.
    const labelled = props["aria-label"] || props["aria-labelledby"];

    return (
      <svg
        ref={ref}
        role="img"
        aria-hidden={labelled ? undefined : undefined}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 486 640"
        width={dim}
        height={dim}
        fill="currentColor"
        className={className}
        {...props}
      >
        {!labelled && title ? <title>{title}</title> : null}
        <path d="M278.186 397.523C241.056 392.676 201.368 394.115 171.855 391.185C142.556 387.776 131.742 363.167 136.856 355.603C158.378 364.712 177.928 368.547 201.794 368.387C241.642 368.227 275.576 356.242 303.544 332.486C331.511 308.729 345.362 280.285 344.936 247.207C342.912 222.545 327.782 184.194 293.742 157.188C290.971 154.791 283.673 150.583 283.673 150.583C258.635 135.615 230.188 128.318 198.438 128.69C170.843 130.129 149.747 135.509 126.574 143.711C73.0358 162.781 54.7103 208.589 55.243 249.018V249.924C63.1273 312.298 93.8652 328.757 125.935 351.342L88.1651 394.913L89.1772 400.613C89.1772 400.613 144.527 399.441 174.412 401.998C257.783 410.84 291.877 467.408 292.516 511.14C293.209 560.784 250.431 625.022 180.645 625.555C81.2397 626.354 78.5229 422.292 78.5229 422.292L0 504.215C2.6636 550.237 46.613 601.958 82.5182 617.938C130.356 636.847 187.251 632.107 211.969 629.603C237.486 627.046 363.368 607.072 379.136 498.143C379.136 467.302 358.041 407.964 278.186 397.523ZM266.093 226.433C279.678 277.302 283.14 315.334 263.749 345.27C250.538 359.598 229.868 364.872 209.199 363.114C206.535 362.901 179.207 358.267 162.746 322.685C179.26 301.272 218.522 250.563 255.599 204.222C260.66 209.814 266.093 226.487 266.093 226.487V226.433ZM136.643 152.607H136.536C149.534 135.935 185.44 129.916 203.392 135.349C221.771 144.404 235.515 161.023 250.645 192.769L196.201 261.909L156.62 312.245C150.333 300.633 144.58 286.997 140.158 271.337C120.927 203.103 123.484 170.877 136.589 152.607H136.643Z" />
        <path d="M370.506 0C370.506 55.3433 310.362 106.638 255.013 106.638C310.362 106.638 370.506 157.933 370.506 213.277C370.506 157.933 430.65 106.638 486 106.638C430.650 106.638 370.506 55.3433 370.506 0Z" />
      </svg>
    );
  }),
);

AppIcon.displayName = "AppIcon";

export default AppIcon;
