import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Alert, AlertDescription } from "./alert";

function BacklinkBadge() {
  const [copied, setCopied] = useState(false);

  const badgeCode = `<a href="https://directoryhunt.org" target="_blank" rel="dofollow" style="display: inline-flex; align-items: center; background: #000; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
  <svg style="width: 16px; height: 16px; margin-right: 6px;" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
  Featured on DirectoryHunt
</a>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(badgeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backlink Badge Required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            To qualify for the Support Launch plan, you need to add our badge to
            your website. This provides a backlink to DirectoryHunt.org and
            helps us grow our community.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">Badge Preview:</label>
          <div className="p-4 border rounded-lg bg-gray-50">
            <a
              href="https://directoryhunt.org"
              target="_blank"
              rel="dofollow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#000",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <svg
                style={{ width: "16px", height: "16px", marginRight: "6px" }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Featured on DirectoryHunt
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">HTML Code:</label>
          <div className="relative">
            <textarea
              readOnly
              value={badgeCode}
              className="w-full p-3 border rounded-lg bg-gray-50 text-sm font-mono resize-none"
              rows={6}
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            Add this badge to your website's footer or about page. After
            submission, we'll verify the backlink before approving your listing
            for dofollow links.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default BacklinkBadge;
