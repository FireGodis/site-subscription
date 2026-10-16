import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fechou — saiba quanto cobrar pelo seu serviço",
  description: "Calcule um preço de referência com suas horas e custos. Organize clientes e propostas para seus serviços.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: { title: "Fechou — saiba quanto cobrar pelo seu serviço", description: "Calcule um preço com suas horas e custos. Organize clientes e propostas no mesmo lugar." }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

