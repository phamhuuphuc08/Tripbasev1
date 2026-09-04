import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">TripBase</h1>
      <p className="text-muted-foreground text-balance">
        Trip operating system + mạng lưới uy tín cho nhóm/cá nhân/creator du
        lịch tự túc — lập kế hoạch, chia sẻ, và <strong>CopyPlan</strong> những
        lịch trình đã được nhiều người đi theo và tin dùng.
      </p>
      <div className="flex items-center justify-center gap-4 text-sm">
        <Link href="/trips" className="underline underline-offset-4">
          Trips
        </Link>
        <Link href="/explore" className="underline underline-offset-4">
          Explore
        </Link>
        <Link href="/saved" className="underline underline-offset-4">
          Saved Library
        </Link>
      </div>
    </main>
  );
}
