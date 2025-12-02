"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { showToastSuccess, showToastError } from "@/components/ui/alertToast";
import Image from "next/image";

export default function AddFilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pemasukkan");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (only jpg/jpeg/png)
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        showToastError("Hanya file gambar (JPG/PNG) yang diperbolehkan");
        return;
      }

      // Validate file size (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        showToastError("Ukuran file maksimal 3MB");
        return;
      }

      setSelectedFile(file);

      // Create preview for images
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      showToastError("Mohon pilih file terlebih dahulu");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", activeTab);

      const response = await fetch("/api/transaction/file", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      showToastSuccess("File berhasil diunggah!");
      router.push("/user/dashboard");
    } catch (error) {
      console.error("Error uploading file:", error);
      showToastError(
        error instanceof Error ? error.message : "Gagal mengunggah file"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Link href="/user/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-200 w-8 h-8 sm:w-10 sm:h-10"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Upload Transaksi</h1>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-4 sm:mb-6"
      >
        <TabsList className="grid w-full grid-cols-2 bg-gray-200 h-10 sm:h-12">
          <TabsTrigger
            value="pemasukkan"
            className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-green-500 text-sm sm:text-base"
          >
            Pemasukkan
          </TabsTrigger>
          <TabsTrigger
            value="pengeluaran"
            className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-red-500 text-sm sm:text-base"
          >
            Pengeluaran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pemasukkan" className="mt-4 sm:mt-6">
          <FileUploadForm
            type="pemasukkan"
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            fileInputRef={fileInputRef}
          />
        </TabsContent>

        <TabsContent value="pengeluaran" className="mt-4 sm:mt-6">
          <FileUploadForm
            type="pengeluaran"
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            fileInputRef={fileInputRef}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FileUploadFormProps {
  type: string;
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function FileUploadForm({
  type,
  selectedFile,
  previewUrl,
  onFileSelect,
  onRemoveFile,
  onSubmit,
  isSubmitting,
  fileInputRef,
}: FileUploadFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 sm:space-y-6 max-w-md mx-auto"
    >
      {/* File Preview */}
      {selectedFile && previewUrl && (
        <Card className="bg-gray-200 border-none shadow-lg">
          <CardContent className="pt-4 sm:pt-6">
            <div className="relative">
              <div className="relative">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                  width={500}
                  height={500}
                  style={{ maxHeight: "500px", objectFit: "contain" }}
                />
                {/* File Info Overlay */}
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                  <p className="text-xs truncate">
                    {selectedFile.name} •{" "}
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={onRemoveFile}
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full w-8 h-8 shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Options */}
      {!selectedFile && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={onFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all hover:shadow-md"
          >
            <Upload className="w-5 h-5 mr-2" />
            Pilih File Gambar
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Format: JPG, PNG (Maks.3MB)
          </p>
        </div>
      )}

      {/* Submit Button */}
      {selectedFile && (
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl ${
            type === "pemasukkan"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-500 hover:bg-red-600"
          } disabled:opacity-50 transition-all hover:shadow-lg`}
        >
          {isSubmitting ? "Mengunggah..." : "Upload Transaksi"}
        </Button>
      )}
    </form>
  );
}
