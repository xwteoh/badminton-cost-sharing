export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {/* App Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <span className="text-3xl">🏸</span>
        </div>
        
        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        
        {/* App Name */}
        <h1 className="text-xl font-semibold text-foreground">
          Badminton Cost Tracker
        </h1>
        
        <p className="text-sm text-muted-foreground">
          Loading your session...
        </p>
      </div>
    </div>
  )
}