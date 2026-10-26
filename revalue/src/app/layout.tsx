export const metadata = { title: 'ReValue Australia' };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en-AU"><body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F7F6F2', color: '#0B1F3A' }}>{children}</body></html>;
}
