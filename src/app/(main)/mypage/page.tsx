import { redirect } from 'next/navigation';

export default function MyPageRedirect() {
  redirect('/mypage/post');
}
