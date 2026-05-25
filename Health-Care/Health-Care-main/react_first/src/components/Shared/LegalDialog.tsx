import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, FileText, AlertTriangle } from "lucide-react";

interface LegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

const LegalDialog = ({ open, onOpenChange, onAccept }: LegalDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="h-6 w-6 text-primary"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M3 12h4l3-9 4 18 3-9h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Important Legal Information
          </DialogTitle>
          <DialogDescription className="text-center">
            Before you continue, please review our legal policies. Your
            agreement is required to use HealthCare.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-6">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Privacy Policy:</h4>
              <p className="text-sm text-muted-foreground">
                Understand how we protect your personal and medical data.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Terms of Service:</h4>
              <p className="text-sm text-muted-foreground">
                Learn about your rights and responsibilities when using our
                platform.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Medical Disclaimer:</h4>
              <p className="text-sm text-muted-foreground">
                Acknowledge that our tool is for informational support only and
                not a substitute for professional advice.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onAccept} className="flex-1">
            Accept and Continue
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Review Policies
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalDialog;
