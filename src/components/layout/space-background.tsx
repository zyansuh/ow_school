function generateStarField(count: number, size: number): string {
  const stars: string[] = [];
  const seed = count * 7 + size * 13;
  for (let i = 0; i < count; i++) {
    const x = ((seed * (i + 1) * 17) % 2000) / 20;
    const y = ((seed * (i + 1) * 23) % 2000) / 20;
    const opacity = 0.3 + ((seed * (i + 1) * 31) % 70) / 100;
    stars.push(`radial-gradient(${size}px ${size}px at ${x}% ${y}%, rgba(255,255,255,${opacity}) 0%, transparent 100%)`);
  }
  return stars.join(', ');
}

export function SpaceBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none motion-reduce:opacity-90" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-[#0a0a1a] to-gray-950" />
      <div className="absolute inset-0 opacity-20 blur-2xl motion-reduce:opacity-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-gradient-radial from-blue-900/30 via-purple-900/15 to-transparent" />
      </div>
      <div
        className="absolute inset-0 motion-reduce:animate-none"
        style={{ backgroundImage: generateStarField(50, 1) }}
      />
      <div className="absolute inset-0 bg-gray-950/40" />
    </div>
  );
}
