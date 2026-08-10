import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Dialog from "./Dialog";
import Button from "./Button";
import { setShowAuthDialog } from "@/features/slice";
import { FaLock } from "react-icons/fa";

export default function AuthDialog() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const showAuthDialog = useSelector((state) => state.slice.showAuthDialog);

  const handleClose = () => {
    dispatch(setShowAuthDialog(false));
  };

  const handleRedirect = (path) => {
    dispatch(setShowAuthDialog(false));
    navigate(path);
  };

  return (
    <Dialog
      isOpen={showAuthDialog}
      onClose={handleClose}
      title="Authentication Required"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleRedirect("/auth/login")}>
            Log In
          </Button>
          <Button variant="primary" onClick={() => handleRedirect("/auth/signup")}>
            Sign Up
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="w-16 h-16 bg-primary-soft rounded-full flex items-center justify-center text-primary">
          <FaLock size={28} />
        </div>
        <h3 className="text-xl font-bold text-text-primary">Unlock Your Solar Experience</h3>
        <p className="text-text-secondary text-sm max-w-xs">
          Please log in or sign up to add items to your cart, customize combo kits, and finalize your solar project configuration.
        </p>
      </div>
    </Dialog>
  );
}
