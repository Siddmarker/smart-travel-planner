'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';

export default function DayDrawer({ day, title, activities, isToday }: any) {
  // Default to open if it's the current day (smart default)
  const [isOpen, setIsOpen] = useState(isToday);

  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* Drawer Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-white px-6 py-5 text-left transition-colors hover:bg-gray-50"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Day {day}</p>
          <h3 className="text-lg font-black text-gray-900">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="text-gray-400" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="space-y-4 border-t border-gray-100 bg-gray-50/50 px-6 py-6">
              {activities.map((activity: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{activity.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{activity.desc}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-600">
                      <MapPin size={12} />
                      <span>{activity.distance || '15 min drive'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}