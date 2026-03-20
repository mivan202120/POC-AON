import { notFound } from "next/navigation";
import CaptureFlow from "@/components/CaptureFlow";

interface CapturePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function CapturePage({ params, searchParams }: CapturePageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  // Verify the JWT token and extract vehicle data
  const { verifySessionToken } = await import("@/lib/auth");
  const session = await verifySessionToken(token);

  if (!session || session.inspectionId !== id) {
    notFound();
  }

  return (
    <CaptureFlow
      inspectionId={id}
      token={token}
      vehicle={{
        make: session.vehicleMake,
        model: session.vehicleModel,
        color: session.vehicleColor,
        plate: session.vehiclePlate,
      }}
    />
  );
}
