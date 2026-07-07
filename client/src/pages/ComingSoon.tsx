export default function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      <p className="mt-2 text-gray-500">This section hasn't been built yet.</p>
    </div>
  );
}
