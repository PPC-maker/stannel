import { redirect } from 'next/navigation';

export default function HomePage() {
  // A server redirect avoids rendering an empty client page in Android WebView.
  redirect('/login');
}
