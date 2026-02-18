'use client';

import { 
  Github, Linkedin, Code, BrainCircuit, BookOpen, 
  Terminal, Globe, Cpu, Hash, Database 
} from 'lucide-react';

// PLATFORM CONFIGURATION
const PLATFORM_META = {
  github: { 
    icon: Github, 
    label: 'GitHub', 
    color: 'bg-[#333] hover:bg-black', 
    text: 'text-white' 
  },
  linkedin: { 
    icon: Linkedin, 
    label: 'LinkedIn', 
    color: 'bg-[#0077b5] hover:bg-[#005582]', 
    text: 'text-white' 
  },
  leetcode: { 
    icon: Code, 
    label: 'LeetCode', 
    color: 'bg-[#FFA116] hover:bg-[#e59114]', 
    text: 'text-white' 
  },
  codeforces: { 
    icon: Terminal, 
    label: 'Codeforces', 
    color: 'bg-[#1f8dd6] hover:bg-[#1a75b2]', 
    text: 'text-white' 
  },
  codechef: { 
    icon: Cpu, 
    label: 'CodeChef', 
    color: 'bg-[#5B4638] hover:bg-[#4a392e]', 
    text: 'text-white' 
  },
  geeksforgeeks: { 
    icon: BrainCircuit, 
    label: 'GeeksforGeeks', 
    color: 'bg-[#2f8d46] hover:bg-[#257038]', 
    text: 'text-white' 
  },
  stackoverflow: { 
    icon: Database, 
    label: 'Stack Overflow', 
    color: 'bg-[#f48024] hover:bg-[#da6e1b]', 
    text: 'text-white' 
  },
  medium: { 
    icon: BookOpen, 
    label: 'Medium', 
    color: 'bg-black hover:bg-gray-800', 
    text: 'text-white' 
  },
  devto: { 
    icon: Hash, 
    label: 'Dev.to', 
    color: 'bg-black hover:bg-gray-800', 
    text: 'text-white' 
  },
  kaggle: { 
    icon: Globe, 
    label: 'Kaggle', 
    color: 'bg-[#20BEFF] hover:bg-[#1aa3db]', 
    text: 'text-white' 
  },
  website: {
    icon: Globe,
    label: 'Portfolio',
    color: 'bg-indigo-600 hover:bg-indigo-500',
    text: 'text-white'
  }
};

export default function SocialBadges({ profiles, className = "" }) {
  if (!profiles) return null;

  const socialLinks = Object.entries(profiles)
    .map(([key, value]) => {
      const meta = PLATFORM_META[key.toLowerCase()];
      return meta && value ? { ...meta, url: value, id: key } : null;
    })
    .filter(Boolean);

  if (socialLinks.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {socialLinks.map(({ id, url, label, icon: Icon, color, text }) => (
        <a
          key={id}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          // CHANGE: Used 'group/social' instead of just 'group'
          className={`
            group/social relative flex items-center justify-center 
            w-8 h-8 rounded-full 
            transition-all duration-300 ease-out
            shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-110
            ${color} ${text}
          `}
        >
          <Icon size={16} strokeWidth={2} />

          {/* Tooltip: Only shows when hovering THIS specific icon */}
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/social:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
            {label}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
          </span>
        </a>
      ))}
    </div>
  );
}