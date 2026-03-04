"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isBodyStyle, type BodyStyle } from "@/lib/typography/body-style";

type TypographyContextValue = {
  typographyStyle: BodyStyle;
  setTypographyStyle: (style: BodyStyle) => void;
  toggleTypographyStyle: () => void;
};

const HeaderOffsetContext = createContext<number | null>(null);
const TypographyContext = createContext<TypographyContextValue | null>(null);

function getHeaderOffset() {
  const header = document.querySelector("header");
  return header instanceof HTMLElement ? header.offsetHeight : 0;
}

function readInitialTypographyStyle(): BodyStyle {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "sans";
  }

  const stored = window.localStorage.getItem("bodyStyle");
  const bodyDatasetStyle = document.body.dataset.typestyle;
  if (isBodyStyle(stored)) {
    return stored;
  }
  if (isBodyStyle(bodyDatasetStyle)) {
    return bodyDatasetStyle;
  }
  return "sans";
}

function HeaderOffsetProvider({ children }: { children: React.ReactNode }) {
  const [headerOffset, setHeaderOffset] = useState(0);

  useEffect(() => {
    const updateHeaderOffset = () => {
      setHeaderOffset(getHeaderOffset());
    };

    updateHeaderOffset();
    window.addEventListener("resize", updateHeaderOffset);

    const header = document.querySelector("header");
    const resizeObserver =
      header && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateHeaderOffset();
          })
        : null;

    if (resizeObserver && header) {
      resizeObserver.observe(header);
    }

    return () => {
      window.removeEventListener("resize", updateHeaderOffset);
      resizeObserver?.disconnect();
    };
  }, []);

  return <HeaderOffsetContext.Provider value={headerOffset}>{children}</HeaderOffsetContext.Provider>;
}

function TypographyProvider({ children }: { children: React.ReactNode }) {
  const [typographyStyle, setTypographyStyle] = useState<BodyStyle>(readInitialTypographyStyle);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    document.body.dataset.typestyle = typographyStyle;
    window.localStorage.setItem("bodyStyle", typographyStyle);
  }, [typographyStyle]);

  const toggleTypographyStyle = useCallback(() => {
    setTypographyStyle((previous) => (previous === "sans" ? "serif" : "sans"));
  }, []);

  const value = useMemo(
    () => ({
      typographyStyle,
      setTypographyStyle,
      toggleTypographyStyle
    }),
    [typographyStyle, toggleTypographyStyle]
  );

  return <TypographyContext.Provider value={value}>{children}</TypographyContext.Provider>;
}

export function UiEnvironmentProvider({ children }: { children: React.ReactNode }) {
  return (
    <HeaderOffsetProvider>
      <TypographyProvider>{children}</TypographyProvider>
    </HeaderOffsetProvider>
  );
}

export function useHeaderOffset() {
  const headerOffset = useContext(HeaderOffsetContext);
  if (headerOffset === null) {
    throw new Error("useHeaderOffset must be used within UiEnvironmentProvider.");
  }
  return headerOffset;
}

export function useTypography() {
  const typography = useContext(TypographyContext);
  if (!typography) {
    throw new Error("useTypography must be used within UiEnvironmentProvider.");
  }
  return typography;
}

export function useUiEnvironment() {
  const headerOffset = useHeaderOffset();
  const typography = useTypography();
  return {
    headerOffset,
    ...typography
  };
}
