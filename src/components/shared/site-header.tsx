import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { getSession } from "@/server/auth/session";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="flex items-center gap-6 border-b px-6 py-4 text-sm">
      <Link href="/" className="font-semibold">
        TripBase
      </Link>
      <nav className="flex flex-1 gap-4">
        <Link href="/trips">Trips</Link>
        <Link href="/explore">Explore</Link>
        <Link href="/saved">Saved Library</Link>
      </nav>
      {session ? (
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">{session.name}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Đăng xuất
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button render={<Link href="/login" />} variant="ghost" size="sm">
            Đăng nhập
          </Button>
          <Button render={<Link href="/register" />} size="sm">
            Đăng ký
          </Button>
        </div>
      )}
    </header>
  );
}
