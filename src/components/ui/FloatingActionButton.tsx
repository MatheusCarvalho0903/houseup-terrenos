import Link from "next/link";
import { Plus } from "lucide-react";

export function FloatingActionButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="fixed bottom-20 right-5 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-floating transition duration-200 hover:bg-brand-dark hover:shadow-lg active:scale-[0.97] lg:bottom-7 lg:right-7"
    >
      <Plus className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
