type BrandLogoProps = {
  className: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      className={className}
      src="/moe-logo.png"
      alt="Myanmar Online Entrepreneur"
    />
  )
}
