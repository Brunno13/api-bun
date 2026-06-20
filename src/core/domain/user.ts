import { UserRole } from "../messages/messages";

export interface User {
  id: string | null;
  name: string;
  email: string;
  age: number;
  role: UserRole;
}
