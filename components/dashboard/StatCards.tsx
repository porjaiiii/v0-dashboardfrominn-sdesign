import Image from 'next/image'

interface StatCardProps {
  label: string
  value: string
  unit: string
  bgColor: string
  icon: string
  iconAlt: string
}

function StatCard({ label, value, unit, bgColor, icon, iconAlt }: StatCardProps) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: bgColor,
        borderRadius: 10,
        padding: 10,
        gap: 15,
        boxShadow: '0 0 15px rgba(0,0,0,0.25)',
        flex: 1,
        minHeight: 113,
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: 15, flex: 1, minWidth: 0 }}>
        <span
          className="text-center"
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '19px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: 36,
            fontWeight: 600,
            lineHeight: '59.4px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {value}
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '19px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {unit}
        </span>
      </div>
      <Image src={icon} alt={iconAlt} width={96} height={96} style={{ flexShrink: 0 }} />
    </div>
  )
}

interface SmallStatCardProps {
  label: string
  value: string
  unit: string
  bgColor: string
  icon: string
  iconAlt: string
}

function SmallStatCard({ label, value, unit, bgColor, icon, iconAlt }: SmallStatCardProps) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: bgColor,
        borderRadius: 10,
        padding: 10,
        gap: 15,
        boxShadow: '0 0 15px rgba(0,0,0,0.25)',
        flex: 1,
        minHeight: 113,
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: 15, flex: 1, minWidth: 0 }}>
        <span
          className="text-center"
          style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '19px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: 32,
            fontWeight: 600,
            lineHeight: '52px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {value}
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '19px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {unit}
        </span>
      </div>
      <Image src={icon} alt={iconAlt} width={80} height={80} style={{ flexShrink: 0 }} />
    </div>
  )
}

export default function StatCards() {
  return (
    <div className="flex flex-col" style={{ gap: 20 }}>
      {/* Top row: 2 large dark green cards */}
      <div className="flex" style={{ gap: 20 }}>
        <StatCard
          label="น้ำหนักขยะที่รวบรวมได้ทั้งหมด"
          value="456,480"
          unit="กิโลกรัม"
          bgColor="#154212"
          icon="/figma/tabler-icon-recycle-1.svg"
          iconAlt="recycle"
        />
        <StatCard
          label="จำนวนการลดการปล่อย CO ทั้งหมด"
          value="998,540"
          unit="kgCO2"
          bgColor="#154212"
          icon="/figma/tabler-icon-brand-onedrive.svg"
          iconAlt="co2"
        />
      </div>

      {/* Bottom row: 4 colored cards */}
      <div className="flex" style={{ gap: 20 }}>
        <SmallStatCard
          label="น้ำหนักขยะประเภทพลาสติก"
          value="456,480"
          unit="กิโลกรัม"
          bgColor="#6fc060"
          icon="/figma/tabler-icon-recycle-2.svg"
          iconAlt="plastic"
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทแก้ว"
          value="456,480"
          unit="กิโลกรัม"
          bgColor="#89b9ea"
          icon="/figma/tabler-icon-recycle-3.svg"
          iconAlt="glass"
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทกระดาษ"
          value="456,480"
          unit="กิโลกรัม"
          bgColor="#c06060"
          icon="/figma/tabler-icon-recycle-4.svg"
          iconAlt="paper"
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทอลูมิเนียม"
          value="998,540"
          unit="kgCO2"
          bgColor="#d7ce56"
          icon="/figma/tabler-icon-brand-onedrive-1.svg"
          iconAlt="aluminium"
        />
      </div>
    </div>
  )
}
