import { QRCodeSVG } from 'qrcode.react'

interface Props {
  uri: string
}

export function QRDisplay({ uri }: Props) {
  const isLong = uri.length > 2000

  return (
    <div className="flex flex-col items-center">
      {isLong && (
        <p className="text-warn text-xs mb-4 text-center max-w-md">
          This URI is {uri.length} characters. The QR code may not scan reliably. Use copy-paste instead.
        </p>
      )}
      <div className="bg-white p-6 rounded-sm border border-border inline-block">
        <QRCodeSVG
          value={uri}
          size={320}
          level={isLong ? 'L' : 'M'}
          bgColor="#FFFFFF"
          fgColor="#1A1A1A"
        />
      </div>
    </div>
  )
}
