import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  href?: string;
};

function BrandContent() {
  return (
    <>
      <Image
        src="/ThunderTalk_logo.png"
        alt="Thunder Talk logo"
        width={40}
        height={40}
        className="brand-logo"
        sizes="(max-width: 720px) 28px, 40px"
        priority
      />
      <span>Thunder Talk</span>
    </>
  );
}

export function Brand({ href }: BrandProps) {
  if (href) {
    return (
      <Link className="brand brand-with-logo" href={href} aria-label="Thunder Talk">
        <BrandContent />
      </Link>
    );
  }

  return (
    <div className="brand brand-with-logo" aria-label="Thunder Talk">
      <BrandContent />
    </div>
  );
}
