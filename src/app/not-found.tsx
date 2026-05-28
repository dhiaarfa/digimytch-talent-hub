import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-6xl font-bold bg-gradient-to-r from-[#030A8C] to-[#D10069] bg-clip-text text-transparent mb-4">
          404
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Page introuvable</h2>
        <p className="text-gray-500 mb-6">
          Cette page n&apos;existe pas sur Digimytch Talent Hub.
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-[#030A8C] to-[#D10069] text-white px-6 py-3 rounded-full text-sm font-medium hover:opacity-95 transition-opacity"
        >
          Retour à l&apos;accueil →
        </Link>
      </div>
    </div>
  );
}
