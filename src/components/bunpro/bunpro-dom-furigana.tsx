import { useInterfaceLanguage, uiT } from "../../features/interface-language/runtime";

import { createContext, useContext, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

const FuriganaContext = createContext({ hidden: false, questionKey: "" });
type RubyProps = ComponentPropsWithoutRef<"ruby"> & { base: string };

export function BunproFurigana({ hidden, questionKey, children }: { hidden: boolean; questionKey: string; children: ReactNode }) {
  useInterfaceLanguage();
  const value = useMemo(() => ({ hidden, questionKey }), [hidden, questionKey]);
  return <FuriganaContext.Provider value={value}>{children}</FuriganaContext.Provider>;
}

export function BunproRuby({ base, children, ...props }: RubyProps) {
  useInterfaceLanguage();
  const { hidden, questionKey } = useContext(FuriganaContext);
  return hidden ? <InteractiveRuby key={questionKey} base={base} {...props}>{children}</InteractiveRuby> : <ruby {...props}>{children}</ruby>;
}

function InteractiveRuby({ base, children, ...props }: RubyProps) {
  useInterfaceLanguage();
  const [pinned, setPinned] = useState(false);
  return <ruby {...props} role="button" tabIndex={0} aria-label={uiT("ui.dynamic_e0bb228e7acb", {value1: (base)})} aria-pressed={pinned} data-bunpro-review-furigana="hidden" data-pinned={pinned}
    onClick={(event) => { event.preventDefault(); event.stopPropagation(); setPinned(value => !value); }}
    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); if (!event.repeat) setPinned(value => !value); } }}>
    {children}
  </ruby>;
}
