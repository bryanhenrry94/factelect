"use client";
// components
import usetenant from "@/hooks/useTenant";
import IdentifyTenant from "@/components/auth/IdentifyTenant";
import { LoginForm } from "@/components/auth/login-form";
import Logo from "@/components/layout/shared/logo/Logo";

const Signin = () => {
  const { tenant } = usetenant();

  if (!tenant) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <IdentifyTenant />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex w-full justify-center">
          <Logo />
        </div>
        <LoginForm />
      </div>
    </div>
  );
};
export default Signin;
