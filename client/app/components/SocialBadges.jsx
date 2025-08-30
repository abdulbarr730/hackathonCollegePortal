'use client';

import { Github, Linkedin, Code, BrainCircuit, BookOpen, ToyBrick, Waypoints, SquareCode } from 'lucide-react';

// Map platform keys to icons and brand colors for styling
const PLATFORM_META = {
  github: { icon: Github, label: 'GitHub', className: 'bg-gray-700 hover:bg-gray-600' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', className: 'bg-sky-600 hover:bg-sky-500' },
  leetcode: { icon: Code, label: 'LeetCode', className: 'bg-amber-500 hover:bg-amber-400' },
  codeforces: { icon: Waypoints, label: 'Codeforces', className: 'bg-rose-600 hover:bg-rose-500' },
  codechef: { icon: ToyBrick, label: 'CodeChef', className: 'bg-yellow-700 hover:bg-yellow-600' },
  geeksforgeeks: { icon: BrainCircuit, label: 'GeeksforGeeks', className: 'bg-green-600 hover:bg-green-500' },
  stackoverflow: { icon: SquareCode, label: 'Stack Overflow', className: 'bg-orange-500 hover:bg-orange-400' },
  medium: { icon: BookOpen, label: 'Medium', className: 'bg-slate-600 hover:bg-slate-500' },
  devto: { icon: BookOpen, label: 'Dev.to', className: 'bg-slate-600 hover:bg-slate-500' },
  kaggle: { icon: Waypoints, label: 'Kaggle', className: 'bg-cyan-500 hover:bg-cyan-400' },
};

export default function SocialBadges({ profiles, className }) {
  if (!profiles) {
    return null;
  }

  const socialLinks = Object.entries(profiles)
    .filter(([key, value]) => {
      const platformKey = key.toLowerCase();
      // Ensure the link is valid and the platform is recognized
      return value && value.trim() !== '' && PLATFORM_META[platformKey];
    })
    .map(([key, value]) => {
      const platformKey = key.toLowerCase();
      return {
        ...PLATFORM_META[platformKey],
        url: value,
      };
    });

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {socialLinks.map(({ url, label, icon: Icon, className: platformClass }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          // Base styles + platform-specific color styles
          className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform hover:scale-110 ${platformClass}`}
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
}