import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700/50 text-slate-400">
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand and Socials */}
          <div>
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              SIH Portal
            </Link>
            <p className="mt-2 text-sm max-w-xs">
              A portal for the Smart India Hackathon, designed for students to collaborate and innovate.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="https://github.com/abdulbarr730" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Github size={20} /></a>
              <a href="https://www.linkedin.com/in/abdul-barr-9092a4251/" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Linkedin size={20} /></a>
              <a href="https://x.com/ipokealot" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Twitter size={20} /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-white tracking-wider">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/updates" className="hover:text-white">Updates</Link></li>
              <li><Link href="/ideas" className="hover:text-white">Idea Board</Link></li>
              <li><Link href="/resources" className="hover:text-white">Resource Hub</Link></li>
              <li><Link href="/profile" className="hover:text-white">Profile</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h3 className="font-semibold text-white tracking-wider">Contact Developer</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="tel:+917479934706" className="hover:text-white">+91 7479934706</a>
              </li>
              <li>
                <a href="mailto:abdulbarr730@gmail.com" className="hover:text-white">abdulbarr730@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm">
          <p>&copy; 2025 College Hackathon Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}