import { IoCartOutline, IoClose } from "react-icons/io5";
import { FaRegHeart, FaRegUser } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";

export type TIconName = "search" | "heart" | "cart" | "user" | "close";

type TProps = {
  name: TIconName;
  className?: string;
};

export default function VectorIcon({ name, className }: TProps) {
  switch (name) {
    case "search":
      return <IoIosSearch className={className} />;
    case "heart":
      return <FaRegHeart className={className} />;
    case "cart":
      return <IoCartOutline className={className} />;
    case "user":
      return <FaRegUser className={className} />;
    case "close":
      return <IoClose className={className} />;
    default:
      break;
  }
}
