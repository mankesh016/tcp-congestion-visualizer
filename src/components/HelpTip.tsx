interface HelpTipProps {
  text: string;
}

/** A small "(?)" that reveals an explanation on hover or keyboard focus. */
export function HelpTip({ text }: HelpTipProps) {
  return (
    <span className="help-tip">
      <span className="help-tip-trigger" tabIndex={0} aria-label={text}>
        ?
      </span>
      <span className="help-tip-content" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
