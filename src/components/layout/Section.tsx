type SectionProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  background?: 'white' | 'light' | 'dark';
};

export default function Section({
  children,
  className = '',
  containerClassName = '',
  background = 'white',
}: SectionProps) {
  const bgColors = {
    white: 'bg-white',
    light: 'bg-neutral-50',
    dark: 'bg-neutral-900 text-white',
  };

  return (
    <section className={`py-16 md:py-24 ${bgColors[background]} ${className}`}>
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
} 