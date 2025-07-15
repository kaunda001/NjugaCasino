import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Wallet, Plus, Minus, Users, Settings, LogOut, Phone, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RoomModal } from '@/components/RoomModal';
import { GameRoom } from '@/components/GameRoom';
import { WalletModal } from '@/components/WalletModal';
import { ProfileModal } from '@/components/ProfileModal';
import { GameType, RoomInfo } from '@shared/schema';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<GameType | undefined>();

  const { data: roomsData } = useQuery({
    queryKey: ['/api/rooms'],
    refetchInterval: 2000,
  });

  const handleJoinRoom = (room: RoomInfo) => {
    setSelectedRoom(room);
  };

  const handleLeaveRoom = () => {
    setSelectedRoom(null);
  };

  const handleCreateRoom = (gameType: GameType) => {
    setSelectedGameType(gameType);
    setShowRoomModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (selectedRoom) {
    return <GameRoom room={selectedRoom} onLeave={handleLeaveRoom} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.displayName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {user?.phoneNumber}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wallet & Profile */}
          <div className="space-y-6">
            {/* Wallet Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Wallet</span>
                </CardTitle>
                <CardDescription>Manage your gaming balance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    K{user?.balance?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Available Balance</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => setShowWalletModal(true)} 
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Deposit</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowWalletModal(true)}
                    className="flex items-center space-x-2"
                  >
                    <Minus className="h-4 w-4" />
                    <span>Withdraw</span>
                  </Button>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <CreditCard className="h-4 w-4" />
                  <span>Airtel Money & MTN Mobile Money</span>
                </div>
              </CardContent>
            </Card>

            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Country:</span>
                    <span className="text-sm font-medium">{user?.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Date of Birth:</span>
                    <span className="text-sm font-medium">{user?.dateOfBirth}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowProfileModal(true)}
                >
                  Manage Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Game Lobbies */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Game Lobbies</span>
                </CardTitle>
                <CardDescription>Join or create game rooms</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="rooms" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="rooms">Available Rooms</TabsTrigger>
                    <TabsTrigger value="create">Create Room</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="rooms" className="mt-4">
                    <div className="space-y-4">
                      {roomsData?.rooms?.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 dark:text-gray-300">No rooms available</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Create a new room to start playing
                          </p>
                        </div>
                      ) : (
                        roomsData?.rooms?.map((room: RoomInfo) => (
                          <Card key={room.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{room.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {room.gameType.charAt(0).toUpperCase() + room.gameType.slice(1)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  <Badge variant="secondary">
                                    {room.currentPlayers}/{room.maxPlayers}
                                  </Badge>
                                  <p className="text-sm font-medium">K{room.stakes}</p>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => handleJoinRoom(room)}
                                  disabled={room.currentPlayers >= room.maxPlayers}
                                >
                                  Join
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="create" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCreateRoom('njuga')}>
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🃏</span>
                          </div>
                          <h3 className="font-semibold">Njuga</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Card matching game</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCreateRoom('shansha')}>
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💰</span>
                          </div>
                          <h3 className="font-semibold">Shansha</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Money grid game</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCreateRoom('chinshingwa')}>
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">👑</span>
                          </div>
                          <h3 className="font-semibold">Chinshingwa</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Checkers variant</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRoomModal && (
        <RoomModal
          isOpen={showRoomModal}
          onClose={() => setShowRoomModal(false)}
          gameType={selectedGameType}
        />
      )}
      
      {showWalletModal && (
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      )}
      
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}