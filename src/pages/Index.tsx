// Update this page (the content is just a fallback if you fail to update the page)

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">AIGuard</h1>
        <p className="text-xl text-muted-foreground mb-6">Fake Job Offer Detection System</p>
        <Link to="/">
          <Button className="gap-2 bg-primary text-primary-foreground">
            <Home className="w-4 h-4" /> Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
