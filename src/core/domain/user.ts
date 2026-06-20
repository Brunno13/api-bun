import { NotNull } from "drizzle-orm";

export interface User {
  id: number | null;
  name: string;
  email: string;
  age: number;
}
