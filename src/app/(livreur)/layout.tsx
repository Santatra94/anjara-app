import { LivreurShell } from "@/components/livreur/LivreurShell";

export default function LivreurGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LivreurShell>{children}</LivreurShell>;
}
