import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Wallet, Plus, Minus, Users, Settings, LogOut, Phone, CreditCard } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { GameJoinModal } from '@/components/GameJoinModal';
import { GameRoom } from '@/components/GameRoom';
import { WalletModal } from '@/components/WalletModal';
import { ProfileModal } from '@/components/ProfileModal';
import { GameType, RoomInfo } from '@shared/schema';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [showGameJoinModal, setShowGameJoinModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<GameType | undefined>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: roomsData } = useQuery({
    queryKey: ['/api/rooms'],
    refetchInterval: 2000,
  });

  const handleJoinRoom = (room: RoomInfo) => {
    // Navigate to the appropriate game room
    if (room.gameType === 'njuga') {
      navigate('/njuga-room', { state: { room } });
    } else if (room.gameType === 'shansha') {
      navigate('/shansha-room', { state: { room } });
    } else if (room.gameType === 'chinshingwa') {
      navigate('/chinshingwa-room', { state: { room } });
    }
  };

  const handleLeaveRoom = () => {
    setSelectedRoom(null);
  };

  const handleJoinGame = (gameType: GameType) => {
    setSelectedGameType(gameType);
    setShowGameJoinModal(true);
  };

  const joinGameMutation = useMutation({
    mutationFn: async (data: { gameType: GameType; stakes: number }) => {
      const res = await apiRequest('POST', '/api/rooms/join', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setShowGameJoinModal(false);
      
      // Navigate to appropriate game room
      if (selectedGameType === 'njuga') {
        navigate('/njuga-room');
      } else if (selectedGameType === 'shansha') {
        navigate('/shansha-room');
      } else if (selectedGameType === 'chinshingwa') {
        navigate('/chinshingwa-room');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

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
                    <div className="space-y-6">
                      {/* Njuga Rooms */}
                      <div>
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-3">
                          🃏 Njuga Rooms (2-6 Players)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[5, 10, 50, 100, 200, 500, 1000, 5000].map(stakes => {
                            const room = roomsData?.rooms?.find((r: RoomInfo) => r.gameType === 'njuga' && r.stakes === stakes);
                            return (
                              <Card key={`njuga-${stakes}`} className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-red-700 dark:text-red-300">K{stakes}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    {room ? `${room.currentPlayers}/${room.maxPlayers}` : '0/6'} players
                                  </div>
                                  <Button 
                                    onClick={() => handleJoinGame('njuga')}
                                    size="sm"
                                    className="w-full"
                                  >
                                    Join Game
                                  </Button>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      {/* Shansha Rooms */}
                      <div>
                        <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-3">
                          💰 Shansha Rooms (2 Players)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[50, 100, 200, 500, 1000, 5000].map(stakes => {
                            const room = roomsData?.rooms?.find((r: RoomInfo) => r.gameType === 'shansha' && r.stakes === stakes);
                            return (
                              <Card key={`shansha-${stakes}`} className="p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-700 dark:text-green-300">K{stakes}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    {room ? `${room.currentPlayers}/${room.maxPlayers}` : '0/2'} players
                                  </div>
                                  <Button 
                                    onClick={() => handleJoinGame('shansha')}
                                    size="sm"
                                    className="w-full"
                                  >
                                    Join Game
                                  </Button>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      {/* Chinshingwa Rooms */}
                      <div>
                        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3">
                          ♟️ Chinshingwa Rooms (2 Players)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[50, 100, 200, 500, 1000, 5000].map(stakes => {
                            const room = roomsData?.rooms?.find((r: RoomInfo) => r.gameType === 'chinshingwa' && r.stakes === stakes);
                            return (
                              <Card key={`chinshingwa-${stakes}`} className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">K{stakes}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    {room ? `${room.currentPlayers}/${room.maxPlayers}` : '0/2'} players
                                  </div>
                                  <Button 
                                    onClick={() => handleJoinGame('chinshingwa')}
                                    size="sm"
                                    className="w-full"
                                  >
                                    Join Game
                                  </Button>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="create" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800" onClick={() => handleCreateRoom('njuga')}>
                        <CardContent className="p-6 text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-3xl">🃏</span>
                          </div>
                          <h3 className="font-bold text-xl text-red-700 dark:text-red-300">Njuga</h3>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-2">2-6 Players • Card Game</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Form pairs & followers to win</p>
                          <div className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium">
                            Stakes: K5 - K5000
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800" onClick={() => handleCreateRoom('shansha')}>
                        <CardContent className="p-6 text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-3xl">💰</span>
                          </div>
                          <h3 className="font-bold text-xl text-green-700 dark:text-green-300">Shansha</h3>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-2">2 Players • Strategy Game</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Hide chips & guess positions</p>
                          <div className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium">
                            Stakes: K50 - K5000
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800" onClick={() => handleJoinGame('chinshingwa')}>
                        <CardContent className="p-6 text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-3xl">♟️</span>
                          </div>
                          <h3 className="font-bold text-xl text-blue-700 dark:text-blue-300">Chinshingwa</h3>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">2 Players • Board Game</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Brazilian checkers variant</p>
                          <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Stakes: K50 - K5000
                          </div>
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
      {showGameJoinModal && (
        <GameJoinModal
          isOpen={showGameJoinModal}
          onClose={() => setShowGameJoinModal(false)}
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