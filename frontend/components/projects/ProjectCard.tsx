import { ReactNode } from "react";

interface ProductCardProps {
  title: string;
  description: string;
  completed: number;
  total: number;
  icon?: ReactNode;
  iconBg?: string;
}

export default function ProjectCard(props: ProductCardProps) {
  return (
    <div className="w-85 rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-11 h-11 rounded-md flex items-center justify-center ${props.iconBg}`}
      >
        {props.icon}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-900">{props.title}</h3>

        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          {props.description}
        </p>

        <p className="mt-4 text-xs text-gray-600">
          Task Done:{" "}
          <span className="font-semibold text-gray-900">
            {props.completed}/{props.total}
          </span>
        </p>
      </div>
    </div>
  );
}
