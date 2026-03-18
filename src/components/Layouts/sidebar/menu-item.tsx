import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useLocale } from "@/features/localization";
import { useSidebarContext } from "./sidebar-context";

const menuItemBaseStyles = cva(
  "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
  {
    variants: {
      isActive: {
        true: "bg-primary/10 text-primary dark:bg-primary/20",
        false:
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { closeSidebar, isMobile } = useSidebarContext();
  const { locale } = useLocale();
  const isRtl = locale === "ar";

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        onClick={() => isMobile && closeSidebar()}
        className={cn(
          menuItemBaseStyles({
            isActive: props.isActive,
            className: cn("relative block", isRtl ? "text-right" : "text-left"),
          }),
          props.className,
        )}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={props.isActive}
      className={menuItemBaseStyles({
        isActive: props.isActive,
        className: cn(
          "flex w-full items-center justify-between gap-3",
          isRtl ? "text-right" : "text-left",
        ),
      })}
    >
      {props.children}
    </button>
  );
}
