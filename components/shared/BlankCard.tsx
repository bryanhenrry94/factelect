"use client";

import React from "react";
import clsx from "clsx";

type Props = {
  className?: string;
  children: React.ReactNode;
};

const BlankCard = ({ children, className }: Props) => {
  return (
    <div
      className={clsx("relative rounded-2xl bg-white shadow-lg p-0", className)}
    >
      {children}
    </div>
  );
};

export default BlankCard;
