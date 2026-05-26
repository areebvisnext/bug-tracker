import { ChevronRightIcon } from "./icons";

type PrimaryButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
};

export function PrimaryButton({ children, loading }: PrimaryButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2B7FFF] px-6 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:bg-[#1a6fe8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex-1 text-center">{loading ? "Please wait…" : children}</span>
      {!loading && <ChevronRightIcon className="shrink-0" />}
    </button>
  );
}
