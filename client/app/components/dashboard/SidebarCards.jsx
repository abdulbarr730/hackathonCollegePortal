'use client';

import { motion } from 'framer-motion';
import {
  Megaphone,
  Lightbulb,
  BookOpen,
  Users,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function SidebarCards({ updates, router }) {

  // PREMIUM THEME MAP
  const themeMap = {
    indigo: {
      accent: "bg-indigo-600",
      soft: "bg-indigo-50 dark:bg-indigo-900/20",
      text: "text-indigo-700 dark:text-indigo-400",
      border: "group-hover:border-indigo-200 dark:group-hover:border-indigo-800",
      button: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
    },
    teal: {
      accent: "bg-teal-600",
      soft: "bg-teal-50 dark:bg-teal-900/20",
      text: "text-teal-700 dark:text-teal-400",
      border: "group-hover:border-teal-200 dark:group-hover:border-teal-800",
      button: "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20"
    },
    blue: {
      accent: "bg-blue-600",
      soft: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-400",
      border: "group-hover:border-blue-200 dark:group-hover:border-blue-800",
      button: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
    },
    purple: {
      accent: "bg-purple-600",
      soft: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-700 dark:text-purple-400",
      border: "group-hover:border-purple-200 dark:group-hover:border-purple-800",
      button: "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"
    }
  };

  const cards = [
    {
      id: 'updates',
      title: "Latest Updates",
      icon: Megaphone,
      theme: "indigo",
      description: "Official announcements and platform changes.",
      items: updates,
      buttonText: "View All Updates",
      onClick: () => router.push('/updates'),
    },
    {
      id: 'ideas',
      title: "Submit Idea",
      icon: Lightbulb,
      theme: "purple",
      description: "Have a solution? Pitch it to the community and find contributors.",
      buttonText: "Pitch Now",
      onClick: () => router.push('/ideas'),
    },
    {
      id: 'users',
      title: "Find Teammates",
      icon: Users,
      theme: "teal",
      description: "Browse registered users and build your dream squad.",
      buttonText: "Search Users",
      onClick: () => router.push('/dashboard/all-users'),
    },
    {
      id: 'resources',
      title: "Resources",
      icon: BookOpen,
      theme: "blue",
      description: "Access hackathon guidelines, documentation, and references.",
      buttonText: "Open Library",
      onClick: () => router.push('/resources'),
    }
  ];

  return (
    <aside className="space-y-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const t = themeMap[card.theme];

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`
              group relative overflow-hidden rounded-2xl
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800 ${t.border}
              shadow-sm hover:shadow-xl transition-all duration-300
            `}
          >
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 w-full h-1 ${t.accent} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />

            <div className="p-5">
              
              {/* Card Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-2.5 rounded-xl ${t.soft} ${t.text} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {card.title}
                </h3>
              </div>

              {/* Card Content */}
              <div className="mb-5 min-h-[50px]">
                {card.items && card.items.length > 0 ? (
                  <ul className="space-y-2">
                    {card.items.slice(0, 3).map((u) => (
                      <li key={u._id}>
                        <Link 
                          href={u.url || `/updates/${u._id}`}
                          className="group/link flex items-start gap-2.5 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${t.accent}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors">
                              {u.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {u.summary}
                            </p>
                          </div>
                          <ChevronRight size={14} className="ml-auto mt-1 text-slate-300 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={card.onClick}
                className={`
                  w-full py-2.5 rounded-xl text-sm font-bold
                  ${t.button}
                  shadow-lg transition-all active:scale-95
                  flex items-center justify-center gap-2 group/btn
                `}
              >
                {card.buttonText}
                <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
              </button>

            </div>
          </motion.div>
        );
      })}
    </aside>
  );
}