import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fechou — seu trabalho com preço justo e caixa em dia",
  description: "Calcule preços sem chute, envie propostas profissionais e acompanhe seus recebimentos em um só lugar.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: { title: "Fechou — clareza para cobrar bem", description: "Da conta ao combinado: organize seu trabalho autônomo." }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
