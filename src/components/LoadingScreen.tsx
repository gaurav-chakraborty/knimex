import FileXLogo from './FileXLogo';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[200] backdrop-blur-sm">
      <div className="text-center space-y-4">
        <FileXLogo variant="icon" size="xl" linkToHome={false} className="animate-pulse" />
        <p className="text-filex-blue font-black uppercase tracking-[0.2em] text-xs animate-pulse">Loading FileX...</p>
      </div>
    </div>
  );
}
