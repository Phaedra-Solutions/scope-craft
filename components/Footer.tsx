'use client';

import React from 'react';
import { Linkedin, Instagram, X, AtSign, Github } from 'lucide-react';

const SOCIAL_LINKS = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/phaedra-solutions',
    icon: Linkedin
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/phaedrasolutions',
    icon: Instagram
  },
  {
    name: 'X',
    href: 'https://x.com/phaedrasolution',
    icon: X
  },
  {
    name: 'Threads',
    href: 'https://www.threads.com/@phaedrasolutions',
    icon: AtSign
  },
  {
    name: 'GitHub',
    href: 'https://github.com/Phaedra-Solutions',
    icon: Github
  }
];

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#DDE3E7] bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#64707A] text-center sm:text-left">
          &copy; {new Date().getFullYear()} Powered by{' '}
          <a
            href="https://www.phaedrasolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#082A1C] underline-offset-4 hover:underline transition-colors"
          >
            Phaedra Solutions
          </a>
        </p>

        <nav aria-label="Phaedra Solutions social media" className="flex items-center space-x-2">
          {SOCIAL_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.name}
                title={item.name}
                className="w-9 h-9 rounded-xl border border-[#DDE3E7] bg-[#F4F7F9] text-[#64707A] hover:text-[#082A1C] hover:border-[#082A1C] hover:bg-[#CDFF8C]/35 flex items-center justify-center transition-all duration-200 active:scale-[0.98]"
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
};
