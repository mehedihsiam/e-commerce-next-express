import cn from "@/utils";
import React from "react";

type TProps = {
  className?: string;
};

export default function SingleLine({ className }: TProps) {
  return <div className={cn("border-b border-gray-200 py-2", className)} />;
}
