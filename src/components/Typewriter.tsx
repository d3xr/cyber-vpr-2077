import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  speed?: number;
  onDone?: () => void;
  className?: string;
  showCursor?: boolean;
}

export const Typewriter = ({ text, speed = 30, onDone, className = '', showCursor = true }: Props) => {
  const [shown, setShown] = useState('');
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    setShown('');
    let i = 0;
    let cancelled = false;
    const id = window.setInterval(() => {
      if (cancelled) return;
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        onDoneRef.current?.();
      }
    }, speed);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [text, speed]);

  return (
    <span className={className}>
      {shown}
      {showCursor && shown.length < text.length && (
        <span className="text-nc-cyan animate-cursor">▮</span>
      )}
    </span>
  );
};
