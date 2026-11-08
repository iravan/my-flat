import { SceneLoader } from "@/components/room/SceneLoader";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <main className="fixed inset-0 bg-black">
      <SceneLoader />
      <Toaster position="top-center" />
    </main>
  );
}
