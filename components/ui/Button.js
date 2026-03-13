import clsx from 'clsx';

const VARIANTS = {
  primary:   'bg-teal text-white hover:bg-teal-dark active:scale-[0.98] shadow-sm',
  secondary: 'bg-white text-navy border border-gray-200 hover:border-teal hover:text-teal',
  danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white',
  ghost:     'text-slate-600 hover:text-navy hover:bg-slate-100',
  navy:      'bg-navy text-white hover:bg-navy-dark active:scale-[0.98] shadow-sm',
};

const SIZES = {
  sm:  'px-3 py-1.5 text-xs font-semibold rounded-md',
  md:  'px-4 py-2 text-sm font-semibold rounded-lg',
  lg:  'px-6 py-3 text-sm font-bold rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', className, disabled, loading, children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center gap-2 transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant], SIZES[size], className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}
