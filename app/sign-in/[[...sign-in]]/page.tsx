import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-6">
      <SignIn />
    </div>
  );
}
