export default function Avatar({ src, name, size = 40 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User Avatar'}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div
      className="flex items-center justify-center rounded-full bg-slate-600 text-white font-bold"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {initials}
    </div>
  );
}