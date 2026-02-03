import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Events", path: "/events" },
    { name: "Problem Statements", path: "/problems" },
    { name: "Resources", path: "/resources" },
    isAdmin
      ? { name: "Dashboard", path: "/admin" }
      : { name: "Registration", path: "/registration" },
    { name: "Contact", path: "/contact" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">

        {/* ================= TOP ROW ================= */}
        <div className="h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/favicon.png"
              alt="Campuspreneurs Logo"
              className="w-9 h-9 rounded-lg"
            />
            <span className="font-semibold text-lg hidden sm:block">
              Campuspreneurs
            </span>
          </Link>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3 whitespace-nowrap">
            {user ? (
              <>
                <span className="flex items-center gap-1 text-sm text-muted-foreground max-w-[140px] truncate">
                  {isAdmin && <Shield className="w-4 h-4 text-secondary" />}
                  <User className="w-4 h-4" />
                  {user.email?.split("@")[0]}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild variant="orange" size="sm">
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-1" />
                  Login
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* ================= BOTTOM ROW (DESKTOP NAV) ================= */}
        <nav className="hidden md:flex h-12 items-center justify-center gap-6 bg-muted/40">

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${
                location.pathname === link.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* ================= MOBILE NAV ================= */}
        {isOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-md text-sm font-medium ${
                  location.pathname === link.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-4 mt-4 border-t">
              {user ? (
                <div className="px-4 space-y-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {isAdmin && <Shield className="w-4 h-4 text-secondary" />}
                    <User className="w-4 h-4" />
                    {user.email}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  asChild
                  variant="orange"
                  className="mx-4"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 mr-1" />
                    Login / Sign Up
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
