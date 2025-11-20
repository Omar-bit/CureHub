import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doctorProfileAPI } from "../services/api";
import toast from "react-hot-toast";

export const useDoctorProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch doctor profile
  useEffect(() => {
    if (!user || user.role !== "DOCTOR") {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await doctorProfileAPI.getMyProfile();
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching doctor profile:", err);
        setError(err.response?.data?.message || "Failed to load profile");
        // Initialize with empty profile if not found
        setProfile({});
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Update doctor profile
  const updateProfile = async (data) => {
    try {
      setLoading(true);
      const updated = await doctorProfileAPI.updateMyProfile(data);
      setProfile(updated);
      setError(null);
      toast.success("Profile updated successfully!");
      return updated;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to update profile";
      console.error("Update profile error:", {
        status: err.response?.status,
        message: message,
        data: err.response?.data,
      });
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
};
