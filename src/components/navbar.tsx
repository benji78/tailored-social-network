import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import NavBarItem from '@/components/nav-bar-item'
import ModeToggle from '@/components/mode-toggle'
import * as D from '@/components/ui/dropdown-menu'
import * as S from '@/components/ui/sheet'
import {
  BarChartHorizontal,
  BriefcaseBusiness,
  Building2,
  CircleUser,
  Home,
  LogIn,
  Menu,
  MessageCircle,
  User2,
  UserPlus2,
} from 'lucide-react'
import { useAuth } from '@/components/auth-context'
import Notifications from './Notifications/Notifications'
import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'

export function Navbar() {
  const { session, logOut } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')

  const NavItems = () =>
    session ? (
      <>
        <NavBarItem to="/" icon={Home} label="Home" />
        <NavBarItem to="/profile" icon={User2} label="Profile" />
        <NavBarItem to="/my-projects" icon={BriefcaseBusiness} label="My Projects" />
        <NavBarItem to="/leaderboard" icon={BarChartHorizontal} label="Leaderboard" />
        <NavBarItem to="/chat" icon={MessageCircle} label="Chat" />
        <NavBarItem to="/graph" icon={BarChartHorizontal} label="Graph" />
        <NavBarItem to="/friendRecommendation" icon={User2} label="Recommendations" />
      </>
    ) : (
      <>
        <NavBarItem to="/graph" icon={BarChartHorizontal} label="Graph" />
        <NavBarItem to="/login" icon={LogIn} label="Login" />
        <NavBarItem to="/signup" icon={UserPlus2} label="Sign Up" />
      </>
    )
  const handleLogOut = async () => {
    const error = await logOut()
    if (error) {
      alert(error.message)
    } else {
      navigate('/login')
    }
  }

  useEffect(() => {
    const fetchUsername = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase.from('users2').select('username').eq('auth_id', session.user.id).single()

        if (error) {
          console.error('Error fetching username:', error)
        } else {
          setUsername(data?.username)
        }
      }
    }

    void fetchUsername()
  }, [session?.user?.id])

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link className="flex items-center gap-2 font-semibold" to="/">
              <Building2 className="h-5 w-5" />
              <span className="">Tailored Social Network</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavItems />
            </nav>
          </div>
        </div>
      </div>
      <div className="flex h-screen flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <S.Sheet>
            <S.SheetTrigger asChild>
              <Button className="shrink-0 md:hidden" size="icon" variant="outline">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Afficher/cacher le menu de navigation</span>
              </Button>
            </S.SheetTrigger>
            <S.SheetContent className="flex flex-col" side="left">
              <nav className="grid gap-2 text-lg font-medium">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                  <Link className="flex items-center gap-2 text-lg font-semibold" to="/public">
                    <Building2 className="h-6 w-6" />
                    <span className="">Tailored Social Network</span>
                  </Link>
                </div>
                <NavItems />
              </nav>
            </S.SheetContent>
          </S.Sheet>
          <div className="w-full flex-1"></div>
          <ModeToggle />
          {session && (
            <>
              <Notifications />
              <D.DropdownMenu>
                <D.DropdownMenuTrigger asChild>
                  <Button className="rounded-full" size="icon" variant="secondary">
                    <CircleUser className="h-5 w-5" />
                    <span className="sr-only">Afficher/cacher le menu utilisateur</span>
                  </Button>
                </D.DropdownMenuTrigger>
                <D.DropdownMenuContent align="end">
                  <D.DropdownMenuLabel>{username}</D.DropdownMenuLabel>
                  <D.DropdownMenuSeparator />
                  <D.DropdownMenuItem onClick={handleLogOut}>Log Out</D.DropdownMenuItem>
                </D.DropdownMenuContent>
              </D.DropdownMenu>
            </>
          )}
        </header>
        <Outlet /> {/* children */}
      </div>
    </div>
  )
}
