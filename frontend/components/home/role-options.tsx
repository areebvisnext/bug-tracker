import type { ReactNode } from "react";
import type { UserRole } from "@/lib/api";
import { DeveloperIcon, ManagerIcon, QAIcon } from "./role-icons";

export type RoleOption = {
  role: UserRole;
  title: string;
  description: string;
  icon: ReactNode;
  selectedIcon: ReactNode;
};

export const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "Manager",
    title: "Manager",
    description: "Signup as a manager to manage the tasks and bugs",
    icon: <ManagerIcon variant="outline" />,
    selectedIcon: <ManagerIcon variant="filled" />,
  },
  {
    role: "Developer",
    title: "Developer",
    description: "Signup as a Developer to assign the relevant task to QA",
    icon: <DeveloperIcon variant="outline" />,
    selectedIcon: <DeveloperIcon variant="filled" />,
  },
  {
    role: "QA",
    title: "QA",
    description: "Signup as a QA to create the bugs and report in tasks",
    icon: <QAIcon variant="outline" />,
    selectedIcon: <QAIcon variant="filled" />,
  },
];
