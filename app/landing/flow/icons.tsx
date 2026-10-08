import type { CSSProperties, ReactNode } from 'react';

/* Ícones de traço próprios (o projeto não usa biblioteca de ícones). 24×24, traço 1.8. */
type P = { size?: number; color?: string; style?: CSSProperties; className?: string };

function base(children: ReactNode, { size = 16, color, style, className }: P, fill = false) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ color, flex: '0 0 auto', ...style }}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: P) => base(<path d="M5 12h14M13 6l6 6-6 6" />, p);
export const ArrowUpRight = (p: P) => base(<path d="M7 17 17 7M8 7h9v9" />, p);
export const Menu = (p: P) => base(<path d="M4 7h16M4 12h16M4 17h16" />, p);
export const Close = (p: P) => base(<path d="m6 6 12 12M18 6 6 18" />, p);
export const Check = (p: P) => base(<path d="M5 12.5 9.5 17 19 7.5" />, p);
export const CheckCircle = (p: P) => base(<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8 5.7-5.8" /></>, p);
export const Clock = (p: P) => base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, p);
export const CaretDown = (p: P) => base(<path d="m6 9 6 6 6-6" />, p);
export const Lightning = (p: P) => base(<path d="M13 2 4 14h7l-1 8 9-12h-7z" />, p, true);
export const Sparkle = (p: P) =>
  base(<path d="M10 2.5 11.9 8.1 17.5 10 11.9 11.9 10 17.5 8.1 11.9 2.5 10 8.1 8.1zM18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />, p, true);
export const Chat = (p: P) => base(<path d="M4 5h16v11H10l-5 4v-4H4z" />, p);
export const Send = (p: P) => base(<path d="m3 11 18-8-8 18-2-8zM11 13l4-4" />, p);
export const Envelope = (p: P) => base(<><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>, p);
export const FileSheet = (p: P) => base(<><path d="M6 2.5h9l4 4V21.5H6z" /><path d="M14.5 2.5V7H19M9 11.5h7M9 15h7M9 18.5h7M12.5 11.5v7" /></>, p);
export const FileText = (p: P) => base(<><path d="M6 2.5h9l4 4V21.5H6z" /><path d="M14.5 2.5V7H19M9 12h7M9 15.5h7M9 19h4" /></>, p);
export const FilePdf = (p: P) => base(<><path d="M6 2.5h9l4 4V21.5H6z" /><path d="M14.5 2.5V7H19M8.5 17v-4h1.5a1.3 1.3 0 0 1 0 2.6H8.5M13 17v-4h1a2 2 0 0 1 0 4zM17 13h-1.5v4M15.5 15H17" /></>, p);
export const Scale = (p: P) => base(<path d="M12 3v17M7 21h10M4 7h16M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z" />, p);
export const Flask = (p: P) => base(<path d="M9 3h6M10 3v6l-5.2 9.2A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.8L14 9V3M7.5 15h9" />, p);
export const Bank = (p: P) => base(<path d="m3 9 9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18" />, p);
export const Truck = (p: P) => base(<><path d="M2 6h12v10H2zM14 9h4l3 3.5V16h-7" /><circle cx="6" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></>, p);
export const Warehouse = (p: P) => base(<path d="M3 21V9l9-5 9 5v12M7 21v-8h10v8M7 17h10" />, p);
export const Handshake = (p: P) =>
  base(<path d="m2 11 4-4 4 1.5M22 11l-4-4-3 .5-5 4.5a1.6 1.6 0 0 0 2.3 2.2L15 12l4 4M6 7l-.5 7 3.5 3.5M9 14.5l2 2M11 12.5l3 3M13.5 17.5l1 1" />, p);
export const ChartUp = (p: P) => base(<path d="M4 19h16M5 15l4-4 3 3 7-7M15 7h4v4" />, p);
export const Split = (p: P) => base(<path d="M3 12h6l4-5h7M13 17h7M9 12l4 5M17 4l3 3-3 3M17 14l3 3-3 3" />, p);
export const Bell = (p: P) => base(<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0" />, p);
export const Clipboard = (p: P) => base(<><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="M9 4V2.8h6V4M8.5 10h7M8.5 14h7M8.5 18h4" /></>, p);
export const Shield = (p: P) => base(<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-4.5" />, p);
export const Sliders = (p: P) => base(<><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></>, p);
export const Lock = (p: P) => base(<><rect x="5" y="11" width="14" height="10" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>, p);
export const UserGear = (p: P) => base(<><circle cx="10" cy="8" r="4" /><path d="M3 20.5a7 7 0 0 1 10.5-6" /><circle cx="18" cy="17" r="2.5" /><path d="M18 13v1.5M18 19.5V21M14 17h1.5M20.5 17H22" /></>, p);
export const Timer = (p: P) => base(<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 2.5M9.5 2.5h5" /></>, p);
export const Search = (p: P) => base(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>, p);
export const Plus = (p: P) => base(<path d="M12 5v14M5 12h14" />, p);
export const Trophy = (p: P) => base(<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20.5h8M10 17h4v3.5h-4z" />, p);
export const Coin = (p: P) => base(<><circle cx="12" cy="12" r="9" /><path d="M14.6 9.2A2.6 2 0 0 0 12 7.8c-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2 2.6.8 2.6 2-1.1 2.1-2.6 2.1a2.6 2 0 0 1-2.7-1.5M12 6v1.8M12 16.2V18" /></>, p);
export const Funnel = (p: P) => base(<path d="M3 5h18l-7 8v6l-4 2v-8z" />, p);
export const Branch = (p: P) => base(<><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="7" r="2" /><path d="M6 7v10M18 9c0 4.5-6 3.5-11.2 8.4" /></>, p);
export const Hourglass = (p: P) => base(<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />, p);
export const Kanban = (p: P) => base(<><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M9 4v16M15 4v16" /></>, p);
export const Book = (p: P) => base(<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 1.5h13V18" />, p);
export const PlayCircle = (p: P) => base(<><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5z" /></>, p);
export const Users = (p: P) => base(<><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2A6 6 0 0 1 21 20" /></>, p);
export const Leaf = (p: P) => base(<path d="M12 21V9M12 13c-4 0-6-2.5-6-6 4 0 6 2.5 6 6zM12 10c0-3.5 2-6 6-6 0 3.5-2 6-6 6zM12 17.5c-3 0-5-2-5-4.5 3 0 5 2 5 4.5zM12 17.5c0-2.5 2-4.5 5-4.5 0 2.5-2 4.5-5 4.5z" />, p);
export const Globe = (p: P) => base(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>, p);
export const Receipt = (p: P) => base(<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />, p);
export const LinkIcon = (p: P) => base(<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />, p);
export const Warning = (p: P) => base(<path d="M12 3.5 21.5 20h-19zM12 10v4.5M12 17.5v.2" />, p);
export const MapPin = (p: P) => base(<><path d="M12 21s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>, p);
export const Route = (p: P) => base(<><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></>, p);
export const Calculator = (p: P) => base(<><rect x="5" y="2.5" width="14" height="19" rx="1.5" /><path d="M8 6.5h8M8.5 11h.1M12 11h.1M15.5 11h.1M8.5 14.5h.1M12 14.5h.1M15.5 14.5h.1M8.5 18h.1M12 18h3.5" /></>, p);
export const Target = (p: P) => base(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>, p);
export const Upload = (p: P) => base(<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />, p);
