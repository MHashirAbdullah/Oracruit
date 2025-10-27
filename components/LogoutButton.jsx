"use client";
import { logOut } from "@/lib/actions/auth.action";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
const LogoutButton = ()  => {
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push("/sign-in");
  };

  return (
    <Button
    onClick={handleLogout}
    className="bg-red-600 text-white-500 hover:bg-red-700 cursor-pointer"
    >
    Logout
  </Button>
  );
}

export default LogoutButton;
