type HeadingProps = {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
};

export function PageTitle({ children, className = '', centered = false }: HeadingProps) {
  return (
    <h1 className={`text-4xl md:text-5xl font-serif mb-6 ${centered ? 'text-center' : ''} ${className}`}>
      {children}
    </h1>
  );
}

export function SectionTitle({ children, className = '', centered = false }: HeadingProps) {
  return (
    <h2 className={`text-3xl md:text-4xl font-serif mb-6 ${centered ? 'text-center' : ''} ${className}`}>
      {children}
    </h2>
  );
}

export function SubTitle({ children, className = '', centered = false }: HeadingProps) {
  return (
    <h3 className={`text-xl md:text-2xl font-serif mb-4 ${centered ? 'text-center' : ''} ${className}`}>
      {children}
    </h3>
  );
}

type TextProps = {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
  large?: boolean;
};

export function Text({ children, className = '', centered = false, large = false }: TextProps) {
  return (
    <p className={`${large ? 'text-lg md:text-xl' : 'text-base md:text-lg'} text-neutral-600 mb-6 leading-relaxed ${centered ? 'text-center' : ''} ${className}`}>
      {children}
    </p>
  );
}

export function ContentWrapper({ children, className = '', centered = false }: HeadingProps) {
  return (
    <div className={`max-w-prose mx-auto ${centered ? 'text-center' : ''} ${className}`}>
      {children}
    </div>
  );
} 