import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function EditProfileDialog({ children, onProfileUpdate, profileData }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profileData?.name || "",
    bio: profileData?.bio || "",
    location: profileData?.location || "",
    website: profileData?.website || "",
    twitter: profileData?.twitter || "",
    github: profileData?.github || "",
    linkedin: profileData?.linkedin || "",
  });

  // Update form data when profileData prop changes
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        website: profileData.website || "",
        twitter: profileData.twitter || "",
        github: profileData.github || "",
        linkedin: profileData.linkedin || "",
      });
    }
  }, [profileData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/profile?userId=${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${errorText}`);
      }

      const updatedProfile = await response.json();
      onProfileUpdate(updatedProfile);
      setOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder="Your display name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.bio.length}/500
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, Country"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="twitter">Twitter</Label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">@</span>
              <Input
                id="twitter"
                placeholder="username"
                value={formData.twitter}
                onChange={(e) =>
                  handleInputChange("twitter", e.target.value.replace("@", ""))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="github">GitHub</Label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">@</span>
              <Input
                id="github"
                placeholder="username"
                value={formData.github}
                onChange={(e) =>
                  handleInputChange("github", e.target.value.replace("@", ""))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">linkedin.com/in/</span>
              <Input
                id="linkedin"
                placeholder="username"
                value={formData.linkedin}
                onChange={(e) => handleInputChange("linkedin", e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
