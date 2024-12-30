import Image from 'next/image'

export default function HomePage() {
  return (
    <>
      <Image
          src="/favicon.png"
          width={425}
          height={425}
          alt="A GIF showing a delete when the sibling is red"
      />
    </>
  );
}
