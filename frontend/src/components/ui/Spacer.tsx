import React from "react";

type TProps = {
  height?: string;
  width?: string;
};

export default function Spacer({ height, width }: TProps) {
  return <div style={{ height, width }} />;
}
