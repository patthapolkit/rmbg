"use client";

import { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImage(file);
      setProcessedImage(null);
      setError(null);
    }
  };

  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [originalImage]);

  useEffect(() => {
    if (processedImage) {
      const url = URL.createObjectURL(processedImage);
      setProcessedImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setProcessedImageUrl(null);
    }
  }, [processedImage]);

  const removeBackground = async () => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", originalImage);

    try {
      const res = await fetch(`${BACKEND_URL}/rmbg`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to remove background. Please try again.");
      }

      const blob = await res.blob();
      setProcessedImage(blob);
    } catch (error) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (processedImageUrl) {
      const link = document.createElement("a");
      link.href = processedImageUrl;
      link.download = "removed_background.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Background Remover
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500 font-semibold">
                    Click to upload
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          {previewUrl && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Original Image</h2>
              <Image
                src={previewUrl}
                alt="Original"
                className="max-w-full h-auto rounded-lg shadow-md"
                width={800}
                height={400}
              />
            </div>
          )}

          <Button
            onClick={removeBackground}
            disabled={!originalImage || isLoading}
            className="w-full mb-6"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Remove Background
              </>
            )}
          </Button>

          {error && <div className="text-red-500 mb-6">{error}</div>}

          {processedImageUrl && (
            <div>
              <div className="flex justify-between mb-3">
                <h2 className="text-lg font-semibold">Processed Image</h2>
                <Button onClick={downloadImage}>Download</Button>
              </div>
              <Image
                src={processedImageUrl}
                alt="Processed"
                className="max-w-full h-auto rounded-lg shadow-md"
                width={800}
                height={400}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
