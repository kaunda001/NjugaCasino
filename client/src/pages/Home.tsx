import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { AuthModal } from '@/components/AuthModal';
import { GameJoinModal } from '@/components/GameJoinModal';
import { GameRoom } from '@/components/GameRoom';
import { GameType } from '@shared/schema';
import { 
  Play, 
  Users, 
  Gamepad2, 
  Grid3X3, 
  Target, 
  Wallet, 
  Trophy,
  Crown,
  Medal,
  Award
} from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { currentRoom } = useSocket();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGameJoinModal, setShowGameJoinModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<GameType | undefined>();

  const { data: leaderboardData } = useQuery({
    queryKey: ['/api/leaderboard'],
    enabled: isAuthenticated
  });

  const handleGameSelect = (gameType: GameType) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedGameType(gameType);
    setShowGameJoinModal(true);
  };

  const handleJoinRoom = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedGameType(undefined);
    setShowGameJoinModal(true);
  };

  // If user is in a room, show the game room
  if (currentRoom) {
    return (
      <GameRoom 
        room={currentRoom} 
        onLeave={() => window.location.reload()} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation Header */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-400">Njuga</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#games" className="text-slate-100 hover:text-blue-400 px-3 py-2 text-sm font-medium">Games</a>
                  <a href="#rooms" className="text-slate-400 hover:text-blue-400 px-3 py-2 text-sm font-medium">Rooms</a>
                  <a href="#leaderboard" className="text-slate-400 hover:text-blue-400 px-3 py-2 text-sm font-medium">Leaderboard</a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user && (
                <div className="bg-green-600/20 text-green-400 px-3 py-1 rounded-lg text-sm font-medium">
                  <Wallet className="h-4 w-4 inline mr-1" />
                  K{user.balance}
                </div>
              )}
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isAuthenticated ? 'Profile' : 'Sign In'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Real-Time Multiplayer
              <span className="text-blue-400 block">Gambling</span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Experience the thrill of three unique games: Njuga card matching, Shansha money grid, and Chinshingwa checkers. Play with friends in real-time!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Playing
              </Button>
              <Button
                onClick={handleJoinRoom}
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white px-8 py-3 text-lg"
              >
                <Users className="h-5 w-5 mr-2" />
                Join Room
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating Game Elements */}
        <div className="absolute top-20 left-10 animate-bounce">
          <div className="w-16 h-24 bg-gradient-to-b from-red-500 to-red-700 rounded-lg shadow-lg transform rotate-12 flex items-center justify-center text-white font-bold text-xs">
            A♠
          </div>
        </div>
        <div className="absolute bottom-20 right-10 animate-pulse">
          <div className="w-12 h-12 bg-yellow-500 rounded-full shadow-lg flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section id="games" className="py-16 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Game</h2>
            <p className="text-slate-400">Three unique multiplayer experiences with real-time betting</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Njuga Game Card */}
            <Card className="bg-slate-900 border-slate-700 hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Gamepad2 className="h-5 w-5 mr-2" />
                    Njuga
                  </h3>
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                    2-6 Players
                  </Badge>
                </div>
                <p className="text-slate-400 mb-4">
                  Card-based matching game. Create winning hands with pairs or consecutive cards. Draw, discard, and claim from the central pile.
                </p>
                
                {/* Game Preview */}
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="flex justify-center space-x-2 mb-2">
                    <div className="w-8 h-12 bg-gradient-to-b from-blue-500 to-blue-700 rounded text-white text-xs flex items-center justify-center">A♠</div>
                    <div className="w-8 h-12 bg-gradient-to-b from-red-500 to-red-700 rounded text-white text-xs flex items-center justify-center">A♥</div>
                    <div className="w-8 h-12 bg-gradient-to-b from-slate-600 to-slate-800 rounded border border-slate-500"></div>
                    <div className="w-8 h-12 bg-gradient-to-b from-slate-600 to-slate-800 rounded border border-slate-500"></div>
                  </div>
                  <div className="text-center text-xs text-green-400">Winning Pair!</div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Stakes: K5 - K5000</span>
                  <Button
                    onClick={() => handleGameSelect('njuga')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Join Room
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Shansha Game Card */}
            <Card className="bg-slate-900 border-slate-700 hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Grid3X3 className="h-5 w-5 mr-2" />
                    Shansha
                  </h3>
                  <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                    2 Players
                  </Badge>
                </div>
                <p className="text-slate-400 mb-4">
                  Money grid strategy game. Place 5 monetary values on your 4×6 grid, then guess your opponent's placements to split the pot.
                </p>
                
                {/* Game Preview */}
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-6 gap-1">
                    <div className="w-4 h-4 bg-slate-700 rounded-sm flex items-center justify-center text-xs">
                      <Wallet className="h-2 w-2 text-yellow-400" />
                    </div>
                    <div className="w-4 h-4 bg-slate-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-slate-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-slate-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-slate-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-slate-600 rounded-sm"></div>
                  </div>
                  <div className="text-center text-xs text-yellow-400 mt-2">Find Hidden Money!</div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Stakes: K10 - K1000</span>
                  <Button
                    onClick={() => handleGameSelect('shansha')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Join Room
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chinshingwa Game Card */}
            <Card className="bg-slate-900 border-slate-700 hover:shadow-2xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Chinshingwa
                  </h3>
                  <Badge variant="secondary" className="bg-red-600/20 text-red-400">
                    2 Players
                  </Badge>
                </div>
                <p className="text-slate-400 mb-4">
                  Classic checkers with betting twist. Forfeit penalties add strategic depth. Win by capturing all pieces or forcing forfeit.
                </p>
                
                {/* Game Preview */}
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-4 gap-1">
                    <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="w-6 h-6 bg-slate-600 rounded-full"></div>
                    <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="w-6 h-6 bg-slate-600 rounded-full"></div>
                    <div className="w-6 h-6 bg-slate-600 rounded-full"></div>
                    <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="w-6 h-6 bg-slate-600 rounded-full"></div>
                    <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-red-400 mt-2">Strategic Moves!</div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Stakes: K5 - K5000</span>
                  <Button
                    onClick={() => handleGameSelect('chinshingwa')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Join Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Leaderboard</h2>
            <p className="text-slate-400">Top players across all games</p>
          </div>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                {leaderboardData?.leaderboard?.length > 0 ? (
                  leaderboardData.leaderboard.map((entry: any, index: number) => (
                    <div key={entry.user?.id || index} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-slate-900' :
                          index === 1 ? 'bg-gray-400 text-slate-900' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-slate-600 text-white'
                        }`}>
                          {index === 0 ? <Crown className="h-4 w-4" /> :
                           index === 1 ? <Medal className="h-4 w-4" /> :
                           index === 2 ? <Award className="h-4 w-4" /> :
                           (index + 1)}
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          index % 3 === 0 ? 'bg-yellow-500' :
                          index % 3 === 1 ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}>
                          {entry.user.displayName?.charAt(0)?.toUpperCase() || entry.user.phoneNumber?.charAt(-1) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {entry.user.displayName || entry.user.phoneNumber}
                          </p>
                          <p className="text-sm text-slate-400">
                            {entry.stats.wins} wins • {entry.stats.gamesPlayed > 0 ? Math.round((entry.stats.wins / entry.stats.gamesPlayed) * 100) : 0}% win rate
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">K{entry.stats.totalWinnings}</div>
                        <div className="text-sm text-slate-400">Total winnings</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">No leaderboard data available yet</p>
                    <p className="text-sm text-slate-500">Start playing to see the top players!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Njuga</h3>
              <p className="text-slate-400 text-sm">
                Real-time multiplayer gambling platform with fair play and secure transactions.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Games</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400">Njuga Cards</a></li>
                <li><a href="#" className="hover:text-blue-400">Shansha Grid</a></li>
                <li><a href="#" className="hover:text-blue-400">Chinshingwa Checkers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400">Game Rules</a></li>
                <li><a href="#" className="hover:text-blue-400">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400">Responsible Gaming</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
            <p>&copy; 2025 Njuga. All rights reserved. Play responsibly.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      <GameJoinModal 
        isOpen={showGameJoinModal} 
        onClose={() => setShowGameJoinModal(false)}
        gameType={selectedGameType}
      />
    </div>
  );
}
