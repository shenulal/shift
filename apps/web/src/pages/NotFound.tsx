import { Button, Script } from '@/ui/kit';
export default function NotFound() {
  return (
    <div className="wrap section center stack gap-16" style={{ alignItems: 'center' }}>
      <Script size={44}>Every path leads somewhere.</Script>
      <h1 className="h2">This page isn’t here.</h1>
      <Button to="/" arrow>Back to home</Button>
    </div>
  );
}
