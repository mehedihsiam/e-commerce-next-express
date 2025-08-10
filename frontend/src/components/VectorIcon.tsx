import { IoCartOutline, IoClose } from "react-icons/io5";
import { FaRegEye, FaRegEyeSlash, FaRegHeart, FaRegUser } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { MdOutlinePassword } from "react-icons/md";

export type TIconName =
  | "search"
  | "heart"
  | "cart"
  | "user"
  | "close"
  | "eye"
  | "eye-off"
  | "password";

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
    case "eye":
      return <FaRegEye className={className} />;
    case "eye-off":
      return <FaRegEyeSlash className={className} />;
    case "password":
      return <MdOutlinePassword className={className} />;
    default:
      break;
  }
}
