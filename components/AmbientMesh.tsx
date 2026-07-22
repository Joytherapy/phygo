export default function AmbientMesh() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full bg-electric/10 blur-[120px] animate-drift" />
      <div
        className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-emerald/10 blur-[120px] animate-drift"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-electric/5 blur-[100px] animate-drift"
        style={{ animationDelay: "-10s" }}
      />
      <div className="absolute inset-0 grain opacity-40" />
    </div>
  );
}
