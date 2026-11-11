import React from 'react';
import {
  CreditCard,
  FileCode,
  Printer,
  Globe2,
  BookMarked,
  HelpCircle,
} from 'lucide-react';

const CATEGORY_STYLES = {
  'Royalty & Payments': {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CreditCard,
  },
  'ISBN & Metadata Issues': {
    bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: FileCode,
  },
  'Printing & Quality': {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Printer,
  },
  'Distribution & Availability': {
    bg: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: Globe2,
  },
  'Book Status & Production Updates': {
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: BookMarked,
  },
  'General Inquiry': {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: HelpCircle,
  },
};

export const CategoryBadge = ({ category = 'General Inquiry', size = 'normal' }) => {
  const meta = CATEGORY_STYLES[category] || CATEGORY_STYLES['General Inquiry'];
  const Icon = meta.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold tracking-wide ${
        meta.bg
      } ${isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
    >
      <Icon className={isSm ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
      <span>{category}</span>
    </span>
  );
};

export default CategoryBadge;
