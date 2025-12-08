import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <div className="h-8 w-8 bg-blue-500 rounded-lg"></div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到 YYC3 AI通话
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            使用您的账户登录智能对话系统
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            },
          }}
        />
      </div>
    </div>
  );
}