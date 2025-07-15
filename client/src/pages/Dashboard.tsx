
import React from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useJoinGameMutation } from "@/lib/mutations";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const joinGame = useJoinGameMutation();

  const handleJoinRoom = async (gameType: "njuga" | "shansha" | "chinshingwa") => {
    try {
      const room = await joinGame.mutateAsync({ gameType });

      if (!room?.id) {
        throw new Error("No room ID returned from server");
      }

      navigate(`/${gameType}-room/${room.id}`, { state: { room } });
    } catch (error: any) {
      console.error("❌ Failed to join room:", error);
      toast({
        title: "Join Failed",
        description: error?.message || "Could not join game room.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Welcome, {user?.phone || "Player"}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => handleJoinRoom("njuga")} className="bg-blue-600 p-4 rounded text-white hover:bg-blue-700">
          Play Njuga
        </button>
        <button onClick={() => handleJoinRoom("shansha")} className="bg-green-600 p-4 rounded text-white hover:bg-green-700">
          Play Shansha
        </button>
        <button onClick={() => handleJoinRoom("chinshingwa")} className="bg-red-600 p-4 rounded text-white hover:bg-red-700">
          Play Chinshingwa
        </button>
      </div>
    </div>
  );
}
