"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Camera, X } from "lucide-react";
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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("application/pdf")
      ) {
        showToastError("Hanya file gambar atau PDF yang diperbolehkan");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToastError("Ukuran file maksimal 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleOpenCamera = async () => {
    setCameraError("");
    setIsLoadingCamera(true);

    try {
      // Close any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToastError("Browser tidak mendukung akses kamera");
        setIsLoadingCamera(false);
        return;
      }

      // Request camera permission
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!stream) {
        showToastError("Gagal mendapatkan stream kamera");
        setIsLoadingCamera(false);
        return;
      }

      streamRef.current = stream;

      // Wait for video element to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready before setting active
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .then(() => {
              setIsCameraActive(true);
              setIsLoadingCamera(false);
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              showToastError("Gagal memutar video kamera");
              handleCloseCamera();
              setIsLoadingCamera(false);
            });
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      handleCloseCamera();
      setIsLoadingCamera(false);

      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setCameraError("Akses kamera ditolak");
          showToastError(
            "Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda, kemudian refresh halaman."
          );
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          setCameraError("Kamera tidak ditemukan");
          showToastError("Kamera tidak ditemukan pada perangkat ini.");
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          setCameraError("Kamera sedang digunakan");
          showToastError(
            "Kamera sedang digunakan aplikasi lain. Mohon tutup aplikasi tersebut."
          );
        } else if (error.name === "OverconstrainedError") {
          setCameraError("Kamera tidak mendukung resolusi");
          showToastError(
            "Kamera tidak mendukung resolusi yang diminta. Mencoba dengan resolusi default..."
          );
          // Try again with simpler constraints
          handleOpenCameraSimple();
        } else {
          setCameraError(error.message);
          showToastError("Gagal mengakses kamera: " + error.message);
        }
      }
    }
  };

  // Fallback function with simpler constraints
  const handleOpenCameraSimple = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
            setIsLoadingCamera(false);
          });
        };
      }
    } catch (error) {
      console.error("Error with simple constraints:", error);
      showToastError("Gagal mengakses kamera dengan pengaturan default");
      setIsLoadingCamera(false);
    }
  };

  const handleCapturePhoto = () => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
    ) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `capture-${Date.now()}.jpg`, {
                type: "image/jpeg",
              });
              setSelectedFile(file);
              setPreviewUrl(canvas.toDataURL("image/jpeg"));
              handleCloseCamera();
            }
          },
          "image/jpeg",
          0.9
        );
      }
    } else {
      showToastError("Video belum siap. Mohon tunggu sebentar.");
    }
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
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
      showToastError("Mohon pilih file atau ambil foto terlebih dahulu");
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

      showToastSuccess(
        "File berhasil diunggah! Silakan lengkapi detail transaksi."
      );

      // Redirect to transaction editing page
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
        onValueChange={(value) => {
          // Close camera when switching tabs
          if (isCameraActive) {
            handleCloseCamera();
          }
          setActiveTab(value);
        }}
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
            isCameraActive={isCameraActive}
            isLoadingCamera={isLoadingCamera}
            onFileSelect={handleFileSelect}
            onOpenCamera={handleOpenCamera}
            onCapturePhoto={handleCapturePhoto}
            onCloseCamera={handleCloseCamera}
            onRemoveFile={handleRemoveFile}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            fileInputRef={fileInputRef}
            videoRef={videoRef}
          />
        </TabsContent>

        <TabsContent value="pengeluaran" className="mt-4 sm:mt-6">
          <FileUploadForm
            type="pengeluaran"
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isCameraActive={isCameraActive}
            isLoadingCamera={isLoadingCamera}
            onFileSelect={handleFileSelect}
            onOpenCamera={handleOpenCamera}
            onCapturePhoto={handleCapturePhoto}
            onCloseCamera={handleCloseCamera}
            onRemoveFile={handleRemoveFile}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            fileInputRef={fileInputRef}
            videoRef={videoRef}
          />
        </TabsContent>
      </Tabs>

      {/* Camera Error Message */}
      {cameraError && !isCameraActive && !isLoadingCamera && (
        <div className="max-w-md mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-semibold">{cameraError}</p>
          <p className="text-xs text-red-500 mt-2">
            Petunjuk:
            <br />
            1. Klik ikon kamera di address bar browser
            <br />
            2. Pilih Allow atau Izinkan
            <br />
            3. Refresh halaman dan coba lagi
          </p>
        </div>
      )}
    </div>
  );
}

