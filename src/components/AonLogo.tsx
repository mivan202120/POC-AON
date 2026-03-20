import Image from "next/image";

export default function AonLogo({
  height = 24,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    <Image
      src="/aon-logo.svg"
      alt="AON"
      width={Math.round(height * 2.56)}
      height={height}
      className={className}
      priority
    />
  );
}
