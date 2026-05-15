interface Props {
  text: string;
  className?: string;
}

export const GlitchTitle = ({ text, className = '' }: Props) => (
  <h1
    data-text={text}
    className={`glitch-text font-display font-black uppercase tracking-widest ${className}`}
  >
    {text}
  </h1>
);
