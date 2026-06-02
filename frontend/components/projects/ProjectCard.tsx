import { ReactNode } from "react";

interface ProductCardProps {
  title: string;
  description: string | null;
  completed: number;
  total: number;
  icon?: ReactNode;
  iconBg?: string;
  logo?: string | null;
  onEdit?: () => void;
}

export default function ProjectCard(props: ProductCardProps) {
  return (
    <div className="w-85 rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          {props.logo ? (
            <img
              src={props.logo}
              alt={`${props.title} logo`}
              className="h-11 w-11 rounded-md object-cover"
            />
          ) : (
            <div
              className={`w-11 h-11 rounded-md flex items-center justify-center ${props.iconBg}`}
            >
              {props.icon}
            </div>
          )}
        </div>
        {props.onEdit && (
          <button
            onClick={props.onEdit}
            className="text-gray-400 hover:text-gray-600 text-lg"
            title="Edit project"
          >
            ⋮
          </button>
        )}
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
