'use client';

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends LinkProps {
  children?: React.ReactNode;
  className?: string;
  activeClassName?: string;
  // Some props might be passed that are not in LinkProps, handle generically if needed
  [key: string]: any;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);

    // href is required in LinkProps
    const linkHref = href || "#";

    return (
      <Link
        ref={ref}
        href={linkHref}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };