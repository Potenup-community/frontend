'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MessageCircle, BookOpen, Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleSignin } from '@/hooks/useGoogleSignin';

export default function SignIn() {
  const router = useRouter();
  const { signWithGoogle, isLoading: isGoogleLoading } = useGoogleSignin();

  const features = [
    {
      icon: BookOpen,
      title: '지식 공유',
      description: '개발 관련 지식과 경험을 공유하세요',
    },
    {
      icon: MessageCircle,
      title: '활발한 커뮤니티',
      description: '동료 개발자들과 소통하고 성장하세요',
    },
    {
      icon: Rocket,
      title: '스터디 모집',
      description: '함께 성장할 스터디 파트너를 찾아보세요',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      {/* Left Panel - Features (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-white font-bold text-2xl tracking-tight">POTENUP</span>
          </Link>
        </div>
        
        <div className="space-y-10 relative z-10">
          <div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              함께 배우고,<br />
              함께 성장해요
            </h1>
            <p className="text-white/80 text-xl leading-relaxed">
              포텐러들을 위한 따뜻한 커뮤니티
            </p>
          </div>
          
          <div className="space-y-5">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-white/20 group-hover:scale-105">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-white/50 text-sm relative z-10">
          © 2025 PotenUp Community. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-2xl">P</span>
              </div>
              <span className="font-bold text-3xl tracking-tight">PotenUp</span>
            </Link>
          </div>

          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">환영합니다!</h2>
                <p className="text-muted-foreground">
                  간편하게 로그인하고 커뮤니티에 참여하세요
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                </div>

                {/* Google Login Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-14 text-base font-medium border-2 hover:bg-muted/50"
                  onClick={signWithGoogle}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google로 계속하기
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground leading-relaxed">
                계속 진행하면{' '}
                <Link href="/terms" className="text-primary hover:underline font-medium">
                  이용약관
                </Link>
                {' '}및{' '}
                <Link href="/privacy" className="text-primary hover:underline font-medium">
                  개인정보처리방침
                </Link>
                에 동의하는 것으로 간주됩니다.
              </p>
            </CardContent>
          </Card>

          {/* Mobile Features */}
          <div className="lg:hidden mt-10 grid grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 transition-colors hover:bg-primary/20">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{feature.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
