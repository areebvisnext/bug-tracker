import Image from "next/image";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  contentClassName?: string;
};

export function AuthSplitLayout({
  children,
  header,
  contentClassName = "max-w-[420px]",
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-[42%] shrink-0 lg:block">
        <Image
          src="/image.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="42vw"
        />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        {header ? (
          <div className="flex justify-end px-6 pt-8 sm:px-10 lg:px-12">
            {header}
          </div>
        ) : (
          <></>
        )}

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div className={`w-full ${contentClassName}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
