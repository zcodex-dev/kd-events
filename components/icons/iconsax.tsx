import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
}

// Iconsax Linear: Sun (Sun 1)
export const IconsaxSun: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Moon
export const IconsaxMoon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M21.53 15.93C21.37 15.66 20.92 15.24 20.5 15.44C19.79 15.77 19 15.96 18.16 15.96C15.03 15.96 12.49 13.42 12.49 10.29C12.49 9.45 12.68 8.66 13.01 7.95C13.21 7.53 12.79 7.08 12.52 6.92C12.25 6.76 11.76 6.84 11.46 7.11C8.23 10.02 7.8 14.85 10.48 18.27C13.16 21.69 18.11 22.41 21.64 19.25C21.91 18.95 21.99 18.46 21.83 18.19L21.53 15.93Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Arrow Right (Arrow Right 2)
export const IconsaxArrowRight: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Arrow Up Right (External Link)
export const IconsaxArrowUpRight: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M17.5 6.5L6.5 17.5M17.5 14.5V6.5H9.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Document Download
export const IconsaxDocumentDownload: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M9 11V17L11 15M9 17L7 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 10H18C15 10 14 9 14 6V2L22 10Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Close
export const IconsaxClose: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Call
export const IconsaxCall: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.02 20.44C20.53 20.94 19.95 21.27 19.27 21.44C18.59 21.61 17.87 21.7 17.1 21.7C15.98 21.7 14.76 21.42 13.45 20.86C12.14 20.3 10.88 19.51 9.61 18.48C8.33 17.45 7.18 16.26 6.15 14.91C5.13 13.56 4.35 12.14 3.82 10.66C3.29 9.18 3.02 7.73 3.02 6.31C3.02 5.57 3.1 4.87 3.27 4.22C3.44 3.57 3.76 3 4.22 2.52C4.89 1.84 5.7 1.5 6.65 1.5C7.05 1.5 7.43 1.59 7.79 1.76C8.15 1.93 8.46 2.19 8.7 2.53L10.83 5.54C11.07 5.88 11.23 6.2 11.32 6.49C11.41 6.78 11.45 7.06 11.45 7.32C11.45 7.62 11.36 7.92 11.19 8.22C11.02 8.52 10.78 8.82 10.47 9.12L9.74 9.86C9.64 9.96 9.59 10.08 9.59 10.22C9.59 10.29 9.61 10.37 9.64 10.45C9.67 10.53 9.72 10.62 9.79 10.71C10.81 12.55 12.07 14.1 13.58 15.36C14.23 15.91 14.83 16.32 15.38 16.59C15.93 16.86 16.41 17.02 16.82 17.07C16.91 17.08 17 17.06 17.09 17.01C17.18 16.96 17.26 16.89 17.33 16.82L18.06 16.09C18.36 15.78 18.66 15.54 18.96 15.37C19.26 15.2 19.56 15.11 19.86 15.11C20.12 15.11 20.4 15.15 20.69 15.24C20.98 15.33 21.3 15.49 21.64 15.73L23.77 17.86C24.11 18.1 24.37 18.41 24.54 18.77C24.71 19.13 24.8 19.51 24.8 19.91"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Sms (Email)
export const IconsaxSms: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Message (Chat/WhatsApp)
export const IconsaxMessage: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 8H17M7 13H13"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Send (Telegram/Direct)
export const IconsaxSend: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M7.39999 6.32003L15.89 3.49003C19.7 2.22003 21.77 4.30003 20.51 8.11003L17.68 16.6C15.78 22.31 12.66 22.31 10.76 16.6L9.91999 14.08L7.39999 13.24C1.68999 11.34 1.68999 8.23003 7.39999 6.32003Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.11 13.6501L13.69 10.0601"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Linear: Global (Web/Internet)
export const IconsaxGlobal: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.99998 3H8.99998C7.04998 8.84 7.04998 15.16 8.99998 21H7.99998"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 3C16.95 8.84 16.95 15.16 15 21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 16V15C8.84 16.95 15.16 16.95 21 15V16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 9C8.84 7.05 15.16 7.05 21 9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
