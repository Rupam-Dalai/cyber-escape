import React from 'react';

export type PixelAvatarId = 
  | 'cyber_knight'
  | 'frankenstein'
  | 'ninja_red'
  | 'cool_shades'
  | 'red_hero'
  | 'female_ninja'
  | 'viking'
  | 'blue_alien'
  | 'pirate'
  | 'hard_hat';

interface PixelAvatarProps {
  avatarId?: PixelAvatarId | string;
  size?: number; // Size in pixels
  className?: string;
}

export const AVATAR_LIST: { id: PixelAvatarId; name: string }[] = [
  { id: 'cyber_knight', name: 'Cyber Knight' },
  { id: 'ninja_red', name: 'Red Bandana Ninja' },
  { id: 'cool_shades', name: 'Shades & Cap' },
  { id: 'red_hero', name: 'Redhair Hero' },
  { id: 'frankenstein', name: 'Pixel Frankenstein' },
  { id: 'female_ninja', name: 'Shadow Shinobi' },
  { id: 'viking', name: 'Viking Warrior' },
  { id: 'blue_alien', name: 'Cyber Alien' },
  { id: 'pirate', name: 'Pixel Pirate' },
  { id: 'hard_hat', name: 'Tech Engineer' },
];

export const getDeterministicAvatar = (seed: string): PixelAvatarId => {
  if (!seed) return 'cyber_knight';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_LIST.length;
  return AVATAR_LIST[index].id;
};

