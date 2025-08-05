import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save, X } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export function EditProfileDialog({ children, onProfileUpdate }) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    bio: user?.publicMetadata?.bio || "",
    location: user?.publicMetadata?.location || "",
    website: user?.publicMetadata?.website || "",
    twitter: user?.publicMetadata?.twitter || "",
    github: user?.publicMetadata?.github || "",
    linkedin: user?.publicMetadata?.linkedin || "",
  });

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || "",
        bio: user.publicMetadata?.bio || "",
        location: user.publicMetadata?.location || "",
        website: user.publicMetadata?.website || "",
        twitter: user.publicMetadata?.twitter || "",
        github: user.publicMetadata?.github || "",
        linkedin: user.publicMetadata?.linkedin || "",
      });
    }
  }, [user]);

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (user) {
        // Update user's full name
        if (formData.name !== user.fullName) {
          await user.update({
            firstName: formData.name.split(" ")[0] || "",
            lastName: formData.name.split(" ").slice(1).join(" ") || "",
          });
        }

        // Update user's public metadata with social links and bio
        await user.update({
          publicMetadata: {
            bio: formData.bio,
            location: formData.location,
            website: formData.website,
            twitter: formData.twitter,
            github: formData.github,
            linkedin: formData.linkedin,
          },
        });

        console.log("Profile updated successfully");
        setIsOpen(false);

        if (onProfileUpdate) {
          onProfileUpdate({
            id: user.id,
            name: formData.name,
            email: user.primaryEmailAddress?.emailAddress,
            image: user.imageUrl,
            ...formData,
          });
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenChange = (open) => {
    if (!open && user) {
      // Reset form data when closing
      setFormData({
        name: user.fullName || "",
        bio: user.publicMetadata?.bio || "",
        location: user.publicMetadata?.location || "",
        website: user.publicMetadata?.website || "",
        twitter: user.publicMetadata?.twitter || "",
        github: user.publicMetadata?.github || "",
        linkedin: user.publicMetadata?.linkedin || "",
      });
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Changes will be saved to your
            account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={user?.imageUrl}
                alt={user?.fullName || "User"}
              />
              <AvatarFallback className="text-lg">
                {getInitials(user?.fullName || "User")}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button type="button" variant="outline" size="sm" disabled>
                <Camera className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Photo changes coming soon
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your display name"
                required
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Social Links</h4>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <Label htmlFor="twitter">Twitter Username</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  @
                </span>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => handleChange("twitter", e.target.value)}
                  placeholder="username"
                  className="rounded-l-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="github">GitHub Username</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  github.com/
                </span>
                <Input
                  id="github"
                  value={formData.github}
                  onChange={(e) => handleChange("github", e.target.value)}
                  placeholder="username"
                  className="rounded-l-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  linkedin.com/in/
                </span>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => handleChange("linkedin", e.target.value)}
                  placeholder="username"
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
