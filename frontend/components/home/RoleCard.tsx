import { ChevronRightIcon } from "@/components/auth/icons";

type RoleCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
};

export function RoleCard({
  title,
  description,
  icon,
  selected,
  onClick,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all hover:border-[#2B7FFF] ${
        selected
          ? "border-[#2B7FFF]/50 bg-[#2B7FFF]/6 shadow-sm hover:bg-[#2B7FFF]/10"
          : "border-transparent bg-white shadow-[0_2px_12px_rgba(15,23,42,0.08)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.1)]"
      }`}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold text-[#0F172A]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#64748B]">
          {description}
        </p>
      </div>
      {selected && (
        <ChevronRightIcon className="shrink-0 text-[#2B7FFF]" />
      )}
    </button>
  );
}