export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  avatarId,
  size = 48,
  className = '',
}) => {
  const selectedId = avatarId && AVATAR_LIST.some(a => a.id === avatarId)
    ? (avatarId as PixelAvatarId)
    : getDeterministicAvatar(avatarId || 'HERO');

  const renderAvatarSvg = () => {
    switch (selectedId) {
      case 'frankenstein':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#141B15" />
            <rect x="3" y="1" width="10" height="3" fill="#1E2923" />
            <rect x="2" y="4" width="12" height="9" fill="#4ADE80" />
            <rect x="1" y="6" width="1" height="3" fill="#94A3B8" />
            <rect x="14" y="6" width="1" height="3" fill="#94A3B8" />
            <rect x="4" y="6" width="2" height="2" fill="#022C22" />
            <rect x="10" y="6" width="2" height="2" fill="#022C22" />
            <rect x="5" y="7" width="1" height="1" fill="#FFFFFF" />
            <rect x="11" y="7" width="1" height="1" fill="#FFFFFF" />
            <rect x="5" y="10" width="6" height="1" fill="#022C22" />
            <rect x="6" y="11" width="2" height="1" fill="#FFFFFF" />
          </svg>
        );

      case 'ninja_red':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#18181B" />
            <rect x="2" y="2" width="12" height="3" fill="#EF4444" />
            <rect x="12" y="4" width="3" height="2" fill="#EF4444" />
            <rect x="2" y="5" width="12" height="9" fill="#FCA5A5" />
            <rect x="3" y="6" width="10" height="3" fill="#18181B" />
            <rect x="4" y="7" width="2" height="1" fill="#FFFFFF" />
            <rect x="10" y="7" width="2" height="1" fill="#FFFFFF" />
            <rect x="2" y="9" width="12" height="5" fill="#EF4444" />
          </svg>
        );

      case 'cool_shades':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#0F172A" />
            <rect x="2" y="1" width="12" height="3" fill="#3B82F6" />
            <rect x="1" y="3" width="14" height="1" fill="#1D4ED8" />
            <rect x="3" y="4" width="10" height="10" fill="#FDBA74" />
            <rect x="2" y="6" width="12" height="3" fill="#090D16" />
            <rect x="3" y="6" width="4" height="2" fill="#1E293B" />
            <rect x="9" y="6" width="4" height="2" fill="#1E293B" />
            <rect x="3" y="6" width="1" height="1" fill="#FFFFFF" />
            <rect x="9" y="6" width="1" height="1" fill="#FFFFFF" />
            <rect x="5" y="11" width="6" height="1" fill="#9A3412" />
            <rect x="6" y="11" width="4" height="1" fill="#FFFFFF" />
          </svg>
        );

      case 'red_hero':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#1C1917" />
            <rect x="2" y="1" width="12" height="4" fill="#EA580C" />
            <rect x="3" y="5" width="10" height="9" fill="#FED7AA" />
            <rect x="4" y="6" width="2" height="2" fill="#451A03" />
            <rect x="10" y="6" width="2" height="2" fill="#451A03" />
            <rect x="5" y="7" width="1" height="1" fill="#FFFFFF" />
            <rect x="11" y="7" width="1" height="1" fill="#FFFFFF" />
            <rect x="2" y="9" width="12" height="5" fill="#C2410C" />
            <rect x="5" y="11" width="6" height="1" fill="#FFFFFF" />
          </svg>
        );

      case 'female_ninja':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#111827" />
            <rect x="5" y="0" width="6" height="3" fill="#312E81" />
            <rect x="2" y="2" width="12" height="5" fill="#1E1B4B" />
            <rect x="3" y="5" width="10" height="9" fill="#FECDD3" />
            <rect x="4" y="7" width="2" height="2" fill="#312E81" />
            <rect x="10" y="7" width="2" height="2" fill="#312E81" />
            <rect x="5" y="7" width="1" height="1" fill="#FFFFFF" />
            <rect x="11" y="7" width="1" height="1" fill="#FFFFFF" />
            <rect x="6" y="11" width="4" height="1" fill="#E11D48" />
          </svg>
        );

      case 'viking':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#292524" />
            <rect x="2" y="1" width="12" height="4" fill="#64748B" />
            <rect x="1" y="0" width="2" height="3" fill="#F8FAFC" />
            <rect x="13" y="0" width="2" height="3" fill="#F8FAFC" />
            <rect x="3" y="5" width="10" height="9" fill="#FFEDD5" />
            <rect x="4" y="6" width="2" height="2" fill="#0F172A" />
            <rect x="10" y="6" width="2" height="2" fill="#0F172A" />
            <rect x="1" y="8" width="14" height="6" fill="#D97706" />
            <rect x="6" y="10" width="4" height="2" fill="#78350F" />
          </svg>
        );

      case 'blue_alien':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#030712" />
            <rect x="3" y="2" width="10" height="11" fill="#3B82F6" />
            <rect x="2" y="4" width="12" height="7" fill="#60A5FA" />
            <rect x="3" y="5" width="4" height="3" fill="#1E1B4B" />
            <rect x="9" y="5" width="4" height="3" fill="#1E1B4B" />
            <rect x="4" y="6" width="2" height="1" fill="#67E8F9" />
            <rect x="10" y="6" width="2" height="1" fill="#67E8F9" />
            <rect x="6" y="10" width="4" height="1" fill="#1E3A8A" />
          </svg>
        );

      case 'pirate':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#18181B" />
            <rect x="1" y="1" width="14" height="3" fill="#991B1B" />
            <rect x="4" y="0" width="8" height="2" fill="#991B1B" />
            <rect x="3" y="4" width="10" height="10" fill="#FED7AA" />
            <rect x="4" y="6" width="3" height="2" fill="#090D16" />
            <rect x="10" y="6" width="2" height="2" fill="#451A03" />
            <rect x="11" y="7" width="1" height="1" fill="#FFFFFF" />
            <rect x="2" y="8" width="12" height="6" fill="#27272A" />
          </svg>
        );

      case 'hard_hat':
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#1E293B" />
            <rect x="3" y="1" width="10" height="4" fill="#F59E0B" />
            <rect x="1" y="4" width="14" height="1.5" fill="#D97706" />
            <rect x="3" y="5.5" width="10" height="8.5" fill="#FFEDD5" />
            <rect x="4" y="7" width="2" height="2" fill="#1E293B" />
            <rect x="10" y="7" width="2" height="2" fill="#1E293B" />
            <rect x="5" y="8" width="1" height="1" fill="#FFFFFF" />
            <rect x="11" y="8" width="1" height="1" fill="#FFFFFF" />
            <rect x="2" y="10" width="12" height="4" fill="#9A3412" />
          </svg>
        );

      case 'cyber_knight':
      default:
        return (
          <svg viewBox="0 0 16 16" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="#090D16" />
            <rect x="2" y="2" width="12" height="12" fill="#475569" />
            <rect x="3" y="1" width="10" height="2" fill="#64748B" />
            <rect x="2" y="5" width="12" height="3" fill="#0F172A" />
            <rect x="3" y="6" width="10" height="1" fill="#38BDF8" />
            <rect x="5" y="6" width="3" height="1" fill="#E0F2FE" />
            <rect x="6" y="10" width="4" height="2" fill="#1E293B" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl overflow-hidden border-2 border-white/20 shadow-md bg-[#0F172A] image-rendering-pixelated ${className}`}
      style={{ width: size, height: size }}
    >
      {renderAvatarSvg()}
    </div>
  );
};
