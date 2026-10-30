import { MobileDashboard } from "@/components/MobileDashboard";

export const metadata = {
  title: "Demo Sandbox • HabiVenture",
  description: "Interactive guest sandbox mode for HabiVenture with zero database connection.",
};

export default function DemoPage() {
  return <MobileDashboard isForcedDemo={true} />;
}
