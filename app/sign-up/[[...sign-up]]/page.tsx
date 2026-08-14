import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden max-w-full">
      <SignUp />
    </div>
  );
}
