import styles from "./button.module.css";

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
};

export function Button({ href, children, variant = "primary", className = "" }: Props) {
  const cls = `${styles.btn} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <a className={cls} href={href}>
        {children}
      </a>
    );
  }

  return <button className={cls}>{children}</button>;
}
