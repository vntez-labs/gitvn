import type { Metadata } from "next";
import GitVNLanding from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <GitVNLanding />;
}
