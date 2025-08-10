export type TUserRole = "customer" | "admin" | "moderator";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: TUserRole;
  addresses: string[];
  wishlist: string[];
  deleted: boolean;
  deletedBy?: string | null;
  restoredBy?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
