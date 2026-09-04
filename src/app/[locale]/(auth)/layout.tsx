import type { ReactNode } from "react";
import { Compass } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="from-primary/10 via-background to-background flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex justify-center">
          <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
            <Compass className="size-5" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
