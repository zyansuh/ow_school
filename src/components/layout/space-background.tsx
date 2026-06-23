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
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-[#0a0a1a] to-gray-950" />
      <div className="absolute inset-0 opacity-30 blur-3xl animate-nebula-drift-1">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-radial from-blue-900/40 via-purple-900/20 to-transparent" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-radial from-purple-900/30 via-indigo-900/15 to-transparent" />
      </div>
      <div className="absolute inset-0 opacity-20 blur-3xl animate-nebula-drift-2">
        <div className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full bg-gradient-radial from-pink-900/30 via-violet-900/15 to-transparent" />
      </div>
      <div className="absolute inset-0 animate-stars-drift-1" style={{ backgroundImage: generateStarField(120, 1) }} />
      <div className="absolute inset-0 animate-stars-drift-2" style={{ backgroundImage: generateStarField(60, 1.5) }} />
      <div className="absolute inset-0 animate-stars-twinkle" style={{ backgroundImage: generateStarField(20, 2) }} />
      <div className="absolute inset-0 bg-gray-950/40" />
    </div>
  );
}