interface FileUploadFormProps {
  type: string;
  selectedFile: File | null;
  previewUrl: string | null;
  isCameraActive: boolean;
  isLoadingCamera: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCamera: () => void;
  onCapturePhoto: () => void;
  onCloseCamera: () => void;
  onRemoveFile: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

function FileUploadForm({
  type,
  selectedFile,
  previewUrl,
  isCameraActive,
  isLoadingCamera,
  onFileSelect,
  onOpenCamera,
  onCapturePhoto,
  onCloseCamera,
  onRemoveFile,
  onSubmit,
  isSubmitting,
  fileInputRef,
  videoRef,
}: FileUploadFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 sm:space-y-6 max-w-md mx-auto"
    >
      {/* Loading Camera State */}
      {isLoadingCamera && (
        <Card className="bg-gray-900 border-none overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
                <Camera className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold text-lg">
                  Membuka Kamera...
                </p>
                <p className="text-gray-400 text-sm">
                  Mohon izinkan akses kamera
                </p>
              </div>
              <div className="w-full max-w-xs bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="bg-white h-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera View - Live Preview */}
      {isCameraActive && !isLoadingCamera && (
        <Card className="bg-black border-none overflow-hidden shadow-2xl">
          <CardContent className="p-0 relative">
            {/* Live Indicator */}
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-semibold">LIVE</span>
            </div>

            {/* Camera Controls Info */}
            <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-white text-xs">
                Tekan tombol untuk foto
              </span>
            </div>

            {/* Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto min-h-[300px] object-cover"
              onLoadedMetadata={() => {
                console.log("Video metadata loaded");
              }}
            />

            {/* Camera Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
              <div className="flex justify-center items-center gap-6">
                {/* Capture Button - Main Action */}
                <Button
                  type="button"
                  onClick={onCapturePhoto}
                  className="bg-white text-black hover:bg-gray-200 rounded-full w-20 h-20 shadow-2xl transform hover:scale-105 transition-all duration-200 relative"
                >
                  <div className="absolute inset-2 border-4 border-black rounded-full"></div>
                  <Camera className="w-10 h-10" />
                </Button>

                {/* Close Button */}
                <Button
                  type="button"
                  onClick={onCloseCamera}
                  variant="destructive"
                  className="rounded-full w-14 h-14 shadow-lg hover:scale-105 transition-transform"
                >
                  <X className="w-8 h-8" />
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-center mt-4 space-y-1">
                <p className="text-white text-sm font-medium">
                  Arahkan kamera ke nota transaksi
                </p>
                <p className="text-gray-400 text-xs">
                  Pastikan foto jelas dan terbaca
                </p>
              </div>
            </div>

            {/* Grid Overlay for better composition */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="h-full w-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/20"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Preview with Enhanced UI */}
      {selectedFile && !isCameraActive && !isLoadingCamera && (
        <Card className="bg-gray-200 border-none shadow-lg">
          <CardContent className="pt-4 sm:pt-6">
            <div className="relative">
              {previewUrl ? (
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
              ) : (
                <div className="bg-gray-300 rounded-lg p-8 text-center">
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
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
      {!selectedFile && !isCameraActive && !isLoadingCamera && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={onFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all hover:shadow-md"
          >
            <Upload className="w-5 h-5 mr-2" />
            Pilih File
          </Button>

          <Button
            type="button"
            onClick={onOpenCamera}
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all hover:shadow-md"
          >
            <Camera className="w-5 h-5 mr-2" />
            Buka Kamera
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Format: JPG, PNG, PDF (Maks. 5MB)
          </p>
        </div>
      )}

      {/* Submit Button */}
      {selectedFile && !isCameraActive && !isLoadingCamera && (
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
