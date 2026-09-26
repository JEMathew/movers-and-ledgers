import NextLink from "next/link";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "small";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: LucideIcon;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "default", leadingIcon: Icon, children, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn("button", variant !== "primary" && variant, size === "small" && "small", className)} {...props}>
      {Icon && <Icon aria-hidden="true" size={17} />}
      {children}
    </button>
  );
});

export function IconButton({ label, icon: Icon, ...props }: Omit<ButtonProps, "children" | "aria-label"> & { label: string; icon: LucideIcon }) {
  return (
    <Button className="icon-button" aria-label={label} title={label} {...props}>
      <Icon aria-hidden="true" size={18} />
    </Button>
  );
}

export function Link({ href, children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <NextLink href={href} className={cn("font-semibold text-primary underline-offset-4 hover:underline", className)} {...props}>{children}</NextLink>;
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn("card p-5", className)} {...props}>{children}</article>;
}

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("panel p-6", className)} {...props}>{children}</section>;
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex min-h-6 items-center rounded-full border border-token bg-[var(--surface-subtle)] px-2.5 text-xs font-semibold text-secondary", className)}>{children}</span>;
}
