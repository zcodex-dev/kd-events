export function PublicFooter() {
  return (
    <footer className="bg-black border-t border-white/10 mt-0 py-6 sm:py-8 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Kompong Dewa Integrated Resort. All rights reserved.</p>
          <p className="text-[11px] text-neutral-500">
            Participation is restricted to guests aged 18 and older. Please game responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
