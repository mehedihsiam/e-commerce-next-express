import React from "react";
import VectorIcon, { TIconName } from "../VectorIcon";

type TProps = {
  alertCount?: number;
  iconName: TIconName;
  iconClassName?: string;
  buttonClassName?: string;
  onClick?: () => void;
};

export default function IconButton(props: TProps) {
  const { alertCount, iconName, iconClassName, buttonClassName, onClick } =
    props;

  // Build className directly to avoid hydration issues
  const baseClasses =
    "relative p-2 text-gray-600 hover:text-gray-900 transition-colors";
  const className = buttonClassName
    ? `${baseClasses} ${buttonClassName}`
    : baseClasses;

  return (
    <button className={className} onClick={onClick}>
      <VectorIcon name={iconName} className={iconClassName} />
      {alertCount ? (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {alertCount > 9 ? "9+" : alertCount}
        </span>
      ) : null}
    </button>
  );
}
